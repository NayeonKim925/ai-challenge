"""OpenAI-compatible chat-completions gateway for the agent runtime."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


class LLMUnavailable(RuntimeError):
    """Raised when the configured LLM gateway cannot be used."""


@dataclass
class ChatResult:
    content: str = ""
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    usage: Dict[str, Any] = field(default_factory=dict)
    model: Optional[str] = None
    finish_reason: Optional[str] = None


class OpenAICompatibleLLM:
    """Small synchronous wrapper around an OpenAI-compatible chat endpoint."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.environ.get("API_KEY")
        self.model = model if model is not None else os.environ.get("LLM_MODEL")
        configured_base_url = base_url if base_url is not None else os.environ.get("LLM_BASE_URL")
        self.base_url = configured_base_url.rstrip("/") if configured_base_url else None
        self.timeout = timeout

    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> ChatResult:
        if not self.api_key:
            raise LLMUnavailable("API_KEY is not configured")
        if not self.model:
            raise LLMUnavailable("LLM_MODEL is not configured")
        if not self.base_url:
            raise LLMUnavailable("LLM_BASE_URL is not configured")

        payload: Dict[str, Any] = {"model": self.model, "messages": messages}
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        if response_format:
            payload["response_format"] = response_format

        headers = {"Authorization": "Bearer %s" % self.api_key, "Content-Type": "application/json"}
        try:
            import httpx
        except ImportError as exc:
            raise LLMUnavailable("httpx is required for LLM gateway requests") from exc

        data = self._post_chat(httpx, payload, headers, allow_json_fallback=bool(tools or response_format))

        choices = data.get("choices") or []
        if not choices:
            raise LLMUnavailable("LLM response did not include choices")
        choice = choices[0]
        message = choice.get("message") or {}
        return ChatResult(
            content=str(message.get("content") or ""),
            tool_calls=_parse_tool_calls(message.get("tool_calls") or []),
            usage=dict(data.get("usage") or {}),
            model=data.get("model"),
            finish_reason=choice.get("finish_reason"),
        )

    def _post_chat(
        self,
        httpx_module: Any,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        allow_json_fallback: bool,
    ) -> Dict[str, Any]:
        try:
            return self._request(httpx_module, payload, headers)
        except httpx_module.HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code not in (400, 422) or not allow_json_fallback:
                raise
            fallback_payload = {
                key: value
                for key, value in payload.items()
                if key not in {"tools", "tool_choice", "response_format"}
            }
            return self._request(httpx_module, fallback_payload, headers)

    def _request(self, httpx_module: Any, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        with httpx_module.Client(timeout=self.timeout) as client:
            response = client.post("%s/chat/completions" % self.base_url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()


def _parse_tool_calls(raw_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    parsed = []
    for raw in raw_calls:
        function = raw.get("function") or {}
        arguments = function.get("arguments") or {}
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments) if arguments else {}
            except json.JSONDecodeError:
                arguments = {"__invalid_json__": arguments}
        parsed.append(
            {
                "id": raw.get("id"),
                "name": function.get("name") or raw.get("name"),
                "arguments": arguments,
            }
        )
    return parsed
