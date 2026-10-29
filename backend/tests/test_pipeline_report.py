# end to end test with the synthetic file
# uses the old v0 panel on purpose so the expected results dont change when we update the real panel
import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.panel import PANEL_VERSION, load_panel
from app.pipeline import analyze

FIXTURES = Path(__file__).parent / "fixtures"
FIXTURE = FIXTURES / "synthetic_23andme.txt"
FIXTURE_PANEL = FIXTURES / "panel_v0.csv"

EXPECTED = {
    "rs2239647": ("carried", "AA"),
    "rs3128341": ("carried", "TC"),
    "rs10189857": ("not_carried", "GG"),
    "rs1054442": ("no_call", None),
    "rs7963801": ("not_carried", "CC"),
    "rs4687625": ("carried", "CT"),
    "rs425724": ("carried", "TC"),
    "rs9528369": ("not_on_chip", None),
    "rs273534": ("not_carried", "AA"),
    "rs13262595": ("carried", "AC"),
    "rs13217795": ("not_carried", "GT"),
    "rs2073526": ("carried", "GA"),
    "rs4500960": ("not_carried", "TT"),
    "rs10896636": ("no_call", "CG"),
    "rs860626": ("carried", "TT"),
    "rs6981523": ("not_carried", "CA"),
    "rs9611519": ("carried", "TT"),
    "rs11608355": ("carried", "TC"),
}


def _report_json(panel_file: Path | None = None) -> dict:
    report, _ = analyze(FIXTURE.read_bytes(), load_panel(panel_file) if panel_file else None)
    print(report.model_dump_json(indent=2))
    return json.loads(report.model_dump_json())


def _findings(report: dict) -> dict:
    return {f["rsid"]: f for fs in report["findings_by_domain"].values() for f in fs}


def test_synthetic_file_produces_expected_json_report():
    report = _report_json(FIXTURE_PANEL)
    assert report["vendor"] == "23andme"
    assert report["panel_version"] == PANEL_VERSION
    assert set(report["findings_by_domain"]) == {
        "memory_retention", "focus_cognition", "stress_resiliency", "processing_speed",
    }
    findings = _findings(report)
    assert {rsid: (f["status"], f["genotype"]) for rsid, f in findings.items()} == EXPECTED
    assert all(f["citations"] for f in findings.values())


def test_report_is_deterministic():
    assert _report_json() == _report_json()


def test_upload_endpoint_returns_same_json():
    client = TestClient(app)
    response = client.post("/upload", files={"file": ("synthetic.txt", FIXTURE.read_bytes())})
    assert response.status_code == 200
    assert response.json() == _report_json()
