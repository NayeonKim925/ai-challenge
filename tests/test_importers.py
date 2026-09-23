import csv
import io
import unittest
from pathlib import Path

from openpyxl import Workbook
from openpyxl.utils.datetime import CALENDAR_MAC_1904

from services.api.app.importers import diff_tasks, parse_upload


ROOT = Path(__file__).resolve().parents[1]


class ImporterTests(unittest.TestCase):
    def test_demo_workbook_imports_expected_buckets(self):
        content = (ROOT / "REPLAN_demo_inputs.xlsx").read_bytes()

        parsed = parse_upload("REPLAN_demo_inputs.xlsx", content)

        self.assertEqual("DEMO-P001", parsed["project"]["project_id"])
        self.assertEqual(20, len(parsed["tasks"]))
        self.assertEqual(4, len(parsed["options"]))
        self.assertEqual(5, len(parsed["events"]))
        self.assertEqual(1, len(parsed["calendars"]))
        self.assertEqual("일정표", parsed["tasks"][0]["_source_sheet"])
        self.assertEqual("A8", parsed["tasks"][0]["_cell_refs"]["task_id"])
        self.assertEqual("T01", parsed["tasks"][0]["task_id"])
        self.assertEqual("2026-09-14", parsed["tasks"][0]["planned_start"])
        self.assertEqual("T01", parsed["tasks"][1]["predecessor_ids"][0])
        self.assertEqual(["T06", "T09", "T10"], parsed["tasks"][10]["predecessor_ids"])
        self.assertEqual("E01", parsed["events"][0]["event_id"])
        self.assertIn("T07", parsed["options"][0]["target_id"])
        self.assertEqual(7, parsed["mapping"]["일정표"]["header_row"])

    def test_csv_import_discovers_header_after_intro_and_handles_bom(self):
        output = io.StringIO()
        output.write("\ufeffRE:PLAN export\n")
        output.write("generated for test\n")
        writer = csv.writer(output)
        writer.writerow(["작업 ID", "작업명", "계획 시작", "계획 종료", "작업일수"])
        writer.writerow(["T100", "CSV 작업", "2026-10-01", "2026-10-02", "2"])

        parsed = parse_upload("tasks.csv", output.getvalue().encode("utf-8"))

        self.assertEqual(1, len(parsed["tasks"]))
        task = parsed["tasks"][0]
        self.assertEqual("T100", task["task_id"])
        self.assertEqual("CSV 작업", task["name"])
        self.assertEqual("2026-10-01", task["planned_start"])
        self.assertEqual(2, task["duration_workdays"])
        self.assertEqual(3, parsed["mapping"]["CSV"]["header_row"])

    def test_xlsx_header_mapping_uses_cell_addresses_for_sparse_rows(self):
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "일정표"
        sheet["B3"] = "작업 ID"
        sheet["D3"] = "작업명"
        sheet["F3"] = "계획 시작"
        sheet["H3"] = "계획 종료"
        sheet["J3"] = "작업일수"
        sheet["B4"] = "T200"
        sheet["D4"] = "빈 칸 많은 양식"
        sheet["F4"] = "2026-10-05"
        sheet["H4"] = "2026-10-06"
        sheet["J4"] = 2
        payload = io.BytesIO()
        workbook.save(payload)

        parsed = parse_upload("sparse.xlsx", payload.getvalue())

        task = parsed["tasks"][0]
        self.assertEqual("T200", task["task_id"])
        self.assertEqual("빈 칸 많은 양식", task["name"])
        self.assertEqual("2026-10-05", task["planned_start"])
        self.assertEqual("2026-10-06", task["planned_finish"])
        self.assertEqual("B3", parsed["mapping"]["일정표"]["columns"]["task_id"])
        self.assertEqual("J4", task["_cell_refs"]["duration_workdays"])

    def test_xlsx_date1904_workbook_dates_are_normalized(self):
        workbook = Workbook()
        workbook.epoch = CALENDAR_MAC_1904
        sheet = workbook.active
        sheet.title = "일정표"
        sheet.append(["작업 ID", "작업명", "계획 시작", "계획 종료", "작업일수"])
        sheet.append(["T300", "1904 날짜체계", "2026-10-05", "2026-10-06", 2])
        for cell in ("C2", "D2"):
            sheet[cell].number_format = "yyyy-mm-dd"
        payload = io.BytesIO()
        workbook.save(payload)

        parsed = parse_upload("date1904.xlsx", payload.getvalue())

        task = parsed["tasks"][0]
        self.assertEqual("2026-10-05", task["planned_start"])
        self.assertEqual("2026-10-06", task["planned_finish"])

    def test_diff_tasks_reports_added_removed_changed_and_unchanged(self):
        current = [
            {"task_id": "T01", "name": "A", "_cell_refs": {"name": "B2"}},
            {"task_id": "T02", "name": "B"},
        ]
        imported = [
            {"task_id": "T01", "name": "A"},
            {"task_id": "T03", "name": "C"},
        ]

        diff = diff_tasks(current, imported)

        self.assertEqual(["T01"], diff["unchanged"])
        self.assertEqual(["T02"], [task["task_id"] for task in diff["removed"]])
        self.assertEqual(["T03"], [task["task_id"] for task in diff["added"]])
        self.assertEqual(0, diff["summary"]["changed"])


if __name__ == "__main__":
    unittest.main()
