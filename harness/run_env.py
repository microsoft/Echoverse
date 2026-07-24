"""CLI: bring up a single environment instance for a task.

Launches the env (per-task DB copy + OS-assigned free ports), prints the URL for
your agent to drive, and holds until interrupted. On teardown it captures the
post-run database to ``final_db_state.db`` so you can grade with ``harness.cli
verify`` (or ``python -m harness.verify_cli``).

Example:
    python -m harness.run_env --env echostay --task ATE0001 \
        --output-dir ./runs/ATE0001
    # ... drive your agent at the printed URL ...
    # Ctrl-C to tear down; final DB lands in ./runs/ATE0001/final_db_state.db
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import time

from .launcher import EnvInstance
from .registry import REGISTRY


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Run one synthetic env instance.")
    parser.add_argument("--env", required=True, choices=sorted(REGISTRY))
    parser.add_argument(
        "--task",
        default="default",
        help="Task id (also selects the backend task for datepickers/nested_filter).",
    )
    parser.add_argument("--db", default=None, help="Override the seed DB path.")
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Where final_db_state.db is written on teardown.",
    )
    parser.add_argument("--envs-root", default=None, help="Directory holding the envs.")
    parser.add_argument(
        "--hold",
        action="store_true",
        default=True,
        help="Keep the env running until interrupted (default).",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )

    inst = EnvInstance(
        args.env,
        task_id=args.task,
        db_path=args.db,
        output_dir=args.output_dir,
        envs_root=args.envs_root,
    )
    inst.start()
    print(f"\nEnv '{args.env}' is up. Point your agent at:\n    {inst.url}\n")
    print(f"Working DB: {inst.save_db_path}")
    if args.output_dir:
        print(f"Final DB will be written to: {args.output_dir}/final_db_state.db")
    print("\nPress Ctrl-C to tear down.\n")

    stop = {"flag": False}

    def _handler(signum, frame):
        stop["flag"] = True

    signal.signal(signal.SIGINT, _handler)
    signal.signal(signal.SIGTERM, _handler)
    try:
        while not stop["flag"]:
            time.sleep(0.5)
    finally:
        print("\nTearing down ...")
        inst.close()
        if inst.final_db_path:
            print(f"Final DB captured: {inst.final_db_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
