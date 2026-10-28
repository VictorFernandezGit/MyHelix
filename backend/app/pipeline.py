"""The whole job for one upload: download -> parse -> normalize -> compare -> save."""
from app.db import get_client
from app.ingest.pipeline import ingest
from app.normalize.pipeline import normalize
from app.panel.evaluate import evaluate_panel, to_findings
from app.panel.repository import load_panel
from app.reporting.builder import build_report
from app.reporting.repository import save_report
from app.schemas import Vendor

BUCKET = "uploads"            # <-- your Storage bucket name
PATH_COLUMN = "storage_path"  # <-- the uploads column holding the file's path in that bucket


def _set_status(client, upload_id: str, status: str) -> None:
    client.table("uploads").update({"status": status}).eq("id", upload_id).execute()


def run_pipeline(upload_id: str):
    client = get_client()
    upload = client.table("uploads").select("*").eq("id", upload_id).single().execute().data
    _set_status(client, upload_id, "processing")
    try:
        data = client.storage.from_(BUCKET).download(upload[PATH_COLUMN])   # bytes
        records = ingest(data)
        normalized = normalize(records)
        panel = load_panel(client)
        results, stats = evaluate_panel(normalized, panel)
        report = build_report(Vendor(upload["vendor"]), to_findings(results), panel.label)
        save_report(client, upload, panel, results, stats)
        _set_status(client, upload_id, "complete")
        return report
    except Exception:
        _set_status(client, upload_id, "failed")
        raise
