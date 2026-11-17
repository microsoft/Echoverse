"""Task verifier for the synthetic environments.

A single **LLM verification** mode, ported from the internal ``synthetic_env``
benchmark:

* **read tasks** — a judge compares the agent's answer to ``reference_answer``.
* **write tasks** — a judge compares an ``sqldiff`` of the seed vs final DB to
  ``reference_state_change``.
* **read_write tasks** — run both and combine via ``min(read, write)``.

This is the same contract the internal benchmark applies to every synthetic env,
including the datepicker and nested_filter families: their write tasks record a
row (a ``datesubmission`` / ``submissions`` insert) that ``sqldiff`` surfaces, and
their ``reference_state_change`` describes the expected change, so the write judge
grades them exactly like any other env.

Uses any OpenAI-compatible API — OpenAI, Azure OpenAI (API key), or Azure OpenAI
with Azure AD credentials (see :mod:`harness.llm`). The judge prompts are
unchanged (:mod:`harness.prompts`).

The scoring contract: return ``(score, reasoning)`` where ``score`` is ``1.0``
(pass) or ``0.0`` (fail).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple

from . import registry
from .prompts import (
    READ_JUDGE_SYSTEM,
    READ_JUDGE_USER,
    WRITE_JUDGE_SYSTEM,
    WRITE_JUDGE_USER,
)
from .sqltools import run_sqldiff
from .util import attempt_parse_json

_logger = logging.getLogger(__name__)


def _extract_verdict(verdict: Dict[str, Any]) -> Tuple[float, str]:
    """Pull ``(score, reasoning)`` out of a parsed judge reply.

    Unparseable or malformed replies grade as ``0.0`` rather than raising, so a
    single bad judge response cannot abort a batch run.
    """
    try:
        score = float(verdict.get("score", 0.0))
    except (TypeError, ValueError):
        score = 0.0
    reasoning = verdict.get("reasoning", "")
    if not isinstance(reasoning, str):
        reasoning = str(reasoning)
    if not verdict:
        reasoning = "Judge reply could not be parsed as JSON."
    return score, reasoning



class SyntheticVerifier:
    """Grade a single completed task with the LLM judge.

    Parameters
    ----------
    env_name:
        Registered env name.
    model_client:
        An :class:`harness.llm.OpenAIChatClient` (or compatible ``async create``)
        used to call the judge.
    """

    def __init__(self, env_name: str, model_client: Any = None):
        self.spec = registry.get_env_spec(env_name)
        self.env_name = env_name
        self.model_client = model_client

    async def verify_llm(
        self,
        task: Dict[str, Any],
        agent_answer: Optional[str],
        initial_db_path: Optional[str],
        final_db_path: Optional[str],
    ) -> Tuple[float, str]:
        """Dispatch to the correct LLM judge based on ``task_type``.

        For read tasks:        provide agent_answer
        For write tasks:       provide initial and final DB paths
        For read_write tasks:  run BOTH verifiers and combine via min(read, write)
        """
        task_type = task.get("task_type", "write")

        if task_type == "read":
            return await self._verify_read_task(task, agent_answer)

        if task_type == "read_write":
            read_score, read_reasoning = await self._verify_read_task(
                task, agent_answer
            )
            write_score, write_reasoning = await self._verify_write_task(
                task, initial_db_path, final_db_path
            )
            score = min(read_score, write_score)
            reasoning = (
                f"[read={read_score:.2f}] {read_reasoning} || "
                f"[write={write_score:.2f}] {write_reasoning}"
            )
            return score, reasoning

        # write (default)
        return await self._verify_write_task(task, initial_db_path, final_db_path)

    async def _verify_read_task(
        self,
        task: Dict[str, Any],
        agent_answer: Optional[str],
    ) -> Tuple[float, str]:
        """Verify a READ task by fuzzy-matching the agent's answer against
        reference_answer.
        """
        if self.model_client is None:
            raise RuntimeError(
                "LLM verification requires a model_client. Provide one via "
                "OpenAIChatClient."
            )
        question = task.get("goal", task.get("question", ""))
        ref_answer = task.get("reference_answer", task.get("ref_answer"))

        user_prompt = READ_JUDGE_USER.substitute(
            question=question,
            ref_answer=ref_answer,
            agent_answer=agent_answer,
        )

        messages = [
            {"role": "system", "content": READ_JUDGE_SYSTEM},
            {"role": "user", "content": user_prompt},
        ]
        response = await self.model_client.create(messages)
        response_text = (
            response.content
            if isinstance(response.content, str)
            else response.content.content
        )
        verdict = attempt_parse_json(response_text)
        score, reasoning = _extract_verdict(verdict)

        return score, reasoning

    async def _verify_write_task(
        self,
        task: Dict[str, Any],
        initial_db_path: Optional[str],
        current_db_path: Optional[str],
    ) -> Tuple[float, str]:
        """Verify a WRITE task by:
        1. Running sqldiff saved_db current_db to get actual changes
        2. Sending task goal + reference_state_change + actual diff to LLM judge
        """
        if self.model_client is None:
            raise RuntimeError(
                "LLM verification requires a model_client. Provide one via "
                "OpenAIChatClient."
            )
        question = task.get("goal", task.get("question", ""))
        ref_state_change = task.get(
            "reference_state_change", task.get("ref_state_change", "")
        )

        # Run sqldiff
        sql_diff = run_sqldiff(str(initial_db_path), str(current_db_path))

        if not sql_diff:
            return 0.0, "No SQL Diff for a write task. Likely an error."

        user_prompt = WRITE_JUDGE_USER.substitute(
            goal=question, ref_state_change=ref_state_change, sql_diff=sql_diff
        )

        messages = [
            {"role": "system", "content": WRITE_JUDGE_SYSTEM},
            {"role": "user", "content": user_prompt},
        ]
        response = await self.model_client.create(messages)
        response_text = (
            response.content
            if isinstance(response.content, str)
            else response.content.content
        )
        verdict = attempt_parse_json(response_text)
        score, reasoning = _extract_verdict(verdict)

        return score, reasoning
