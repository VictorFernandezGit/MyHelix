"""Save one finished report so the Next.js page can read it."""
from supabase import Client

from app.panel.evaluate import EntryResult, PanelStats
from app.panel.repository import Panel


def save_report(
    client: Client, upload: dict, panel: Panel, results: list[EntryResult], stats: PanelStats
) -> None:
    # upsert = insert, or update if it already exists, so re-running an upload is safe
    client.table("reports").upsert(
        {
            "upload_id": upload["id"],
            "user_id": upload["user_id"],
            "panel_version_id": panel.version_id,
            "snps_in_file": stats.snps_in_file,
            "call_rate": stats.call_rate,
            "panel_total": stats.panel_total,
            "panel_found": stats.panel_found,
        },
        on_conflict="upload_id",
    ).execute()

    rows = [
        {
            "upload_id": upload["id"],
            "user_id": upload["user_id"],
            "variant_id": r.entry["variant_id"],
            "rsid": r.entry["rsid"],
            "domain": r.entry["domain"],
            "genotype": r.genotype,
            "status": r.status,
            "evidence_tier": r.entry["evidence_tier"],
            "summary": r.entry["summary"],
            "citations": r.entry["citations"],
        }
        for r in results
    ]
    if rows:
        client.table("report_findings").upsert(rows, on_conflict="upload_id,variant_id").execute()
