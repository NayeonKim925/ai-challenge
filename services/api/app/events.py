"""Normalize user and replay inputs into explicit, reviewable event patches."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any


def _year(value: dict[str, Any], project: dict[str, Any]) -> int:
    timestamp = value.get("published_at") or value.get("received_at") or value.get("simulation_as_of")
    if timestamp:
        try:
            return datetime.fromisoformat(str(timestamp)).year
        except ValueError:
            pass
    baseline = project.get("baseline_start") or project.get("baseline_start_date")
    if baseline:
        return date.fromisoformat(str(baseline)[:10]).year
    return datetime.now().year


def normalize_event(value: dict[str, Any], project: dict[str, Any], tasks: list[dict[str, Any]]) -> dict[str, Any]:
    """Extract only a narrow set of changes; uncertain facts remain review items.

    A caller may supply a typed patch after human confirmation. Free text is not
    silently converted to arbitrary schedule changes.
    """
    event = dict(value)
    event.setdefault("mode", project.get("mode", "LIVE"))
    event.setdefault("data_origin", "SYNTHETIC" if event["mode"] == "REPLAY" else "USER")
    content = str(event.get("content") or event.get("message") or "")
    event["content"] = content
    event.setdefault("title", content[:90] or "변경 이벤트")
    event.setdefault("related_task_ids", [])
    event.setdefault("patch", {})
    event.setdefault("classification_status", "NEEDS_REVIEW")
    if event["patch"]:
        event["classification_status"] = "PATCH_PROVIDED"
        return event

    task_ids = {str(task.get("task_id") or task.get("id")) for task in tasks}
    direct_ids = re.findall(r"\bT\d{2,}\b", content)
    related = [task_id for task_id in direct_ids if task_id in task_ids]
    if related:
        event["related_task_ids"] = sorted(set(related))

    lowered = content.lower()
    if ("전화번호" in content or "연락처" in content) and not any(word in content for word in ("지연", "불가", "변경됩니다")):
        event["classification_status"] = "NO_SCHEDULE_IMPACT"
        return event

    year = _year(event, project)
    if "제작 완료" in content and "FAT" in content:
        dates = re.findall(r"(\d{1,2})월\s*(\d{1,2})일", content)
        if len(dates) >= 3 and "T03" in task_ids:
            finish = date(year, int(dates[1][0]), int(dates[1][1])).isoformat()
            fat_start = date(year, int(dates[2][0]), int(dates[2][1])).isoformat()
            event["patch"] = {"estimated_finish": {"T03": finish}, "not_before": {"T04": fat_start}}
            event["related_task_ids"] = ["T03", "T04"]
            event["classification_status"] = "PATCH_PROPOSED"
            return event

    if "야외 인양" in content and "수행하지" in content:
        dates = re.findall(r"(\d{1,2})월\s*(\d{1,2})일", content)
        if dates and "T11" in task_ids:
            blocked = date(year, int(dates[0][0]), int(dates[0][1])).isoformat()
            event["patch"] = {"blocked_dates": {"T11": [blocked]}}
            event["related_task_ids"] = ["T11"]
            event["classification_status"] = "PATCH_PROPOSED"
            return event

    if "기계팀" in content and "투입이 불가능" in content:
        range_match = re.search(r"(\d{1,2})월\s*(\d{1,2})[~\-](\d{1,2})일", content)
        if range_match:
            month, first, last = map(int, range_match.groups())
            dates = [date(year, month, day).isoformat() for day in range(first, last + 1)]
            event["patch"] = {"resource_unavailable": {"기계팀": dates}}
            event["related_task_ids"] = [str(task.get("task_id")) for task in tasks if task.get("resource_group") == "기계팀"]
            event["classification_status"] = "PATCH_PROPOSED"
            return event

    if "추가 서류" in content or "정책" in str(event.get("channel", "")):
        event["classification_status"] = "NEEDS_INPUT"
        event["missing_fields"] = ["적용 대상", "처리 기간"]
    return event
