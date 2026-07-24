"""API routes for datepicker_env.

Supports two modes:
  - Single-task mode (--task flag): global active task, like gmail --user
  - Browse mode (no --task): task_id required in submit requests
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from backend.database import get_session, get_engine
from backend.models import TaskRecord, DateSubmission

router = APIRouter()
logger = logging.getLogger(__name__)

_TASKS_JSONL = Path(__file__).parent.parent / "tasks" / "test_tasks.jsonl"


def shipped_task_ids() -> set[str]:
    """Task ids we actually ship in the release test_tasks.jsonl.

    Returns an empty set if the file is missing (callers treat empty as
    "no filter" so behaviour is unchanged when the release list is absent).
    """
    ids: set[str] = set()
    try:
        with open(_TASKS_JSONL, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                d = json.loads(line)
                tid = d.get("id") or d.get("task_id")
                if tid:
                    ids.add(tid)
    except FileNotFoundError:
        pass
    return ids

_active_task: TaskRecord | None = None


def set_active_task(task_id: str) -> None:
    """Set the active task (called from app.py with --task flag)."""
    global _active_task
    with Session(get_engine()) as session:
        _active_task = session.get(TaskRecord, task_id)
        if _active_task:
            session.expunge(_active_task)


def get_active_task() -> TaskRecord:
    if _active_task is None:
        raise HTTPException(status_code=500, detail="No active task configured. Use --task flag.")
    return _active_task


# --- Request/Response models ---

class SubmitRequest(BaseModel):
    task_id: str = ""
    selected_value: str
    raw_payload: str = "{}"
    is_partial: bool = False


class SubmitResponse(BaseModel):
    task_completed: bool
    message: str
    submitted_value: str


class TaskInfo(BaseModel):
    task_id: str
    env_name: str
    instruction_text: str
    datepicker_type: str
    category: str
    initial_visible_state: dict
    constraint_type: str


# --- Routes ---

@router.get("/api/task")
def get_task():
    """Get the active task info. Never exposes canonical_answer."""
    task = get_active_task()
    task_data = json.loads(task.task_json)
    return TaskInfo(
        task_id=task.task_id,
        env_name=task.env_name,
        instruction_text=task.instruction_text,
        datepicker_type=task.datepicker_type,
        category=task.category,
        initial_visible_state=task_data.get("initial_visible_state", {}),
        constraint_type=task_data.get("constraint_type", "none"),
    )


@router.post("/api/submit", response_model=SubmitResponse)
def submit_answer(req: SubmitRequest, session: Session = Depends(get_session)):
    """Submit a date selection. Stores it and verifies via SQL.

    Resolves the task from req.task_id (browse mode) or the global active task (--task mode).
    """
    # Resolve task: prefer request body, fall back to global active task
    task_id = req.task_id
    if task_id:
        task = session.get(TaskRecord, task_id)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    else:
        task = get_active_task()

    # Clear previous submissions for this task so only the latest counts
    from sqlmodel import delete
    session.exec(delete(DateSubmission).where(DateSubmission.task_id == task.task_id))
    session.commit()

    # Store the new submission
    submission = DateSubmission(
        task_id=task.task_id,
        selected_value=req.selected_value,
        raw_payload=req.raw_payload,
        is_partial=req.is_partial,
    )
    session.add(submission)
    session.commit()

    # Run SQL-based verification
    task_data = json.loads(task.task_json)
    validation = task_data.get("validation", {})
    state_change_sql = validation.get("state_change_sql", "")

    task_completed = False
    if state_change_sql:
        try:
            from sqlalchemy import text
            with Session(get_engine()) as verify_session:
                result = verify_session.connection().execute(text(state_change_sql))
                row = result.fetchone()
                task_completed = bool(row and row[0] == 1)
        except Exception as e:
            return SubmitResponse(
                task_completed=False,
                message=f"Verification error: {e}",
                submitted_value=req.selected_value,
            )

    # Update task status
    db_task = session.get(TaskRecord, task.task_id)
    if db_task:
        db_task.status = "completed" if task_completed else "failed"
        db_task.updated_at = datetime.utcnow()
        session.add(db_task)
        session.commit()

    return SubmitResponse(
        task_completed=task_completed,
        message="✅ Correct!" if task_completed else "❌ Incorrect selection.",
        submitted_value=req.selected_value,
    )


@router.get("/api/verify")
def verify_task(session: Session = Depends(get_session)):
    """Check if the active task has been completed (run verification SQL)."""
    task = get_active_task()
    task_data = json.loads(task.task_json)
    validation = task_data.get("validation", {})
    state_change_sql = validation.get("state_change_sql", "")

    if not state_change_sql:
        return {"task_id": task.task_id, "task_completed": False, "message": "No verification SQL"}

    try:
        from sqlalchemy import text
        with Session(get_engine()) as s:
            result = s.connection().execute(text(state_change_sql))
            row = result.fetchone()
            completed = bool(row and row[0] == 1)
    except Exception:
        logger.exception("verification SQL failed for task %s", task.task_id)
        return {"task_id": task.task_id, "task_completed": False, "message": "Verification error"}

    return {"task_id": task.task_id, "task_completed": completed}


@router.get("/api/tasks")
def list_all_tasks(session: Session = Depends(get_session)):
    """List the shipped release tasks (browse mode)."""
    from sqlmodel import select
    tasks = session.exec(select(TaskRecord)).all()
    shipped = shipped_task_ids()
    if shipped:
        tasks = [t for t in tasks if t.task_id in shipped]
    return [
        {
            "task_id": t.task_id,
            "env_name": t.env_name,
            "category": t.category,
            "datepicker_type": t.datepicker_type,
            "instruction_text": t.instruction_text,
            "status": t.status,
        }
        for t in sorted(tasks, key=lambda x: x.task_id)
    ]


@router.get("/api/health")
def health():
    try:
        task = get_active_task()
        return {"status": "ok", "active_task": task.task_id, "env": task.env_name}
    except Exception:
        return {"status": "ok", "mode": "browse", "message": "No active task — use /api/tasks to browse"}


@router.get("/api/status")
def env_status(session: Session = Depends(get_session)):
    """Show ready vs pending envs and tasks."""
    from sqlmodel import select
    from pathlib import Path
    import json as _json

    tasks = session.exec(select(TaskRecord)).all()
    frontend_base = Path(__file__).parent.parent / "frontend" / "envs"

    # Restrict to the tasks we actually ship in the release test_tasks.jsonl.
    shipped = shipped_task_ids()
    if shipped:
        tasks = [t for t in tasks if t.task_id in shipped]

    envs: dict[str, list] = {}
    for t in sorted(tasks, key=lambda x: x.task_id):
        td = _json.loads(t.task_json)
        envs.setdefault(t.env_name, []).append({
            "task_id": t.task_id,
            "picker": t.datepicker_type,
            "task_type": td.get("task_type", "single"),
            "instruction": t.instruction_text[:80],
        })

    ready = []
    pending = []
    for env_name, env_tasks in sorted(envs.items()):
        env_dir = frontend_base / env_name
        # We ship a curated subset of scenarios — ignore DB env_names that have
        # no shipped frontend directory at all (not part of the release).
        if not env_dir.is_dir():
            continue
        has_dist = (env_dir / "dist").is_dir()
        entry = {
            "env_name": env_name,
            "task_count": len(env_tasks),
            "pickers": list(set(t["picker"] for t in env_tasks if t["task_type"] == "single")),
            "has_compound": any(t["task_type"] == "compound" for t in env_tasks),
            "tasks": env_tasks,
        }
        if has_dist:
            ready.append(entry)
        else:
            pending.append(entry)

    return {
        "ready_envs": len(ready),
        "ready_tasks": sum(e["task_count"] for e in ready),
        "pending_envs": len(pending),
        "pending_tasks": sum(e["task_count"] for e in pending),
        "total_envs": len(ready) + len(pending),
        "total_tasks": sum(e["task_count"] for e in ready) + sum(e["task_count"] for e in pending),
        "ready": ready,
        "pending": pending,
    }


@router.post("/api/admin/reset")
def admin_reset(session: Session = Depends(get_session)):
    """Clear all submissions. Works in both browse mode and --task mode."""
    from sqlmodel import delete, select
    session.exec(delete(DateSubmission))
    tasks = session.exec(select(TaskRecord)).all()
    for t in tasks:
        t.status = "active"
        t.updated_at = datetime.utcnow()
        session.add(t)
    session.commit()
    return {"reset": True, "tasks_reset": len(tasks)}
