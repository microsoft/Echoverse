"""Live smoke test for the LLM verifier (Tier B).

Exercises the real verifier end-to-end against the real judge endpoint using
credentials from the repo-root ``.env`` (OpenAI, Azure OpenAI key, or Azure AD).
For each family it runs one **known-good** fixture (expect PASS / score 1.0) and
one **known-bad** fixture (expect FAIL / score 0.0):

* read  (echostay)      — a real read task judged against ``reference_answer``.
* write (datepickers)   — a real write task; a tiny before/after SQLite pair with
  the ``datesubmission`` insert is diffed with real ``sqldiff`` and judged against
  ``reference_state_change``.
* write (nested_filter) — same, with a ``submissions`` insert.

This is NOT a unit test (it needs a live endpoint); run it explicitly:

    harness/.venv/bin/python -m harness.tests.live_smoke

Exits non-zero if any fixture's PASS/FAIL does not match its expectation.
"""

from __future__ import annotations

import asyncio
import os
import sqlite3
import sys
import tempfile
from typing import List, Optional, Tuple

from ..llm import OpenAIChatClient
from ..tasks import find_task
from ..verify import SyntheticVerifier


def _make_db(path: str, create_sql: str, insert_sql: Optional[str] = None) -> None:
    conn = sqlite3.connect(path)
    try:
        conn.executescript(create_sql)
        if insert_sql:
            conn.executescript(insert_sql)
        conn.commit()
    finally:
        conn.close()


def _write_fixture_dbs(
    tmpdir: str, create_sql: str, after_insert_sql: str, tag: str
) -> Tuple[str, str]:
    """Build a before (empty) and after (with the submission) DB pair."""
    before = os.path.join(tmpdir, f"{tag}_before.db")
    after = os.path.join(tmpdir, f"{tag}_after.db")
    _make_db(before, create_sql)
    _make_db(after, create_sql, after_insert_sql)
    return before, after


# --- fixtures ---------------------------------------------------------------
# Real task ids from the shipped test_tasks.jsonl of each env.
DP_TASK = "dpg_0008"  # goal: set Departure Date to 2025-12-24
NF_TASK = "W01_E03_G011"  # filter_state: condition=[Agentic AI], brand=[macOS]
ECHOSTAY_READ_TASK = "ABH0002"  # reference_answer: Brighton

_DATESUBMISSION_SCHEMA = (
    "CREATE TABLE datesubmission ("
    "id INTEGER PRIMARY KEY, task_id TEXT, selected_value TEXT, is_partial INTEGER);"
)
_SUBMISSIONS_SCHEMA = (
    "CREATE TABLE submissions ("
    "id INTEGER PRIMARY KEY, task_id TEXT, filter_state_json TEXT);"
)


def _dp_insert(value: str) -> str:
    return (
        "INSERT INTO datesubmission (id, task_id, selected_value, is_partial) "
        f"VALUES (1, '{DP_TASK}', '{value}', 0);"
    )


def _nf_insert(filter_json: str) -> str:
    fj = filter_json.replace("'", "''")
    return (
        "INSERT INTO submissions (id, task_id, filter_state_json) "
        f"VALUES (1, '{NF_TASK}', '{fj}');"
    )


async def _run() -> int:
    client = OpenAIChatClient()
    print(f"auth mode: {client.auth}  model/deployment: {client.model}")

    results: List[Tuple[str, bool, bool]] = []  # (name, passed, expected_pass)

    with tempfile.TemporaryDirectory(prefix="verify_smoke_") as tmp:
        # ---- read: echostay ----
        read_task = find_task("echostay", ECHOSTAY_READ_TASK)
        v_read = SyntheticVerifier("echostay", model_client=client)
        for name, answer, expect in [
            ("echostay-read GOOD", "Brighton", True),
            ("echostay-read BAD", "Cambridge", False),
        ]:
            score, reason = await v_read.verify_llm(read_task, answer, None, None)
            results.append((name, score >= 1.0, expect))
            print(f"  {name}: score={score:.1f}  {reason[:90]}")

        # ---- write: datepickers ----
        dp_task = find_task("datepickers", DP_TASK)
        v_dp = SyntheticVerifier("datepickers", model_client=client)
        for name, value, expect in [
            ("datepickers-write GOOD", "2025-12-24", True),
            ("datepickers-write BAD", "2025-01-01", False),
        ]:
            before, after = _write_fixture_dbs(
                tmp, _DATESUBMISSION_SCHEMA, _dp_insert(value), f"dp_{expect}"
            )
            score, reason = await v_dp.verify_llm(dp_task, None, before, after)
            results.append((name, score >= 1.0, expect))
            print(f"  {name}: score={score:.1f}  {reason[:90]}")

        # ---- write: nested_filter ----
        nf_task = find_task("nested_filter", NF_TASK)
        v_nf = SyntheticVerifier("nested_filter", model_client=client)
        for name, fj, expect in [
            (
                "nested_filter-write GOOD",
                '{"condition": ["Agentic AI"], "brand": ["macOS"]}',
                True,
            ),
            ("nested_filter-write BAD", '{"brand": ["Windows"]}', False),
        ]:
            before, after = _write_fixture_dbs(
                tmp, _SUBMISSIONS_SCHEMA, _nf_insert(fj), f"nf_{expect}"
            )
            score, reason = await v_nf.verify_llm(nf_task, None, before, after)
            results.append((name, score >= 1.0, expect))
            print(f"  {name}: score={score:.1f}  {reason[:90]}")

    # ---- report ----
    print("\n=== Tier B smoke results ===")
    ok = True
    for name, passed, expect in results:
        match = passed == expect
        ok = ok and match
        print(
            f"  [{'OK ' if match else 'XX '}] {name}: "
            f"got {'PASS' if passed else 'FAIL'}, expected "
            f"{'PASS' if expect else 'FAIL'}"
        )
    print("\nRESULT:", "ALL EXPECTATIONS MET" if ok else "MISMATCH")
    return 0 if ok else 1


def main() -> int:
    return asyncio.run(_run())


if __name__ == "__main__":
    sys.exit(main())
