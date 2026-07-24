"""OpenAI-compatible LLM client for the verifier.

Provides a thin async chat client (used by the verifier) that authenticates in
any of three auto-detected modes, with all configuration read from environment
variables (optionally loaded from a repo-root ``.env`` file):

1. **OpenAI / OpenAI-compatible (API key)** — plain ``AsyncOpenAI`` against
   ``https://api.openai.com`` or any compatible ``base_url``.
2. **Azure OpenAI (API key)** — ``AsyncAzureOpenAI`` with an API key.
3. **Azure OpenAI (Azure AD credential)** — ``AsyncAzureOpenAI`` with a bearer
   token from :class:`azure.identity.DefaultAzureCredential` (supports
   ``az login`` / managed identity). Used when an Azure endpoint is configured
   but no API key is supplied.

Configuration keys (first found wins). Generic ``LLM_*`` names are supported
alongside the conventional OpenAI / Azure names:

- endpoint:    ``LLM_ENDPOINT`` | ``AZURE_OPENAI_ENDPOINT`` | ``OPENAI_BASE_URL``
- api key:     ``LLM_API_KEY`` | ``AZURE_OPENAI_API_KEY`` | ``OPENAI_API_KEY``
- deployment:  ``LLM_DEPLOYMENT_NAME`` | ``AZURE_OPENAI_DEPLOYMENT``
- model:       ``LLM_MODEL_NAME`` | ``OPENAI_MODEL``
- api version: ``LLM_API_VERSION`` | ``OPENAI_API_VERSION`` | ``AZURE_OPENAI_API_VERSION``

The wrapper exposes an ``async create(messages) -> _Response`` method whose
result has a ``.content`` string attribute, matching the shape the ported
verifier code expects so the judging logic stays verbatim.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

_AAD_SCOPE = "https://cognitiveservices.azure.com/.default"
_DEFAULT_AZURE_API_VERSION = "2024-10-21"


def load_dotenv_if_present() -> None:
    """Load a repo-root ``.env`` into ``os.environ`` if python-dotenv is present.

    Never overrides variables already set in the environment, and is a silent
    no-op when python-dotenv is not installed or no ``.env`` file exists.
    """
    try:
        from dotenv import find_dotenv, load_dotenv
    except ImportError:
        return
    path = find_dotenv(usecwd=True)
    if path:
        load_dotenv(path, override=False)


def _first_env(*names: str) -> Optional[str]:
    """Return the first non-empty environment variable among ``names``."""
    for name in names:
        val = os.environ.get(name)
        if val is not None and val.strip() != "":
            return val.strip()
    return None


def SystemMessage(content: str) -> Dict[str, str]:
    """Build a system-role chat message (plain dict, OpenAI schema)."""
    return {"role": "system", "content": content}


def UserMessage(content: str, source: str = "user") -> Dict[str, str]:
    """Build a user-role chat message (plain dict, OpenAI schema).

    ``source`` is accepted for call-site compatibility with the internal API and
    is ignored by the OpenAI schema.
    """
    return {"role": "user", "content": content}


@dataclass
class _Response:
    """Minimal response object exposing ``.content`` like the internal client."""

    content: str


class OpenAIChatClient:
    """Thin async wrapper over the OpenAI / Azure OpenAI chat completions API.

    Auth mode is auto-detected from the environment unless ``auth`` is given
    explicitly. ``auth`` may be one of ``"auto"`` (default), ``"openai"``,
    ``"azure-key"`` or ``"azure-ad"``.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.0,
        auth: str = "auto",
        api_version: Optional[str] = None,
        **create_kwargs: Any,
    ):
        load_dotenv_if_present()

        endpoint = base_url or _first_env(
            "LLM_ENDPOINT", "AZURE_OPENAI_ENDPOINT", "OPENAI_BASE_URL"
        )
        api_key = api_key or _first_env(
            "LLM_API_KEY", "AZURE_OPENAI_API_KEY", "OPENAI_API_KEY"
        )
        self.model = (
            model
            or _first_env("LLM_MODEL_NAME", "LLM_DEPLOYMENT_NAME", "OPENAI_MODEL")
            or "gpt-4o"
        )
        deployment = (
            _first_env("LLM_DEPLOYMENT_NAME", "AZURE_OPENAI_DEPLOYMENT") or self.model
        )
        api_version = api_version or _first_env(
            "LLM_API_VERSION", "OPENAI_API_VERSION", "AZURE_OPENAI_API_VERSION"
        )

        resolved = self._resolve_auth(auth, endpoint, api_key)
        self.auth = resolved
        self.temperature = temperature
        self._create_kwargs = create_kwargs

        if resolved == "openai":
            self._client = self._build_openai(api_key, endpoint)
        else:  # azure-key | azure-ad
            self._client = self._build_azure(
                resolved, endpoint, api_key, deployment, api_version
            )
            # For Azure, the OpenAI SDK routes requests by deployment name.
            self.model = deployment

    # -- auth resolution ----------------------------------------------------
    @staticmethod
    def _is_azure_endpoint(endpoint: Optional[str]) -> bool:
        if not endpoint:
            return False
        from urllib.parse import urlparse

        parsed = urlparse(endpoint if "://" in endpoint else "https://" + endpoint)
        host = (parsed.hostname or "").lower()
        return host == "azure.com" or host.endswith(".azure.com")

    def _resolve_auth(
        self, auth: str, endpoint: Optional[str], api_key: Optional[str]
    ) -> str:
        if auth != "auto":
            if auth not in ("openai", "azure-key", "azure-ad"):
                raise ValueError(
                    f"Unknown auth mode '{auth}'. Use one of: auto, openai, "
                    "azure-key, azure-ad."
                )
            return auth
        if self._is_azure_endpoint(endpoint):
            return "azure-key" if api_key else "azure-ad"
        return "openai"

    # -- client builders ----------------------------------------------------
    @staticmethod
    def _build_openai(api_key: Optional[str], base_url: Optional[str]):
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "The 'openai' package is required for LLM verification. "
                "Install it with `pip install openai`."
            ) from exc
        if not api_key:
            raise RuntimeError(
                "No API key found for OpenAI auth. Set OPENAI_API_KEY (or "
                "LLM_API_KEY), or configure an Azure endpoint for Azure AD auth."
            )
        return AsyncOpenAI(api_key=api_key, base_url=base_url)

    def _build_azure(
        self,
        mode: str,
        endpoint: Optional[str],
        api_key: Optional[str],
        deployment: str,
        api_version: Optional[str],
    ):
        try:
            from openai import AsyncAzureOpenAI
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "The 'openai' package is required for Azure OpenAI verification. "
                "Install it with `pip install openai`."
            ) from exc
        if not endpoint:
            raise RuntimeError(
                "Azure auth requires an endpoint. Set LLM_ENDPOINT or "
                "AZURE_OPENAI_ENDPOINT."
            )
        api_version = api_version or _DEFAULT_AZURE_API_VERSION

        if mode == "azure-key":
            if not api_key:
                raise RuntimeError(
                    "azure-key auth requires an API key (LLM_API_KEY / "
                    "AZURE_OPENAI_API_KEY)."
                )
            return AsyncAzureOpenAI(
                api_key=api_key,
                azure_endpoint=endpoint,
                api_version=api_version,
                azure_deployment=deployment,
            )

        # azure-ad: bearer token from a chained credential —
        # DefaultAzureCredential first, then AzureCliCredential. Managed identity
        # is excluded from the Default step so that on hosts exposing an unrelated
        # managed identity (e.g. a shared VM) the chain falls through to the
        # developer's ``az login`` identity instead of a principal that lacks the
        # Cognitive Services OpenAI role.
        try:
            from azure.identity import (
                AzureCliCredential,
                ChainedTokenCredential,
                DefaultAzureCredential,
                get_bearer_token_provider,
            )
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "Azure AD auth requires 'azure-identity'. Install it with "
                "`pip install azure-identity` (or `pip install "
                "synthetic-env-harness[azure]`), or provide an API key."
            ) from exc
        credential = ChainedTokenCredential(
            DefaultAzureCredential(exclude_managed_identity_credential=True),
            AzureCliCredential(),
        )
        token_provider = get_bearer_token_provider(credential, _AAD_SCOPE)
        return AsyncAzureOpenAI(
            azure_ad_token_provider=token_provider,
            azure_endpoint=endpoint,
            api_version=api_version,
            azure_deployment=deployment,
        )

    async def create(self, messages: List[Dict[str, str]]) -> _Response:
        """Call chat completions and return an object with a ``.content`` str."""
        resp = await self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            **self._create_kwargs,
        )
        content = resp.choices[0].message.content or ""
        return _Response(content=content)
