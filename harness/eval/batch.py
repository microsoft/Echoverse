"""Batch-run a solver **agent** over N random tasks of one env, writing each
task's trajectory in the ``eval/v02`` on-disk layout.

This is a thin driver on top of the agent seam (:mod:`harness.agents`) and the
trajectory writers (:mod:`harness.eval.trajectory`). For each sampled task it
launches the env with :class:`harness.launcher.EnvInstance`, snapshots the
post-init DB (``baseline_db_state.db``), drives the chosen agent, captures
``final_db_state.db``, and fills in the webeval-style companion files so the
per-task directory matches the reference format.

Example (Fara1.5)::

    python -m harness.eval.batch --agent fara15 --env echostay --num-tasks 5 --seed 0 \
        --output-root ./runs
"""

from __future__ import annotations

import argparse
import getpass
import asyncio
import logging
import os
import random
import time
from typing import Any, Dict, List, Optional

from . import trajectory
from ..agents import AgentError, available, get_agent
from ..launcher import EnvInstance
from ..registry import REGISTRY
from ..tasks import acting_user, load_env_tasks

_logger = logging.getLogger("harness.eval.batch")

# Endpoint defaults (match the fara15 reference agent's env-var defaults).
_DEFAULT_BASE_URL = os.getenv("FARA_BASE_URL", "http://localhost:5002/v1/")
_DEFAULT_MODEL = os.getenv("FARA_MODEL", "Fara1.5-9B")
_DEFAULT_API_KEY = os.getenv("FARA_API_KEY", "not-needed")


def _sample_tasks(
    env: str, num: int, seed: int, envs_root: Optional[str]
) -> List[Dict]:
    tasks = load_env_tasks(env, envs_root)
    if not tasks:
        raise SystemExit(f"No test tasks found for env '{env}'.")
    ids = [t.get("id") for t in tasks]
    rng = random.Random(seed)
    picked = rng.sample(ids, min(num, len(ids)))
    by_id = {t.get("id"): t for t in tasks}
    return [by_id[i] for i in picked]


def _run_one(
    task: Dict[str, Any],
    traj_dir: str,
    *,
    env: str,
    envs_root: Optional[str],
    agent_name: str,
    base_url: str,
    model: str,
    api_key: str,
    max_rounds: int,
    headless: bool,
) -> None:
    task_id = task.get("id")
    instruction = task.get("goal", task.get("question", ""))
    os.makedirs(traj_dir, exist_ok=True)

    agent = get_agent(agent_name, base_url=base_url, model=model, api_key=api_key)

    # Launch the env as the task's acting user (echostay/echoforge) when it has one,
    # so writes land on the right rows. Capability envs return None (default user).
    user = acting_user(task)
    extra_backend_args = {"user": user} if user is not None else None
    inst = EnvInstance(
        env,
        task_id=task_id,
        output_dir=traj_dir,
        envs_root=envs_root,
        extra_backend_args=extra_backend_args,
    )
    inst.start()
    url = inst.url  # capture before close() clears the port
    # Baseline snapshot: the DB right after env init, before the agent acts.
    try:
        EnvInstance._snapshot_db(
            inst.save_db_path, os.path.join(traj_dir, "baseline_db_state.db")
        )
    except Exception as exc:  # pragma: no cover - best effort
        _logger.warning("baseline snapshot failed for %s: %s", task_id, exc)

    _logger.info("[%s] driving agent '%s' (%s) at %s", task_id, agent_name, model, url)
    start = time.time()
    final_answer: Optional[str] = None
    aborted = False
    reported_actions = 0
    try:
        result = asyncio.run(
            agent.drive(
                url=url,
                task_id=task_id,
                instruction=instruction,
                output_dir=traj_dir,
                max_rounds=max_rounds,
                headless=headless,
            )
        )
        final_answer = result.final_answer
        aborted = result.aborted
        reported_actions = result.n_actions
    except Exception as exc:
        aborted = True
        _logger.error("[%s] agent run failed: %s", task_id, exc)
    finally:
        end = time.time()
        inst.close()  # captures final_db_state.db
    final_db_path = inst.final_db_path

    # Prefer the agent-reported action count; fall back to parsing the trajectory
    # (Fara writes data_point.json; other agents may only report via AgentResult).
    n_actions = reported_actions or trajectory.count_actions(traj_dir)
    trajectory.write_final_answer(traj_dir, task_id, final_answer, aborted)
    trajectory.write_web_surfer_log(traj_dir, source=agent_name)
    trajectory.write_times(traj_dir, start, end)
    trajectory.write_core_log(
        traj_dir, task_id, url, final_db_path, start, end, n_actions
    )
    _logger.info(
        "[%s] done: %d actions, %.0fs, final_db=%s",
        task_id,
        n_actions,
        end - start,
        final_db_path,
    )


def _run_task_worker(
    task: Dict[str, Any],
    traj_dir: str,
    *,
    env: str,
    envs_root: Optional[str],
    agent_name: str,
    base_url: str,
    model: str,
    api_key: str,
    max_rounds: int,
    headless: bool,
) -> Dict[str, Any]:
    """Top-level, picklable worker for ProcessPoolExecutor. Runs one task and
    returns a small summary. Configures logging (child processes don't inherit
    the parent's basicConfig under the 'spawn' start method).
    """
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    task_id = task.get("id")
    try:
        _run_one(
            task,
            traj_dir,
            env=env,
            envs_root=envs_root,
            agent_name=agent_name,
            base_url=base_url,
            model=model,
            api_key=api_key,
            max_rounds=max_rounds,
            headless=headless,
        )
        return {"task_id": task_id, "ok": True, "endpoint": base_url}
    except Exception as exc:  # pragma: no cover - reported to parent
        _logger.error("task %s failed to run: %s", task_id, exc)
        return {
            "task_id": task_id,
            "ok": False,
            "endpoint": base_url,
            "error": str(exc),
        }


def _prewarm_frontend_deps(env: str, envs_root: Optional[str]) -> None:
    """Install the env frontend's node_modules once (serially) so concurrent
    instances don't race on `npm install`."""
    try:
        inst = EnvInstance(env, task_id="_prewarm", envs_root=envs_root)
        inst._ensure_frontend_deps()
    except Exception as exc:  # pragma: no cover - best effort
        _logger.warning("frontend pre-warm skipped: %s", exc)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Batch-run a solver agent over N random env tasks, saving each "
        "trajectory in the eval/v02 on-disk format."
    )
    parser.add_argument("--env", required=True, choices=sorted(REGISTRY))
    parser.add_argument(
        "--agent",
        default="fara15",
        help=f"Solver agent (default: fara15). Available: {', '.join(available())}.",
    )
    parser.add_argument("--num-tasks", type=int, default=5)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--envs-root", default=None)
    parser.add_argument("--output-root", default="./runs")
    # Run-path components (mirror the reference layout).
    parser.add_argument("--system", default="SyntheticEnv-eval")
    parser.add_argument("--experiment", default=None, help="Default: <env>_<agent>")
    parser.add_argument("--user", default=None, help="Default: current OS user.")
    parser.add_argument(
        "--run-id", default=None, help="Default: <env>-<n>rand-seed<seed>"
    )
    # Agent endpoint(s). --agent-base-urls (comma list) enables multi-replica load
    # spreading; falls back to the single --agent-base-url.
    parser.add_argument("--agent-base-url", default=_DEFAULT_BASE_URL)
    parser.add_argument(
        "--agent-base-urls",
        default=None,
        help="Comma-separated list of endpoints (one per replica/GPU). Tasks are "
        "distributed round-robin across them. Overrides --agent-base-url.",
    )
    parser.add_argument("--agent-model", default=_DEFAULT_MODEL)
    parser.add_argument("--agent-api-key", default=_DEFAULT_API_KEY)
    parser.add_argument(
        "--concurrency",
        type=int,
        default=None,
        help="Number of tasks to run in parallel (default: number of endpoints). "
        "1 = sequential.",
    )
    parser.add_argument("--max-rounds", type=int, default=100)
    parser.add_argument("--headful", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )

    # Validate the agent name up front (constructs it; deeper optional-dep errors
    # surface per task when it actually drives).
    try:
        get_agent(args.agent)
    except AgentError as exc:
        raise SystemExit(str(exc))

    endpoints = (
        [u.strip() for u in args.agent_base_urls.split(",") if u.strip()]
        if args.agent_base_urls
        else [args.agent_base_url]
    )
    concurrency = args.concurrency if args.concurrency else len(endpoints)
    concurrency = max(1, concurrency)

    experiment = args.experiment or f"{args.env}_{args.agent}"
    user = args.user or getpass.getuser()
    run_id = args.run_id or f"{args.env}-{args.num_tasks}rand-seed{args.seed}"
    traj_root = os.path.join(
        args.output_root, args.system, experiment, user, "SyntheticEnv", run_id, "traj"
    )
    os.makedirs(traj_root, exist_ok=True)

    tasks = _sample_tasks(args.env, args.num_tasks, args.seed, args.envs_root)
    _logger.info(
        "Sampled %d/%d %s tasks (seed=%d): %s",
        len(tasks),
        len(load_env_tasks(args.env, args.envs_root)),
        args.env,
        args.seed,
        [t.get("id") for t in tasks],
    )
    _logger.info("Endpoints: %s | concurrency: %d", endpoints, concurrency)
    _logger.info("Writing trajectories under: %s", traj_root)

    # Build the per-task work items (task -> assigned endpoint, round-robin).
    work = []
    for i, task in enumerate(tasks):
        task_id = task.get("id")
        traj_dir = os.path.join(traj_root, task_id)
        work.append((task, traj_dir, endpoints[i % len(endpoints)]))

    common = dict(
        env=args.env,
        envs_root=args.envs_root,
        agent_name=args.agent,
        model=args.agent_model,
        api_key=args.agent_api_key,
        max_rounds=args.max_rounds,
        headless=not args.headful,
    )

    if concurrency == 1:
        for i, (task, traj_dir, base_url) in enumerate(work, 1):
            _logger.info("=== [%d/%d] task %s ===", i, len(work), task.get("id"))
            _run_task_worker(task, traj_dir, base_url=base_url, **common)
    else:
        # Pre-warm frontend deps once so concurrent instances don't race on npm.
        _prewarm_frontend_deps(args.env, args.envs_root)
        import concurrent.futures
        import multiprocessing as mp

        _logger.info(
            "Running %d tasks with concurrency=%d across %d endpoint(s)",
            len(work),
            concurrency,
            len(endpoints),
        )
        ctx = mp.get_context("spawn")
        results = []
        with concurrent.futures.ProcessPoolExecutor(
            max_workers=concurrency, mp_context=ctx
        ) as pool:
            futs = {
                pool.submit(
                    _run_task_worker, task, traj_dir, base_url=base_url, **common
                ): task.get("id")
                for (task, traj_dir, base_url) in work
            }
            for fut in concurrent.futures.as_completed(futs):
                res = fut.result()
                results.append(res)
                _logger.info(
                    "task %s finished (ok=%s, endpoint=%s)",
                    res.get("task_id"),
                    res.get("ok"),
                    res.get("endpoint"),
                )
        n_ok = sum(1 for r in results if r.get("ok"))
        _logger.info("Completed %d/%d tasks OK", n_ok, len(results))

    print(f"\nAll trajectories written under:\n    {traj_root}\n")
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
