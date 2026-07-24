"""CLI: verify a completed task with the LLM judge.

Grades using any OpenAI-compatible API. Credentials and endpoint are read from
the environment (optionally a repo-root ``.env``): OpenAI (``OPENAI_API_KEY``),
Azure OpenAI with an API key, or Azure OpenAI with Azure AD credentials
(``DefaultAzureCredential`` / ``az login``). See :mod:`harness.llm`.

Examples:
    # Read task
    python -m harness.verify_cli --env echostay --task ABH0002 \
        --answer "Brighton"

    # Write task (needs the post-run DB to diff against the seed DB)
    python -m harness.verify_cli --env nested_filter --task W01_E03_G011 \
        --final-db ./runs/W01_E03_G011/final_db_state.db
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from .registry import REGISTRY, default_db_path
from .tasks import find_task
from .verify import SyntheticVerifier


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Verify one synthetic env task.")
    parser.add_argument("--env", required=True, choices=sorted(REGISTRY))
    parser.add_argument("--task", required=True, help="Task id to grade.")
    parser.add_argument("--answer", default=None, help="The agent's final answer text.")
    parser.add_argument(
        "--final-db", default=None, help="Path to final_db_state.db (post-run)."
    )
    parser.add_argument(
        "--seed-db",
        default=None,
        help="Seed DB path (defaults to the env's registered DB).",
    )
    parser.add_argument("--envs-root", default=None)
    parser.add_argument(
        "--model",
        default=None,
        help="Model/deployment for the judge (default: from env, else gpt-4o).",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="OpenAI-compatible base URL / Azure endpoint. Defaults to env.",
    )
    parser.add_argument(
        "--auth",
        default="auto",
        choices=["auto", "openai", "azure-key", "azure-ad"],
        help="Authentication mode (default: auto-detect from env).",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    task = find_task(args.env, args.task, args.envs_root)
    seed_db = args.seed_db or default_db_path(args.env, args.envs_root)

    from .llm import OpenAIChatClient

    client = OpenAIChatClient(model=args.model, base_url=args.base_url, auth=args.auth)
    verifier = SyntheticVerifier(args.env, model_client=client)
    score, reasoning = asyncio.run(
        verifier.verify_llm(task, args.answer, seed_db, args.final_db)
    )

    verdict = "PASS" if score >= 1.0 else "FAIL"
    print(f"\n{verdict}  score={score:.1f}")
    print(f"reason: {reasoning}\n")
    return 0 if score >= 1.0 else 1


if __name__ == "__main__":
    sys.exit(main())
