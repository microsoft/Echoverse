"""Standalone harness for the synthetic environments release.

Provides two capabilities with no dependency on any internal/proprietary
packages, Redis, Azure, or a private LLM gateway:

1. **Env lifecycle** (:mod:`harness.launcher`, :mod:`harness.run_env`) — bring an
   environment up for a single task with per-task database isolation and
   OS-assigned free ports, so multiple instances of any env can run at once.
2. **Verification** (:mod:`harness.verify`) — grade a completed task via
   LLM-based evaluation over any OpenAI-compatible API (OpenAI, Azure OpenAI with
   an API key, or Azure OpenAI with Azure AD credentials; docs recommend
   ``gpt-4o``).

The user brings their own agent: the harness only launches the environment and
grades the result.
"""

__all__ = [
    "launcher",
    "verify",
    "registry",
    "ports",
    "llm",
    "sqltools",
    "prompts",
    "util",
]
