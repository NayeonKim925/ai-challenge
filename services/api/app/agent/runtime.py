"""Guarded single-agent loop for schedule replanning assistance."""

from __future__ import annotations

import inspect
import json
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

from ..adapters.llm import ChatResult, LLMUnavailable, OpenAICompatibleLLM

MAX_TOOL_CALLS = 8
MAX_ARG_BYTES = 8_192
BLOCKED_TOOL_PARTS = ("commit", "send")


def run_agent(
    context: Dict[str, Any],
    event: Dict[str, Any],
    tools: Dict[str, Callable[..., Any]],
    max_steps: int = 6,
) -> Dict[str, Any]:
    """Run a bounded LLM loop and return a normalized agent result."""

    allowed_tools = _allowed_tools(tools)
    if not allowed_tools and tools:
        return _result(
            status="blocked_action",
            summary="No provided tools are allowed for agent execution.",
            unresolved_items=["commit/send actions are not executable by the agent"],
        )

    messages = _initial_messages(context, event, allowed_tools)
    tool_schemas = [_tool_schema(name, func) for name, func in allowed_tools.items()]
    tool_log: List[Dict[str, Any]] = []
    seen_calls = set()
    usage: Dict[str, Any] = {}
    max_calls = min(MAX_TOOL_CALLS, max(0, max_steps) * 2)

    try:
        gateway = _gateway(context)
    except LLMUnavailable as exc:
        return _unavailable(str(exc))

    for _step in range(max(1, max_steps)):
        try:
            reply = gateway.chat(messages, tools=tool_schemas, response_format={"type": "json_object"})
        except LLMUnavailable as exc:
            return _unavailable(str(exc))
        except Exception as exc:  # pragma: no cover - exercised through runtime behavior, exact clients vary.
            return _result(
                status="failed",
                summary="LLM gateway request failed.",
                unresolved_items=[str(exc)],
                tool_log=tool_log,
                usage=usage,
            )

        usage = _merge_usage(usage, reply.usage)
        action = _next_action(reply)
        if action:
            outcome = _execute_action(action, allowed_tools, seen_calls, tool_log, max_calls)
            if outcome:
                return _result(tool_log=tool_log, usage=usage, **outcome)
            messages.extend(_tool_result_messages(action, tool_log[-1]))
            continue

        final = _parse_final(reply.content)
        final["tool_log"] = tool_log
        final["usage"] = usage
        final.setdefault("status", "completed")
        return _normalize_result(final)

    return _result(
        status="max_steps_reached",
        summary="Agent stopped after reaching the step limit.",
        unresolved_items=["review required because the agent did not produce a final answer"],
        tool_log=tool_log,
        usage=usage,
    )


def _gateway(context: Dict[str, Any]) -> Any:
    injected = context.get("_llm_gateway")
    if injected is not None:
        return injected
    return OpenAICompatibleLLM()


def _initial_messages(
    context: Dict[str, Any],
    event: Dict[str, Any],
    tools: Dict[str, Callable[..., Any]],
) -> List[Dict[str, Any]]:
    tool_names = sorted(tools)
    system = (
        "You are a schedule replanning assistant. Return only JSON. "
        "Allowed final keys: summary, impacted_tasks, options, required_actions, unresolved_items, status. "
        "You may request exactly one tool call at a time using native tool calls or "
        '{"action":"tool","tool":"name","args":{...}}. '
        "Never request commit or send actions."
    )
    user = {
        "context": _public_context(context),
        "event": event,
        "allowed_tools": tool_names,
    }
    return [{"role": "system", "content": system}, {"role": "user", "content": _encode(user)}]


def _public_context(context: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in context.items() if not str(key).startswith("_")}


def _allowed_tools(tools: Dict[str, Callable[..., Any]]) -> Dict[str, Callable[..., Any]]:
    return {
        name: func
        for name, func in tools.items()
        if callable(func) and not _is_blocked_tool_name(name)
    }


def _is_blocked_tool_name(name: str) -> bool:
    lowered = str(name).lower()
    return any(part in lowered for part in BLOCKED_TOOL_PARTS)


def _tool_schema(name: str, func: Callable[..., Any]) -> Dict[str, Any]:
    properties: Dict[str, Any] = {}
    required = []
    try:
        signature = inspect.signature(func)
    except (TypeError, ValueError):
        signature = None
    if signature:
        for param_name, param in signature.parameters.items():
            if param.kind in (param.VAR_POSITIONAL, param.VAR_KEYWORD):
                continue
            properties[param_name] = {"type": _json_type(param.annotation)}
            if param.default is inspect.Parameter.empty:
                required.append(param_name)
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": (getattr(func, "__doc__", None) or "Project planning tool").strip()[:512],
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
                "additionalProperties": not signature,
            },
        },
    }


def _json_type(annotation: Any) -> str:
    if isinstance(annotation, str):
        if annotation.startswith("list") or annotation.startswith("List"):
            return "array"
        if annotation.startswith("dict") or annotation.startswith("Dict"):
            return "object"
    if annotation in (int, "int"):
        return "integer"
    if annotation in (float, "float"):
        return "number"
    if annotation in (bool, "bool"):
        return "boolean"
    if annotation in (list, List, "list"):
        return "array"
    if annotation in (dict, Dict, "dict"):
        return "object"
    return "string"


def _next_action(reply: ChatResult) -> Optional[Dict[str, Any]]:
    if reply.tool_calls:
        call = reply.tool_calls[0]
        return {
            "tool": call.get("name"),
            "args": call.get("arguments") or {},
            "tool_call_id": call.get("id"),
        }
    try:
        payload = json.loads(reply.content or "{}")
    except json.JSONDecodeError:
        return None
    if payload.get("action") == "tool":
        return {"tool": payload.get("tool"), "args": payload.get("args") or {}}
    tool_call = payload.get("tool_call")
    if isinstance(tool_call, dict):
        return {"tool": tool_call.get("name") or tool_call.get("tool"), "args": tool_call.get("args") or {}}
    return None


def _tool_result_messages(action: Dict[str, Any], result: Dict[str, Any]) -> List[Dict[str, Any]]:
    tool_call_id = action.get("tool_call_id")
    if tool_call_id:
        return [
            {
                "role": "assistant",
                "content": "",
                "tool_calls": [
                    {
                        "id": tool_call_id,
                        "type": "function",
                        "function": {"name": action["tool"], "arguments": _encode(action.get("args") or {})},
                    }
                ],
            },
            {"role": "tool", "tool_call_id": tool_call_id, "content": _encode(result)},
        ]
    return [{"role": "user", "content": "Tool result: %s" % _encode(result)}]


def _execute_action(
    action: Dict[str, Any],
    tools: Dict[str, Callable[..., Any]],
    seen_calls: set,
    tool_log: List[Dict[str, Any]],
    max_calls: int,
) -> Optional[Dict[str, Any]]:
    name = str(action.get("tool") or "")
    args = action.get("args") or {}
    if len(tool_log) >= max_calls:
        return {
            "status": "max_tool_calls_reached",
            "summary": "Agent stopped after reaching the tool-call limit.",
            "unresolved_items": ["review required before additional tool execution"],
        }
    if name not in tools:
        return {
            "status": "blocked_action",
            "summary": "Agent requested a disallowed tool.",
            "unresolved_items": ["tool '%s' is not allowed" % name],
        }
    ok, reason = _validate_args(tools[name], args)
    if not ok:
        return {
            "status": "invalid_tool_args",
            "summary": "Agent requested a tool with invalid arguments.",
            "unresolved_items": [reason],
        }
    fingerprint = (name, _encode(args))
    if fingerprint in seen_calls:
        return {
            "status": "repeated_tool_call",
            "summary": "Agent repeated the same tool call.",
            "unresolved_items": ["repeated call blocked: %s" % name],
        }
    seen_calls.add(fingerprint)

    try:
        result = tools[name](**args)
        tool_log.append({"tool": name, "args": args, "status": "ok", "result": result})
    except Exception as exc:
        tool_log.append({"tool": name, "args": args, "status": "error", "error": str(exc)})
    return None


def _validate_args(func: Callable[..., Any], args: Any) -> Tuple[bool, str]:
    if not isinstance(args, dict):
        return False, "tool arguments must be an object"
    if len(_encode(args).encode("utf-8")) > MAX_ARG_BYTES:
        return False, "tool arguments exceed size limit"
    if not _is_json_safe(args):
        return False, "tool arguments must be JSON-compatible"
    try:
        signature = inspect.signature(func)
    except (TypeError, ValueError):
        return True, ""
    try:
        signature.bind(**args)
    except TypeError as exc:
        return False, str(exc)
    return True, ""


def _is_json_safe(value: Any, depth: int = 0) -> bool:
    if depth > 8:
        return False
    if value is None or isinstance(value, (str, int, float, bool)):
        return True
    if isinstance(value, list):
        return all(_is_json_safe(item, depth + 1) for item in value)
    if isinstance(value, dict):
        return all(isinstance(key, str) and _is_json_safe(item, depth + 1) for key, item in value.items())
    return False


def _parse_final(content: str) -> Dict[str, Any]:
    try:
        payload = json.loads(content or "{}")
    except json.JSONDecodeError:
        payload = {"summary": content or "Agent did not return JSON.", "status": "needs_review"}
    if not isinstance(payload, dict):
        payload = {"summary": str(payload), "status": "needs_review"}
    return payload


def _normalize_result(value: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "summary": str(value.get("summary") or ""),
        "impacted_tasks": _list(value.get("impacted_tasks")),
        "options": _list(value.get("options")),
        "required_actions": _list(value.get("required_actions")),
        "unresolved_items": _list(value.get("unresolved_items")),
        "tool_log": _list(value.get("tool_log")),
        "status": str(value.get("status") or "completed"),
        "usage": dict(value.get("usage") or {}),
    }


def _result(
    summary: str = "",
    status: str = "completed",
    impacted_tasks: Optional[Iterable[Any]] = None,
    options: Optional[Iterable[Any]] = None,
    required_actions: Optional[Iterable[Any]] = None,
    unresolved_items: Optional[Iterable[Any]] = None,
    tool_log: Optional[Iterable[Any]] = None,
    usage: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return _normalize_result(
        {
            "summary": summary,
            "status": status,
            "impacted_tasks": list(impacted_tasks or []),
            "options": list(options or []),
            "required_actions": list(required_actions or []),
            "unresolved_items": list(unresolved_items or []),
            "tool_log": list(tool_log or []),
            "usage": usage or {},
        }
    )


def _unavailable(reason: str) -> Dict[str, Any]:
    return _result(
        status="llm_unavailable",
        summary="LLM agent is unavailable because API_KEY is not configured or the gateway cannot be reached.",
        unresolved_items=[reason],
    )


def _list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return [value]


def _merge_usage(current: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(current)
    for key, value in (new or {}).items():
        if isinstance(value, (int, float)) and isinstance(merged.get(key), (int, float)):
            merged[key] += value
        else:
            merged[key] = value
    return merged


def _encode(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, default=str)
