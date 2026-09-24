from services.api.app.events import normalize_event


PROJECT = {"baseline_start": "2026-09-14"}


TASKS = [
    {
        "task_id": "ACT-17",
        "name": "검사 설비 현장 도착",
        "baseline_start": "2026-09-21",
        "baseline_finish": "2026-09-22",
        "resource_group": "물류팀",
    },
    {
        "task_id": "ACT-18",
        "name": "공급사 엔지니어 시운전",
        "baseline_start": "2026-09-23",
        "baseline_finish": "2026-09-24",
        "resource_group": "시운전팀",
    },
]


def test_event_matches_task_semantics_without_demo_ids():
    event = normalize_event(
        {
            "content": "검사 설비 현장 도착 예정일이 2026-09-22에서 2026-09-24로 변경되었습니다. 공급사 엔지니어 시운전은 2026-09-25부터 가능합니다.",
            "source_label": "supplier@example.com",
        },
        PROJECT,
        TASKS,
    )

    assert event["classification_status"] == "PATCH_PROPOSED"
    assert event["review_status"] == "PENDING"
    assert event["patch"]["estimated_finish"] == {"ACT-17": "2026-09-24"}
    assert event["patch"]["not_before"] == {"ACT-18": "2026-09-25"}
    assert event["related_task_ids"] == ["ACT-17", "ACT-18"]


def test_event_keeps_ambiguous_message_in_review_queue():
    event = normalize_event(
        {"content": "일정이 일부 변경될 수 있습니다. 확인 부탁드립니다."},
        PROJECT,
        TASKS,
    )

    assert event["patch"] == {}
    assert event["classification_status"] == "NEEDS_REVIEW"
    assert event["review_status"] == "PENDING"


def test_english_message_uses_task_metadata_not_fixed_task_ids():
    tasks = [
        {"task_id": "WORK-A", "resource_group": "fabrication", "baseline_start": "2026-09-21", "baseline_finish": "2026-09-25"},
        {"task_id": "WORK-B", "resource_group": "test", "baseline_start": "2026-09-28", "baseline_finish": "2026-09-29"},
    ]
    event = normalize_event(
        {"content": "Fabrication finish moves to September 30. FAT can start October 1."},
        PROJECT,
        tasks,
    )

    assert event["patch"] == {
        "estimated_finish": {"WORK-A": "2026-09-30"},
        "not_before": {"WORK-B": "2026-10-01"},
    }
