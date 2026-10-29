# pipeline tests with a fake supabase client so you dont need network or keys to run them
import io
import zipfile
from pathlib import Path

import pytest

from app import pipeline
from app.ingest import IngestError, ingest
from app.panel import load_panel

FIXTURE = Path(__file__).parent / "fixtures" / "synthetic_23andme.txt"


def _zip(files: dict[str, bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for name, data in files.items():
            z.writestr(name, data)
    return buf.getvalue()


def test_ingest_accepts_zip():
    data = FIXTURE.read_bytes()
    assert ingest(_zip({"genome.txt": data})) == ingest(data)


def test_ingest_rejects_zip_without_single_txt():
    with pytest.raises(IngestError):
        ingest(_zip({"a.txt": b"x", "b.txt": b"y"}))


class FakeQuery:
    def __init__(self, db, table):
        self.db, self.table, self.op = db, table, None

    def select(self, *_):
        self.op = "select"
        return self

    def update(self, values):
        self.op, self.values = "update", values
        return self

    def upsert(self, values, **_):
        self.op, self.values = "upsert", values
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, *_):
        return self

    def single(self):
        return self

    def execute(self):
        if self.op == "select" and self.table == "panel_versions":
            return type("R", (), {"data": [{"id": "pv1"}]})
        if self.op == "select":
            return type("R", (), {"data": self.db.upload})
        if self.op == "upsert" and self.table == "report_findings":
            self.db.findings.extend(self.values)
            return type("R", (), {"data": None})
        if self.op == "upsert" and self.table == "report_popular_markers":
            self.db.popular.extend(self.values)
            return type("R", (), {"data": None})
        if self.op == "update":
            self.db.statuses.append(self.values["status"])
        if self.op == "upsert":
            self.db.reports.append(self.values)
        return type("R", (), {"data": None})


class FakeBucket:
    def __init__(self, db):
        self.db = db

    def download(self, path):
        return self.db.files[path]

    def remove(self, paths):
        for p in paths:
            self.db.files.pop(p)


class FakeClient:
    def __init__(self, file_bytes):
        self.upload = {"id": "u1", "user_id": "user1", "storage_path": "user1/genome.txt"}
        self.files = {"user1/genome.txt": file_bytes}
        self.statuses, self.reports, self.findings, self.popular = [], [], [], []
        self.storage = type("S", (), {"from_": lambda _, __: FakeBucket(self)})()

    def table(self, name):
        return FakeQuery(self, name)


def _run(monkeypatch, file_bytes):
    client = FakeClient(file_bytes)
    monkeypatch.setattr(pipeline, "get_client", lambda: client)
    client.result = pipeline.run_pipeline("u1")
    return client


def test_run_pipeline_saves_report_and_deletes_file(monkeypatch):
    client = _run(monkeypatch, FIXTURE.read_bytes())
    assert client.statuses == ["processing", "complete"] and client.result == "complete"
    assert client.files == {}
    [row] = client.reports
    assert row["upload_id"] == "u1" and row["user_id"] == "user1"
    assert row["panel_version_id"] == "pv1"
    assert row["panel_total"] == len(load_panel()) == len(client.findings)
    statuses = {"carried", "not_carried", "no_call", "not_on_chip"}
    assert all(f["status"] in statuses and f["evidence_tier"] for f in client.findings)
    assert len(client.popular) == 11
    assert all(m["upload_id"] == "u1" and m["citations"] for m in client.popular)


def test_run_pipeline_failure_saves_nothing_and_deletes_file(monkeypatch):
    client = _run(monkeypatch, b"not a genome file")
    assert client.statuses == ["processing", "failed"] and client.result == "failed"
    assert client.reports == [] and client.findings == []
    assert client.files == {}
