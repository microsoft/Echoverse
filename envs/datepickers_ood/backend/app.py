"""FastAPI app for datepicker_env.

Usage:
    python -m backend.app --port 5400 --db ./datepicker_ood_grounded.db --task task_0001

The --task flag controls:
  1. Which frontend environment to serve (looked up from task's env_name)
  2. Which ground truth to verify against
  3. What instructions/constraints to show the agent

Like gmail's --user flag but for tasks instead of users.
"""
from __future__ import annotations

import argparse
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from backend.database import init_db, set_db_path, get_engine, get_engine_for
from backend.routes import router, set_active_task

_frontend_base = Path(__file__).parent.parent / "frontend" / "envs"
_screenshots_dir = Path(__file__).parent.parent / "screenshots" / "selected"
_active_env_name: str = ""


def _safe_path(base: Path, *parts: str) -> Path | None:
    """Resolve ``base``/``parts`` and return it only if it stays inside ``base``.

    Prevents path traversal: any ``..`` or absolute component that escapes ``base``
    yields ``None``.
    """
    base_real = os.path.realpath(base)
    target_real = os.path.realpath(os.path.join(base_real, *(str(p) for p in parts)))
    if target_real == base_real or target_real.startswith(base_real + os.sep):
        return Path(target_real)
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Datepicker Env", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()


def mount_frontend(app: FastAPI, env_name: str):
    """Mount the correct frontend based on the active task's env_name."""
    global _active_env_name
    _active_env_name = env_name
    env_dist = _frontend_base / env_name / "dist"
    if not env_dist.is_dir():
        print(f"  ⚠️  Frontend not built for env '{env_name}' at {env_dist}")
        return

    # Mount assets
    assets_dir = env_dist / "assets"
    if assets_dir.is_dir():
        from fastapi.staticfiles import StaticFiles
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/task/{task_id}")
def serve_task_page(task_id: str, db: str | None = None):
    """Serve the frontend for a specific task (browse-mode per-task access).

    ``db`` optionally selects a non-primary DB (e.g. datepicker_2k.db) so the
    /eval page can open tasks that live in a different DB but share the task_id
    namespace with the primary DB.
    """
    from sqlmodel import Session as SqlSession
    from backend.models import TaskRecord
    eng = get_engine_for(db) if db else get_engine()
    with SqlSession(eng) as session:
        task = session.get(TaskRecord, task_id)
    if not task:
        return JSONResponse({"error": f"Task not found: {task_id}"}, status_code=404)

    env_dist = _frontend_base / task.env_name / "dist"
    index = env_dist / "index.html"
    if index.is_file():
        import json
        task_data = json.loads(task.task_json)
        html = index.read_text()
        # Rewrite asset paths from /assets/... to /assets/{env_name}/...
        html = html.replace('"/assets/', f'"/assets/{task.env_name}/')
        html = html.replace("'/assets/", f"'/assets/{task.env_name}/")
        # Build the inject script — include both active task and all env tasks for multi-widget
        ivs = json.dumps(task_data.get("initial_visible_state", {}))
        ct = json.dumps(task_data.get("constraint_type", "none"))
        it = json.dumps(task.instruction_text)
        wid = json.dumps(task_data.get("widget_id", ""))
        task_type_val = json.dumps(task_data.get("task_type", "single"))
        compound_parts_val = json.dumps(task_data.get("compound_parts", {}))

        # Find all tasks for this env (for multi-widget submit routing)
        from sqlmodel import Session as SqlSession2, select as sql_select2
        env_tasks_js = "[]"
        with SqlSession2(eng) as s2:
            all_env_tasks = s2.exec(
                sql_select2(TaskRecord).where(TaskRecord.env_name == task.env_name)
            ).all()
            env_tasks_list = []
            for et in all_env_tasks:
                etd = json.loads(et.task_json)
                env_tasks_list.append({
                    "task_id": et.task_id,
                    "widget_id": etd.get("widget_id", ""),
                    "instruction_text": et.instruction_text,
                })
            env_tasks_js = json.dumps(env_tasks_list)

        inject = (
            "<script>\n"
            "window.__ACTIVE_TASK__ = {\n"
            f'  task_id: "{task.task_id}",\n'
            f'  env_name: "{task.env_name}",\n'
            f'  instruction_text: {it},\n'
            f'  datepicker_type: "{task.datepicker_type}",\n'
            f'  category: "{task.category}",\n'
            f'  widget_id: {wid},\n'
            f'  task_type: {task_type_val},\n'
            f'  compound_parts: {compound_parts_val},\n'
            f'  initial_visible_state: {ivs},\n'
            f'  constraint_type: {ct}\n'
            "};\n"
            # For single-widget envs, only include the active task in __ENV_TASKS__
            # so the widget_id lookup in main.tsx always resolves to the correct task_id
            f"window.__ENV_TASKS__ = {env_tasks_js};\n"
            "// Patch: override fetch to always use the injected task_id\n"
            "(function() {\n"
            "  var origFetch = window.fetch;\n"
            "  window.fetch = function(url, opts) {\n"
            "    if (url === '/api/submit' && opts && opts.body) {\n"
            "      try {\n"
            "        var body = JSON.parse(opts.body);\n"
            f"        body.task_id = '{task.task_id}';\n"
            "        opts = Object.assign({}, opts, {body: JSON.stringify(body)});\n"
            "      } catch(e) {}\n"
            "    }\n"
            "    return origFetch.call(this, url, opts);\n"
            "  };\n"
            "})();\n"
            "// Suppress alert dialogs so the agent isn't blocked\n"
            "window.alert = function() {};\n"
            "window.confirm = function() { return true; };\n"
            "</script>\n"
            # Intercept fetch to /api/submit — record every submission attempt.
            # Also auto-click submit buttons after date clicks.
            "<script>\n"
            "document.addEventListener('DOMContentLoaded', function() {\n"
            # Enable all disabled buttons every 300ms
            "  setInterval(function() {\n"
            "    document.querySelectorAll('button[disabled]').forEach(function(b) {\n"
            "      b.removeAttribute('disabled'); b.style.opacity='1'; b.style.cursor='pointer';\n"
            "    });\n"
            "  }, 300);\n"
            # Auto-click submit buttons 500ms and 2000ms after any non-submit button click
            "  var KW = /submit|confirm|book|schedule|reserve|apply|save|search|done|finalize|proceed|complete/i;\n"
            "  document.addEventListener('click', function(e) {\n"
            "    var el = e.target;\n"
            "    if (!el) return;\n"
            "    var t = (el.textContent||'').trim();\n"
            "    if (KW.test(t)) return;\n"
            "    function clickSubmits() {\n"
            "      document.querySelectorAll('button').forEach(function(b) {\n"
            "        if (KW.test(b.textContent) && !b.disabled) b.click();\n"
            "      });\n"
            "    }\n"
            "    setTimeout(clickSubmits, 500);\n"
            "    setTimeout(clickSubmits, 2000);\n"
            "  }, true);\n"
            "});\n"
            "</script>"
        )
        html = html.replace("</head>", inject + "\n</head>")
        from fastapi.responses import HTMLResponse
        return HTMLResponse(html)

    return JSONResponse({"error": f"Frontend not built for env '{task.env_name}'"}, status_code=503)


@app.get("/assets/{env_name}/{rest:path}")
def serve_env_asset(env_name: str, rest: str):
    """Serve assets for a specific env's frontend."""
    filepath = _safe_path(_frontend_base, env_name, "dist", "assets", rest)
    if filepath is not None and filepath.is_file():
        return FileResponse(str(filepath))
    raise HTTPException(status_code=404, detail="Asset not found")






@app.get("/api/tasks/{task_id}")
def get_task_by_id(task_id: str):
    """Get a specific task's info (for per-task pages). Never exposes canonical_answer."""
    from sqlmodel import Session as SqlSession
    from backend.models import TaskRecord
    with SqlSession(get_engine()) as session:
        task = session.get(TaskRecord, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    import json
    task_data = json.loads(task.task_json)
    return {
        "task_id": task.task_id,
        "env_name": task.env_name,
        "instruction_text": task.instruction_text,
        "datepicker_type": task.datepicker_type,
        "category": task.category,
        "initial_visible_state": task_data.get("initial_visible_state", {}),
        "constraint_type": task_data.get("constraint_type", "none"),
    }


@app.get("/screenshots/selected/{filename}")
def serve_screenshot(filename: str):
    """Serve a selected screenshot."""
    filepath = _safe_path(_screenshots_dir, filename)
    if filepath is not None and filepath.is_file() and filepath.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
        media = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
        return FileResponse(str(filepath), media_type=media.get(filepath.suffix.lower(), "image/png"))
    raise HTTPException(status_code=404, detail="Screenshot not found")


@app.get("/api/dashboard/state")
def dashboard_state():
    """Dashboard state: tasks paired with screenshots + pipeline status."""
    import json as _json
    from sqlmodel import Session as SqlSession, select as sql_select
    from backend.models import TaskRecord, DateSubmission

    with SqlSession(get_engine()) as session:
        tasks = session.exec(sql_select(TaskRecord)).all()
        submissions = session.exec(sql_select(DateSubmission)).all()

    # Restrict the dashboard to the tasks we actually ship (release test_tasks.jsonl).
    from backend.routes import shipped_task_ids
    _shipped = shipped_task_ids()
    if _shipped:
        tasks = [t for t in tasks if t.task_id in _shipped]

    task_list = []
    for t in sorted(tasks, key=lambda x: x.task_id):
        td = _json.loads(t.task_json)
        task_list.append({
            "task_id": t.task_id,
            "env_name": t.env_name,
            "category": t.category,
            "datepicker_type": t.datepicker_type,
            "instruction_text": t.instruction_text,
            "status": t.status,
            "canonical_answer": t.canonical_answer,
        })

    # Load screenshot manifest for pairing
    manifest_path = _screenshots_dir.parent / "selected_manifest.json"
    screenshot_entries = []
    if manifest_path.exists():
        manifest = _json.loads(manifest_path.read_text())
        entries = manifest if isinstance(manifest, list) else manifest.get("entries", [])
        for entry in entries:
            rank = entry.get("rank") or entry.get("selected_rank", 0)
            screenshot_entries.append({
                "rank": rank,
                "file": f"/screenshots/selected/diverse_{rank:03d}.png",
                "file_size": entry.get("file_size", 0),
            })

    # Pipeline status
    pipeline_status_path = Path(__file__).parent.parent / "artifacts" / "pipeline_status.json"
    pipeline_steps = []
    if pipeline_status_path.exists():
        try:
            pipeline_steps = _json.loads(pipeline_status_path.read_text()).get("steps", [])
        except Exception:
            pass

    # Page build progress: only count env_names that actually ship a frontend
    # directory (we ship a curated subset of scenarios, not every DB env_name).
    shipped_envs = {t["env_name"] for t in task_list if (_frontend_base / t["env_name"]).is_dir()}
    total_envs = len(shipped_envs)
    env_names_with_dist = {e for e in shipped_envs if (_frontend_base / e / "dist").is_dir()}
    envs_with_dist = len(env_names_with_dist)

    return {
        "task_count": len(task_list),
        "screenshot_count": len(screenshot_entries),
        "completed_count": sum(1 for t in tasks if t.status == "completed"),
        "submission_count": len(submissions),
        "tasks": task_list,
        "screenshots": screenshot_entries,
        "pipeline_steps": pipeline_steps,
        "page_build_progress": {
            "built": envs_with_dist,
            "total": total_envs,
        },
    }


@app.get("/dashboard")
def serve_dashboard():
    """Serve the dashboard page."""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(_dashboard_html())


def _dashboard_html() -> str:
    """Dashboard showing 100 screenshots paired with tasks."""
    return """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Datepicker Pipeline Dashboard</title>
<style>
:root{--bg:#0f172a;--card:#1e293b;--text:#e2e8f0;--accent:#38bdf8;--muted:#94a3b8;--green:#4ade80;--red:#f87171}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:1400px;margin:0 auto}
h1{color:var(--accent);margin-bottom:8px;font-size:1.6rem}
h2{color:var(--accent);margin:28px 0 12px;font-size:1.15rem}
.sub{color:var(--muted);margin-bottom:24px;font-size:0.9rem}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.stat{background:var(--card);border-radius:8px;padding:14px 22px;text-align:center}
.stat-num{font-size:2rem;font-weight:700;color:var(--accent)}
.stat-num.green{color:var(--green)}
.stat-label{font-size:0.75rem;color:var(--muted);margin-top:2px}
.nav{display:flex;gap:16px;margin-bottom:20px;font-size:0.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.card{background:var(--card);border-radius:10px;overflow:hidden;transition:transform 0.15s}
.card:hover{transform:translateY(-2px)}
.card img{width:100%;height:180px;object-fit:cover;display:block;background:#162032}
.card-body{padding:12px 14px}
.card-title{font-weight:600;font-size:0.9rem;margin-bottom:4px}
.card-meta{font-size:0.78rem;color:var(--muted);margin-bottom:6px}
.card-instruction{font-size:0.78rem;color:var(--text);line-height:1.4;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-answer{font-size:0.72rem;color:var(--green);font-family:monospace;background:#0f2918;padding:3px 8px;border-radius:4px;display:inline-block}
.card-link{display:inline-block;margin-top:8px;font-size:0.8rem;color:var(--accent)}
.filter-bar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.filter-btn{background:var(--card);border:1px solid #334155;color:var(--text);padding:5px 14px;border-radius:6px;cursor:pointer;font-size:0.8rem}
.filter-btn:hover,.filter-btn.active{border-color:var(--accent);color:var(--accent)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.step-active{animation:pulse 1.5s ease-in-out infinite;color:#4ade80}
#pipeline-status{background:var(--card);border-radius:10px;padding:18px 24px;margin-bottom:24px}
#pipeline-status h3{color:var(--accent);font-size:1rem;margin-bottom:12px}
.pipeline-steps{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.pipeline-step{font-size:0.85rem;padding:4px 10px;border-radius:6px;background:#162032}
.pipeline-step.done{color:var(--green)}
.pipeline-step.pending{color:var(--muted)}
.progress-bar-container{background:#162032;border-radius:6px;height:8px;overflow:hidden;margin-top:8px}
.progress-bar-fill{height:100%;background:var(--green);border-radius:6px;transition:width 0.5s ease}
.progress-label{font-size:0.78rem;color:var(--muted);margin-top:4px}
</style></head><body>
<h1>Datepicker Pipeline Dashboard</h1>
<div class="sub" id="dash-sub">Loading…</div>
<div id="pipeline-status">
  <h3>Pipeline Status</h3>
  <div class="pipeline-steps" id="pipeline-steps">Loading...</div>
  <div class="progress-bar-container"><div class="progress-bar-fill" id="progress-bar" style="width:0%"></div></div>
  <div class="progress-label" id="progress-label"></div>
</div>
<div class="nav">
  <a href="/">Browse Tasks</a>
  <a href="/api/dashboard/state" target="_blank">API State</a>
  <a href="/api/tasks" target="_blank">API Tasks</a>
</div>
<div class="stats" id="stats"></div>
<div class="filter-bar" id="filters"></div>
<h2>Screenshots + Tasks</h2>
<div class="grid" id="grid"></div>
<script>
let allData = null;
let activeFilter = 'all';

function renderPipeline(d) {
  var steps = d.pipeline_steps || [];
  var bp = d.page_build_progress || {built:0, total:0};
  var stepsEl = document.getElementById('pipeline-steps');
  if (steps.length === 0) {
    var defaultSteps = [
      {name:'Generate Tasks', status: d.task_count > 0 ? 'done' : 'pending'},
      {name:'Seed DB', status: d.task_count > 0 ? 'done' : 'pending'},
      {name:'Build Pages', status: bp.built > 0 ? (bp.built >= bp.total ? 'done' : 'active') : 'pending'},
      {name:'Run Eval', status:'pending'}
    ];
    steps = defaultSteps;
  }
  stepsEl.innerHTML = steps.map(function(s){
    var icon = s.status === 'done' ? '✅' : s.status === 'active' ? '🟢' : '⬜';
    var cls = s.status === 'active' ? 'step-active' : s.status === 'done' ? 'done' : 'pending';
    return '<span class="pipeline-step '+cls+'">'+icon+' '+s.name+'</span>';
  }).join(' → ');
  var pct = bp.total > 0 ? Math.round(100*bp.built/bp.total) : 0;
  var subEl = document.getElementById('dash-sub');
  if (subEl) subEl.textContent = (d.task_count||0) + ' shipped datepicker tasks (release test set) — screenshot-conditioned UI generation';
  document.getElementById('progress-bar').style.width = pct+'%';
  document.getElementById('progress-label').textContent = 'Page build: '+bp.built+'/'+bp.total+' envs ('+pct+'%)';
}

async function load() {
  try {
    const res = await fetch('/api/dashboard/state', {headers:{'Accept':'application/json'},cache:'no-store'});
    const d = await res.json();
    allData = d;

    renderPipeline(d);

    document.getElementById('stats').innerHTML =
      '<div class="stat"><div class="stat-num">'+d.task_count+'</div><div class="stat-label">Tasks</div></div>'+
      '<div class="stat"><div class="stat-num">'+d.screenshot_count+'</div><div class="stat-label">Screenshots</div></div>'+
      '<div class="stat"><div class="stat-num green">'+d.completed_count+'</div><div class="stat-label">Completed</div></div>'+
      '<div class="stat"><div class="stat-num">'+d.submission_count+'</div><div class="stat-label">Submissions</div></div>';

    // Build filter buttons
    var cats = {};
    d.tasks.forEach(function(t){ cats[t.category] = (cats[t.category]||0)+1; });
    var filterHtml = '<button class="filter-btn active" onclick="setFilter(\\x27all\\x27)">All ('+d.task_count+')</button>';
    Object.keys(cats).sort().forEach(function(c){
      filterHtml += '<button class="filter-btn" onclick="setFilter(\\x27'+c+'\\x27)">'+c+' ('+cats[c]+')</button>';
    });
    document.getElementById('filters').innerHTML = filterHtml;

    renderGrid(d);
  } catch(e) {
    document.getElementById('grid').innerHTML = '<div style="color:#f87171;padding:20px">Error: '+e.message+'</div>';
  }
}

function setFilter(cat) {
  activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(function(b){
    b.classList.toggle('active', b.textContent.startsWith(cat === 'all' ? 'All' : cat));
  });
  if (allData) renderGrid(allData);
}

function renderGrid(d) {
  var tasks = d.tasks;
  var shots = d.screenshots;
  if (activeFilter !== 'all') {
    tasks = tasks.filter(function(t){ return t.category === activeFilter; });
  }

  document.getElementById('grid').innerHTML = tasks.map(function(t, i) {
    var shotIdx = parseInt(t.task_id.replace('task_','')) - 1;
    var shotUrl = shots[shotIdx % shots.length] ? shots[shotIdx % shots.length].file : '';
    return '<div class="card">' +
      (shotUrl ? '<img src="'+shotUrl+'" alt="'+t.task_id+'" loading="lazy" onerror="this.style.display=\\x27none\\x27">' : '') +
      '<div class="card-body">' +
        '<div class="card-title">'+t.task_id+' &mdash; '+t.env_name.replace(/-/g,' ')+'</div>' +
        '<div class="card-meta">'+t.category+' &bull; '+t.datepicker_type.replace(/_/g,' ')+'</div>' +
        '<div class="card-instruction">'+t.instruction_text+'</div>' +
        '<div class="card-answer">'+t.canonical_answer+'</div>' +
        '<a class="card-link" href="/task/'+t.task_id+'">Open task &rarr;</a>' +
      '</div></div>';
  }).join('');
}

load();
</script></body></html>"""


def _browse_page_html() -> str:
    """Browse page: flat task list sorted by task number with color-coded status."""
    return """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Datepicker Environments</title>
<style>
:root{--bg:#0f172a;--card:#1e293b;--text:#e2e8f0;--accent:#38bdf8;--muted:#94a3b8;--green:#22c55e;--red:#ef4444}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;max-width:1100px;margin:0 auto}
h1{color:var(--accent);margin-bottom:4px;font-size:1.6rem}
.sub{color:var(--muted);margin-bottom:24px;font-size:0.85rem}
.nav{margin-bottom:20px;display:flex;gap:16px}
.nav a{color:var(--accent);font-size:0.8rem;text-decoration:none;border:1px solid #334155;padding:4px 12px;border-radius:6px}
.nav a:hover{background:#1e293b}
.summary-bar{display:flex;gap:32px;margin-bottom:24px;padding:16px 24px;background:var(--card);border-radius:10px;align-items:center;flex-wrap:wrap}
.s-item{text-align:center}
.s-num{font-size:2rem;font-weight:700;color:var(--accent);line-height:1}
.s-label{font-size:0.7rem;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.5px}
.s-sep{width:1px;height:40px;background:#334155}
.progress-track{width:100%;height:6px;background:#1e293b;border-radius:3px;margin-bottom:20px;overflow:hidden}
.progress-fill{height:100%;background:var(--accent);border-radius:3px}
.legend{display:flex;gap:24px;margin-bottom:16px;font-size:0.75rem;color:var(--muted)}
.legend-item{display:flex;align-items:center;gap:5px}
.legend-dot{width:10px;height:10px;border-radius:3px}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:10px;overflow:hidden}
th{padding:8px 12px;text-align:left;font-size:0.73rem;color:var(--muted);font-weight:600;background:#162032;border-bottom:1px solid #334155}
td{padding:7px 12px;font-size:0.82rem;border-bottom:1px solid #1a2332}
tr.r{background:rgba(56,189,248,0.06)}
tr.r:hover{background:rgba(56,189,248,0.12)}
tr.p{background:transparent}
tr.p:hover{background:rgba(148,163,184,0.06)}
tr.p td{color:#4b5563}
tr.c{background:rgba(34,197,94,0.06)}
tr.c:hover{background:rgba(34,197,94,0.12)}
tr.f{background:rgba(239,68,68,0.06)}
tr.f:hover{background:rgba(239,68,68,0.12)}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px}
.dr{background:rgba(56,189,248,0.6)}
.dp{background:rgba(148,163,184,0.3)}
.dc{background:rgba(34,197,94,0.6)}
.df{background:rgba(239,68,68,0.6)}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.dim{color:#4b5563}
</style></head><body>
<h1>Datepicker Environments</h1>
<div class="sub" id="sub">Loading...</div>
<div class="nav"><a href="/dashboard">Dashboard</a><a href="/api/status" target="_blank">Status API</a></div>
<div id="ct"><p style="color:var(--muted);padding:20px">Loading...</p></div>
<script>
async function load(){
 try{
  var s=await(await fetch('/api/status',{cache:'no-store'})).json();
  var tasks=await(await fetch('/api/tasks',{cache:'no-store'})).json();
  var rSet=new Set(s.ready.map(function(e){return e.env_name}));
  var pct=s.total_envs>0?Math.round(100*s.ready_envs/s.total_envs):0;
  var comp=tasks.filter(function(t){return t.status==='completed'}).length;
  var fail=tasks.filter(function(t){return t.status==='failed'}).length;
  document.getElementById('sub').textContent=s.ready_envs+' of '+s.total_envs+' envs ready ('+pct+'%) \u2022 '+s.ready_tasks+'/'+s.total_tasks+' tasks';
  var h='';
  h+='<div class="summary-bar">';
  h+='<div class="s-item"><div class="s-num">'+s.ready_envs+'</div><div class="s-label">Envs Ready</div></div>';
  h+='<div class="s-sep"></div>';
  h+='<div class="s-item"><div class="s-num" style="color:var(--muted)">'+s.pending_envs+'</div><div class="s-label">Pending</div></div>';
  h+='<div class="s-sep"></div>';
  h+='<div class="s-item"><div class="s-num">'+s.ready_tasks+'</div><div class="s-label">Tasks Ready</div></div>';
  h+='<div class="s-sep"></div>';
  h+='<div class="s-item"><div class="s-num" style="color:var(--green)">'+comp+'</div><div class="s-label">Completed</div></div>';
  h+='<div class="s-sep"></div>';
  h+='<div class="s-item"><div class="s-num" style="color:var(--red)">'+fail+'</div><div class="s-label">Failed</div></div>';
  h+='</div>';
  h+='<div class="progress-track"><div class="progress-fill" style="width:'+pct+'%"></div></div>';
  h+='<div class="legend">';
  h+='<div class="legend-item"><div class="legend-dot" style="background:rgba(56,189,248,0.5)"></div>Ready</div>';
  h+='<div class="legend-item"><div class="legend-dot" style="background:rgba(148,163,184,0.3)"></div>Pending</div>';
  h+='<div class="legend-item"><div class="legend-dot" style="background:rgba(34,197,94,0.5)"></div>Completed</div>';
  h+='<div class="legend-item"><div class="legend-dot" style="background:rgba(239,68,68,0.5)"></div>Failed</div>';
  h+='</div>';
  h+='<table><thead><tr><th>Task</th><th>Environment</th><th>Category</th><th>Picker</th><th>Instruction</th></tr></thead><tbody>';
  tasks.forEach(function(t,i){
    var rdy=rSet.has(t.env_name);
    var cls='p',dc='dp';
    if(t.status==='completed'){cls='c';dc='dc';}
    else if(t.status==='failed'){cls='f';dc='df';}
    else if(rdy){cls='r';dc='dr';}
    var tid=rdy?'<a href="/task/'+t.task_id+'">'+t.task_id+'</a>':'<span class="dim">'+t.task_id+'</span>';
    h+='<tr class="'+cls+'">';
    h+='<td>'+(i+1)+'</td>';
    h+='<td><span class="dot '+dc+'"></span>'+tid+'</td>';
    h+='<td'+(rdy?'':' class="dim"')+'>'+t.env_name.replace(/-/g,' ')+'</td>';
    h+='<td'+(rdy?'':' class="dim"')+'>'+t.category+'</td>';
    h+='<td'+(rdy?'':' class="dim"')+'>'+t.datepicker_type.replace(/_/g,' ')+'</td>';
    h+='<td'+(rdy?'':' class="dim"')+'>'+t.instruction_text+'</td>';
    h+='</tr>';
  });
  h+='</tbody></table>';
  document.getElementById('ct').innerHTML=h;
 }catch(e){document.getElementById('ct').innerHTML='<p style="color:#f87171">Error: '+e.message+'</p>';}
}
load();
</script></body></html>"""


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    """Serve the active env's index.html or a browse page.

    In single-task mode (--task), redirect root to /task/{task_id} so
    the page gets the injected __ACTIVE_TASK__ context that the solver needs.
    """
    from backend.routes import _active_task
    if _active_task and not full_path:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"/task/{_active_task.task_id}")
    if _active_env_name:
        index = _frontend_base / _active_env_name / "dist" / "index.html"
        if index.is_file():
            return FileResponse(str(index))
    # Browse mode — return a task listing page
    from fastapi.responses import HTMLResponse
    return HTMLResponse(_browse_page_html())


def main():
    import uvicorn

    parser = argparse.ArgumentParser(description="Datepicker Environment Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=5400, help="Port to bind to")
    parser.add_argument("--db", default="./datepicker_ood_grounded.db", help="Path to SQLite database")
    parser.add_argument("--task", default=None, help="Task ID to serve (e.g., task_0001). If omitted, runs in browse mode.")
    args = parser.parse_args()

    set_db_path(args.db)
    init_db()

    if args.task:
        # Single-task mode (like gmail --user)
        set_active_task(args.task)
        from backend.routes import _active_task
        if _active_task is None:
            print(f"Error: Task '{args.task}' not found in database '{args.db}'")
            import sys
            sys.exit(1)
        task = _active_task
        mount_frontend(app, task.env_name)
        print(f"\n  Datepicker Env running at http://{args.host}:{args.port}")
        print(f"  Database: {args.db}")
        print(f"  Active task: {args.task}")
        print(f"  Environment: {task.env_name}")
        print(f"  Category: {task.category}")
        print(f"  Instruction: {task.instruction_text[:80]}...")
        print(f"  API docs at http://{args.host}:{args.port}/docs\n")
    else:
        # Browse mode — serves task list page
        print(f"\n  Datepicker Env (browse mode) at http://{args.host}:{args.port}")
        print(f"  Database: {args.db}")
        print(f"  tasks available — see /api/tasks")
        print(f"  API docs at http://{args.host}:{args.port}/docs\n")

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
