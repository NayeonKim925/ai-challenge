"""Single worker for scans and analyses.

Run with: PYTHONPATH=services/api python -m app.worker
"""

from __future__ import annotations

import os
import time
import json
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from .events import normalize_event
from .storage import Store, digest, identifier, utcnow


def _scenario_record(run: dict[str, Any], event: dict[str, Any], version: dict[str, Any], label: str, option_ids: list[str], result: dict[str, Any]) -> dict[str, Any]:
    required = []
    if option_ids:
        options_by_id = {item.get("option_id"): item for item in version["data"].get("options", [])}
        for option_id in option_ids:
            option = options_by_id.get(option_id, {})
            state = str(option.get("approval_state") or "")
            if any(word in state for word in ("미확보", "미예약", "승인", "협의", "조건부")):
                required.append(f"{option_id}: {state}")
    return {
        **result,
        "project_id": run["project_id"],
        "event_id": event["id"],
        "version_id": version["id"],
        "input_version_hash": version["content_hash"],
        "label": label,
        "option_ids": option_ids,
        "required_confirmations": required,
        "mode": event.get("mode"),
        "data_origin": event.get("data_origin"),
        "simulation_as_of": event.get("simulation_as_of"),
    }


def _record_usage(db: Store, run_id: str, output: dict[str, Any]) -> None:
    usage = output.get("usage") or {}
    with db.transaction() as conn:
        conn.execute(
            "UPDATE usage_ledger SET model=?, input_tokens=?, output_tokens=? WHERE run_id=?",
            (
                usage.get("model") or os.environ.get("LLM_MODEL"), usage.get("prompt_tokens"),
                usage.get("completion_tokens"), run_id,
            ),
        )


def _reserve_paid_attempt(db: Store, run_id: str) -> str:
    """Reserve before network I/O so crash recovery cannot silently double-charge."""
    limit = max(0, int(os.environ.get("REPLAN_MAX_PAID_RUNS_PER_DAY", "20")))
    today = utcnow()[:10]
    with db.transaction() as conn:
        existing = conn.execute("SELECT id FROM usage_ledger WHERE run_id=?", (run_id,)).fetchone()
        if existing:
            return "already_attempted"
        count = conn.execute("SELECT COUNT(*) FROM usage_ledger WHERE created_at LIKE ?", (today + "%",)).fetchone()[0]
        if count >= limit:
            return "budget_stopped"
        conn.execute(
            "INSERT INTO usage_ledger VALUES (?,?,?,?,?,?,?,?)",
            (identifier(), run_id, os.environ.get("LLM_MODEL"), None, None, None, "UNKNOWN", utcnow()),
        )
    return "reserved"


def _run_analysis(db: Store, run: dict[str, Any]) -> dict[str, Any]:
    from .scheduling import simulate

    event_row = db.get_json("events", run["event_id"], run["project_id"])
    version = db.get_json("versions", run["version_id"], run["project_id"])
    if not event_row or not version:
        raise ValueError("event or version was removed")
    event = event_row["data"]
    snapshot = version["data"]
    current_profile = db.get_json("projects", run["project_id"])
    project = {**snapshot["project"], **(current_profile["data"] if current_profile else {})}
    tasks = snapshot["tasks"]
    options = snapshot.get("options", [])
    budget = run["data"].get("budget_krw")
    if budget is None:
        budget = project.get("extra_budget_krw", 0)
    if event.get("classification_status") == "NO_SCHEDULE_IMPACT":
        return {"status": "NO_IMPACT", "summary": "일정에 영향을 주는 변경이 아닙니다.", "scenario_ids": [], "agent_status": "not_needed"}
    if not event.get("patch"):
        action_id = digest({"run_id": run["id"], "kind": "needs_input"})[:32]
        missing = event.get("missing_fields") or ["적용 대상", "일정 영향"]
        action = {
            "owner": "프로젝트 담당자", "state": "OPEN", "request": ", ".join(missing) + " 확인",
            "due_at": None, "event_id": event["id"], "mode": event.get("mode"),
        }
        db.put_json("actions", action_id, action, project_id=run["project_id"], event_id=event["id"], scenario_id=None)
        return {"status": "NEEDS_INPUT", "summary": "적용 여부나 기간이 확인되지 않아 일정은 변경하지 않았습니다.", "action_ids": [action_id], "scenario_ids": [], "agent_status": "not_needed"}

    unavailable = set(run["data"].get("unavailable_option_ids") or [])
    candidates: list[tuple[str, list[str]]] = [("무대응", [])]
    for option in options:
        option_id = option.get("option_id")
        if not option_id or option_id in unavailable or option.get("operation") == "REQUEST_TARGET_CHANGE":
            continue
        candidates.append((str(option.get("name") or option_id), [option_id]))
    if "OPT-02" not in unavailable and "OPT-03" not in unavailable and {"OPT-02", "OPT-03"}.issubset({item.get("option_id") for item in options}):
        candidates.append(("추가팀 + 조기 운송", ["OPT-02", "OPT-03"]))
    candidates = candidates[:8]

    scenario_ids = []
    scenario_results = []
    for label, selected in candidates:
        chosen = [item for item in options if item.get("option_id") in selected]
        result = simulate(project, tasks, event=event, options=chosen, budget_krw=int(budget))
        record = _scenario_record(run, event, version, label, selected, result)
        scenario_id = digest({"run_id": run["id"], "option_ids": selected})[:32]
        db.put_json("scenarios", scenario_id, record, project_id=run["project_id"], run_id=run["id"], version_id=version["id"])
        scenario_ids.append(scenario_id)
        scenario_results.append({"id": scenario_id, **record})

    agent_output: dict[str, Any] = {"status": "llm_unavailable", "summary": "LLM 설정이 없어 계산 결과만 제공합니다."}
    if os.environ.get("API_KEY") and os.environ.get("LLM_MODEL") and os.environ.get("LLM_BASE_URL") and os.environ.get("REPLAN_PAID_CALLS_ENABLED", "false").lower() == "true":
        paid_state = _reserve_paid_attempt(db, run["id"])
        if paid_state != "reserved":
            agent_output = {"status": paid_state, "summary": "유료 호출 한도 또는 중복 실행 방지로 계산 결과만 제공합니다."}
        else:
          try:
            from .agent import run_agent

            def get_project_context() -> dict[str, Any]:
                return {"project": project, "related_tasks": [task for task in tasks if task.get("task_id") in event.get("related_task_ids", [])], "version_id": version["id"]}

            def list_response_options() -> dict[str, Any]:
                return {"options": options, "budget_krw": budget}

            def simulate_schedule(option_ids: list[str]) -> dict[str, Any]:
                selected = set(option_ids)
                if not selected.issubset({item.get("option_id") for item in options}):
                    return {"status": "invalid_input", "error": "unknown option"}
                chosen = [item for item in options if item.get("option_id") in selected]
                return simulate(project, tasks, event=event, options=chosen, budget_krw=int(budget))

            source_calls = {"search": 0, "fetch": 0, "weather": 0}
            snapshots = db.list_json("source_snapshots", run["project_id"], limit=30)

            def search_public_sources(query: str) -> dict[str, Any]:
                source_calls["search"] += 1
                if source_calls["search"] > 2:
                    return {"status": "limit_reached", "results": []}
                terms = [part.lower() for part in query.split() if part]
                matches = [item for item in snapshots if item["status"] == "ok" and all(
                    term in str(item["data"].get("title", "") + " " + item["data"].get("summary", "")).lower() for term in terms
                )]
                return {"status": "ok", "results": [{"snapshot_id": item["id"], "source_id": item["source_id"], "title": item["data"].get("title"), "summary": item["data"].get("summary")} for item in matches[:3]]}

            def fetch_allowed_source(snapshot_id: str) -> dict[str, Any]:
                source_calls["fetch"] += 1
                if source_calls["fetch"] > 3:
                    return {"status": "limit_reached"}
                match = next((item for item in snapshots if item["id"] == snapshot_id and item["status"] == "ok"), None)
                return {"status": "ok", "snapshot": match["data"]} if match else {"status": "not_found"}

            def fetch_weather() -> dict[str, Any]:
                source_calls["weather"] += 1
                if source_calls["weather"] > 1:
                    return {"status": "limit_reached"}
                match = next((item for item in snapshots if item["data"].get("provider") == "open_meteo" and item["status"] == "ok"), None)
                return {"status": "ok", "snapshot": match["data"]} if match else {"status": "not_found"}

            def prepare_change_package(scenario_id: str) -> dict[str, Any]:
                match = next((item for item in scenario_results if item["id"] == scenario_id), None)
                if not match:
                    return {"status": "invalid_scenario"}
                return {"status": "draft_only", "scenario_id": scenario_id, "required_confirmations": match.get("required_confirmations", []), "budget_met": match.get("budget_met"), "target_met": match.get("target_met")}

            agent_output = run_agent(
                {"project": project, "version_id": version["id"], "scenario_results": [{k: v for k, v in item.items() if k != "schedule"} for item in scenario_results]},
                event,
                {
                    "get_project_context": get_project_context,
                    "list_response_options": list_response_options,
                    "simulate_schedule": simulate_schedule,
                    "search_public_sources": search_public_sources,
                    "fetch_allowed_source": fetch_allowed_source,
                    "fetch_weather": fetch_weather,
                    "prepare_change_package": prepare_change_package,
                },
            )
            _record_usage(db, run["id"], agent_output)
          except Exception as exc:
            agent_output = {"status": "error", "error": type(exc).__name__, "summary": "LLM 분석에 실패해 계산 결과만 제공합니다."}

    meeting = [item for item in scenario_results if item.get("target_met") and item.get("budget_met") and not item.get("violations")]
    summary = "현재 등록된 선택지와 예산으로 목표일 충족안을 찾지 못했습니다." if not meeting else "등록된 선택지에서 목표일과 예산을 만족하는 계산안을 찾았습니다. 실행 조건을 확인하세요."
    return {"status": "succeeded", "summary": summary, "scenario_ids": scenario_ids, "agent_status": agent_output.get("status"), "agent": agent_output, "budget_krw": budget}


def _store_source_snapshot(db: Store, project_id: str, result: dict[str, Any]) -> tuple[str, bool]:
    source_id = str(result.get("source_id") or "unknown")
    with db.connection() as conn:
        prior = conn.execute(
            "SELECT body_hash FROM source_snapshots WHERE project_id=? AND source_id=? AND status='ok' ORDER BY fetched_at DESC LIMIT 1",
            (project_id, source_id),
        ).fetchone()
    changed = result.get("status") == "ok" and (prior is None or prior["body_hash"] != result.get("body_hash"))
    snapshot_id = identifier()
    db.put_json(
        "source_snapshots", snapshot_id, result,
        project_id=project_id, source_id=source_id,
        body_hash=result.get("body_hash"), status=result.get("status", "failed"),
        fetched_at=result.get("fetched_at") or utcnow(),
    )
    return snapshot_id, changed


def _record_weather_risks(db: Store, project_id: str, plan: dict[str, Any], forecast: dict[str, Any], snapshot_id: str) -> list[str]:
    """Create reviewable task-specific events only for user-defined weather limits."""
    limits = plan.get("weather_limits") or {}
    if forecast.get("status") != "ok" or not limits:
        return []
    version = db.current_version(project_id)
    project = db.get_json("projects", project_id)
    if not version or not project:
        return []
    units = forecast.get("forecast", {}).get("units", {})
    thresholds = (
        ("max_wind_speed_kmh", "wind_speed_10m_max", "km/h"),
        ("max_precipitation_mm", "precipitation_sum", "mm"),
    )
    created = []
    for day in forecast.get("forecast", {}).get("data", []):
        day_date = day.get("date")
        if not day_date:
            continue
        exceeded = []
        for limit_key, reading_key, unit in thresholds:
            if limit_key in limits and units.get(reading_key) == unit and day.get(reading_key) is not None:
                if float(day[reading_key]) > float(limits[limit_key]):
                    exceeded.append(f"{reading_key} {day[reading_key]} {unit} > {limits[limit_key]} {unit}")
        if not exceeded:
            continue
        affected = [
            str(task["task_id"]) for task in version["data"]["tasks"]
            if task.get("outdoor") and str(task.get("baseline_start") or "")[:10] <= day_date <= str(task.get("baseline_finish") or "")[:10]
        ]
        if not affected:
            continue
        fingerprint = digest({"source": forecast.get("source_id"), "date": day_date, "tasks": affected, "limits": limits})
        with db.connection() as conn:
            existing = conn.execute("SELECT id FROM events WHERE project_id=? AND fingerprint=?", (project_id, fingerprint)).fetchone()
        if existing:
            continue
        event_id = identifier()
        event = normalize_event(
            {
                "id": event_id, "content": f"{day_date} 야외 작업 기상 한도 초과: {', '.join(exceeded)}",
                "source_label": forecast.get("source_id"), "channel": "weather_forecast",
                "mode": "LIVE", "data_origin": "PUBLIC", "fetched_at": forecast.get("fetched_at"),
                "snapshot_id": snapshot_id, "related_task_ids": affected,
                "patch": {"blocked_dates": {task_id: [day_date] for task_id in affected}},
            },
            project["data"], version["data"]["tasks"],
        )
        db.put_json("events", event_id, event, project_id=project_id, fingerprint=fingerprint)
        db.create_run(project_id, "analysis", event_id, version["id"], f"weather:{event_id}", {})
        created.append(event_id)
    return created


def _run_scan(db: Store, run: dict[str, Any]) -> dict[str, Any]:
    from .adapters.sources import fetch_registered_source, fetch_weather

    watch = db.get_json("watch_plans", run["project_id"])
    if not watch or not watch["data"].get("enabled"):
        return {"status": "disabled", "sources": []}
    plan = watch["data"]
    scope = run["data"].get("scope", "all")
    source_results = []
    new_event_ids = []
    site = plan.get("weather_site")
    if site and scope in {"all", "weather"}:
        try:
            result = fetch_weather(site)
        except Exception as exc:
            result = {"status": "failed", "source_id": "open-meteo", "fetched_at": utcnow(), "error": type(exc).__name__}
        snapshot_id, changed = _store_source_snapshot(db, run["project_id"], result)
        new_event_ids.extend(_record_weather_risks(db, run["project_id"], plan, result, snapshot_id))
        source_results.append({"snapshot_id": snapshot_id, "source_id": result.get("source_id"), "status": result.get("status"), "changed": changed})
    allowed_urls = plan.get("source_allowlist") or []
    allowed_hosts = [urlparse(url).hostname for url in allowed_urls]
    for url in allowed_urls[:3] if scope in {"all", "notices"} else []:
        try:
            result = fetch_registered_source(url, [host for host in allowed_hosts if host])
        except Exception as exc:
            result = {"status": "failed", "source_id": url, "fetched_at": utcnow(), "error": type(exc).__name__}
        snapshot_id, changed = _store_source_snapshot(db, run["project_id"], result)
        source_results.append({"snapshot_id": snapshot_id, "source_id": result.get("source_id"), "status": result.get("status"), "changed": changed})
        if changed:
            version = db.current_version(run["project_id"])
            project = db.get_json("projects", run["project_id"])
            if version and project:
                event = normalize_event(
                    {"content": result.get("summary") or result.get("content") or result.get("title") or "새 공지", "source_label": result.get("source_id"), "channel": "registered_public_source", "mode": "LIVE", "data_origin": "PUBLIC", "published_at": result.get("published_at"), "fetched_at": result.get("fetched_at"), "snapshot_id": snapshot_id},
                    project["data"], version["data"]["tasks"],
                )
                fingerprint = digest({"source": result.get("source_id"), "body_hash": result.get("body_hash")})
                with db.connection() as conn:
                    exists = conn.execute("SELECT id FROM events WHERE project_id=? AND fingerprint=?", (run["project_id"], fingerprint)).fetchone()
                if not exists:
                    event_id = identifier()
                    event["id"] = event_id
                    db.put_json("events", event_id, event, project_id=run["project_id"], fingerprint=fingerprint)
                    db.create_run(run["project_id"], "analysis", event_id, version["id"], f"source:{event_id}", {})
                    new_event_ids.append(event_id)
    return {"status": "succeeded", "scope": scope, "sources": source_results, "new_or_changed_count": sum(bool(item["changed"]) for item in source_results), "new_event_ids": new_event_ids}


def enqueue_due_scans(db: Store, now: datetime | None = None) -> int:
    """Queue each enabled source only when its own approved polling interval is due."""
    now = now or datetime.now(timezone.utc)
    queued = 0
    with db.connection() as conn:
        plans = conn.execute("SELECT project_id, data FROM watch_plans").fetchall()
    for row in plans:
        plan = json.loads(row["data"])
        if not plan.get("enabled"):
            continue
        for scope, configured, field in (
            ("weather", bool(plan.get("weather_site")), "weather_poll_hours"),
            ("notices", bool(plan.get("source_allowlist")), "notice_poll_hours"),
        ):
            if not configured:
                continue
            hours = max(1, min(int(plan.get(field, 6)), 168))
            with db.connection() as conn:
                recent = conn.execute(
                    "SELECT status, data, created_at FROM runs WHERE project_id=? AND kind='scan' ORDER BY created_at DESC LIMIT 100",
                    (row["project_id"],),
                ).fetchall()
            relevant = [item for item in recent if json.loads(item["data"]).get("scope", "all") in {"all", scope}]
            if relevant:
                latest = relevant[0]
                if latest["status"] in {"queued", "running"}:
                    continue
                last_at = datetime.fromisoformat(latest["created_at"])
                if (now - last_at).total_seconds() < hours * 3600:
                    continue
            key = f"scheduled:{scope}:{int(now.timestamp()) // (hours * 3600)}"
            created = db.create_run(row["project_id"], "scan", None, None, key, {"scope": scope})
            if created["status"] == "queued":
                queued += 1
    return queued


def run_once(db: Store | None = None) -> bool:
    db = db or Store()
    run = db.claim_next_run()
    if not run:
        return False
    try:
        if run["kind"] == "analysis":
            result = _run_analysis(db, run)
        elif run["kind"] == "scan":
            result = _run_scan(db, run)
        else:
            raise ValueError("unsupported run kind")
        db.update_run(run["id"], "succeeded", result)
    except Exception as exc:
        db.update_run(run["id"], "failed", {"status": "failed", "error": type(exc).__name__, "detail": str(exc)[:500]})
    return True


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    db = Store()
    db.recover_interrupted_runs()
    if args.once:
        enqueue_due_scans(db)
        run_once(db)
        return
    try:
        while True:
            enqueue_due_scans(db)
            if not run_once(db):
                time.sleep(2)
    except KeyboardInterrupt:
        return


if __name__ == "__main__":
    main()
