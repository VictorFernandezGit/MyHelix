# runs one upload start to finish, download from storage then analyze then save to supabase
# file gets deleted at the end no matter what happens
import logging
from dataclasses import dataclass

from app.core.config import settings
from app.core.db import get_client
from app.ingest import ingest
from app.normalize import normalize
from app.normalize.rsid_resolver import resolve_rsid
from app.panel import PANEL_VERSION, load_panel, match_panel, panel_aliases, panel_reference
from app.panel.popular import match_popular
from app.reporting import build_report
from app.schemas import FindingStatus, Report

logger = logging.getLogger(__name__)

FOUND = {FindingStatus.CARRIED, FindingStatus.NOT_CARRIED}


@dataclass(frozen=True)
class PanelStats:
    snps_in_file: int
    call_rate: float
    panel_total: int
    panel_found: int


def analyze(data: bytes, panel=None) -> tuple[Report, PanelStats]:
    raw = ingest(data)
    panel = panel or load_panel()
    aliases = panel_aliases(panel)
    # every rsid in the file even no calls, so we can tell unreadable apart from not on the chip
    in_file = {resolve_rsid(r.rsid, aliases) for r in raw}
    findings = match_panel(normalize(raw, aliases, panel_reference(panel)), panel, in_file)
    called = sum(1 for r in raw if "-" not in r.genotype)
    stats = PanelStats(
        snps_in_file=len(raw),
        call_rate=round(100 * called / len(raw), 2),
        panel_total=len(findings),
        panel_found=sum(1 for f in findings if f.status in FOUND),
    )
    return build_report(raw[0].vendor, findings, PANEL_VERSION, match_popular(raw)), stats


def _set_status(client, upload_id: str, status: str) -> None:
    client.table("uploads").update({"status": status}).eq("id", upload_id).execute()


def _panel_version_id(client) -> str:
    rows = client.table("panel_versions").select("id").eq("label", PANEL_VERSION).execute().data
    if not rows:
        raise RuntimeError(f"Panel {PANEL_VERSION} is not published. Run: python -m scripts.publish_panel")
    return rows[0]["id"]


def _save(client, upload: dict, report: Report, stats: PanelStats) -> None:
    client.table("reports").upsert(
        {
            "upload_id": upload["id"],
            "user_id": upload["user_id"],
            "panel_version_id": _panel_version_id(client),
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
            "variant_id": f.variant_id,
            "rsid": f.rsid,
            "domain": f.domain.value,
            "genotype": f.genotype,
            "status": f.status.value,
            "evidence_tier": f.evidence_tier.value,
            "summary": f.summary,
            "citations": f.citations,
        }
        for fs in report.findings_by_domain.values()
        for f in fs
    ]
    popular = [
        {"upload_id": upload["id"], "user_id": upload["user_id"], **m.model_dump(mode="json")}
        for m in report.popular_markers
    ]
    # if the findings dont save we delete the report row too so theres never a half saved report
    try:
        client.table("report_findings").upsert(rows, on_conflict="upload_id,variant_id").execute()
        if popular:
            client.table("report_popular_markers").upsert(popular, on_conflict="upload_id,rsid").execute()
    except Exception:
        client.table("reports").delete().eq("upload_id", upload["id"]).execute()
        raise


def run_pipeline(upload_id: str) -> str:
    client = get_client()
    upload = client.table("uploads").select("*").eq("id", upload_id).single().execute().data
    bucket = client.storage.from_(settings.uploads_bucket)
    _set_status(client, upload_id, "processing")
    try:
        report, stats = analyze(bucket.download(upload["storage_path"]))
        _save(client, upload, report, stats)
        _set_status(client, upload_id, "complete")
        return "complete"
    except Exception:
        logger.exception("Pipeline failed for upload %s", upload_id)
        _set_status(client, upload_id, "failed")
        return "failed"
    # we never keep the raw file, success or fail
    finally:
        bucket.remove([upload["storage_path"]])
