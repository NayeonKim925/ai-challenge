"""Read-only gateway probe by default; --roundtrip makes one paid tool-call test."""

from __future__ import annotations

import argparse
import os
import sys

import httpx


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--roundtrip", action="store_true", help="Send one generation request; may incur charges")
    args = parser.parse_args()
    key = os.environ.get("API_KEY")
    base = os.environ.get("LLM_BASE_URL", "").rstrip("/")
    model = os.environ.get("LLM_MODEL")
    if not key or not base:
        print("API_KEY and LLM_BASE_URL are required", file=sys.stderr)
        return 2
    headers = {"Authorization": f"Bearer {key}"}
    try:
        with httpx.Client(timeout=20) as client:
            response = client.get(f"{base}/models", headers=headers)
            response.raise_for_status()
            models = response.json().get("data", [])
            print(f"model list reachable: {len(models)} entries")
            if args.roundtrip:
                if not model:
                    print("LLM_MODEL is required for --roundtrip", file=sys.stderr)
                    return 2
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": "Call the echo tool with value test. Then answer OK."}],
                    "tools": [{"type": "function", "function": {"name": "echo", "description": "Echo one value", "parameters": {"type": "object", "properties": {"value": {"type": "string"}}, "required": ["value"]}}}],
                    "tool_choice": "auto",
                }
                answer = client.post(f"{base}/chat/completions", headers=headers, json=payload)
                answer.raise_for_status()
                message = answer.json().get("choices", [{}])[0].get("message", {})
                calls = message.get("tool_calls") or []
                print(f"native tool calls returned: {len(calls)}")
                if not calls:
                    return 1
                payload["messages"].append(message)
                payload["messages"].append({"role": "tool", "tool_call_id": calls[0]["id"], "content": '{"value":"test"}'})
                final = client.post(f"{base}/chat/completions", headers=headers, json=payload)
                final.raise_for_status()
                print("tool roundtrip: ok")
    except (httpx.HTTPError, ValueError, KeyError, IndexError) as exc:
        print(f"gateway probe failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
