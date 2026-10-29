# pushes the panel csv into the supabase panel tables
# fine to rerun it just replaces the entries for that version
from datetime import datetime, timezone

from app.core.db import get_client
from app.panel import PANEL_VERSION, load_panel
from app.panel.evidence import evidence_tier
from app.panel.matcher import summary

GENOME_BUILD = "hg19"
REVIEWER = "select_panel (not yet reviewed)"


def entry_row(v, version_id: str, now: str) -> dict:
    return {
        "panel_version_id": version_id,
        "variant_id": v.rsid,
        "rsid": v.rsid,
        "domain": v.domain.value,
        "genome_build": GENOME_BUILD,
        "chromosome": v.chromosome,
        "position": v.position,
        "allele_string": "/".join(sorted(v.alleles)),
        "is_palindromic": v.is_palindromic,
        "effect_allele": v.risk_allele,
        "hit_min_copies": 1,
        "effect_direction": "unknown",
        "trait_label": v.traits,
        "evidence_tier": evidence_tier(v.max_sample_size, v.best_mlog, v.replicated_papers).value,
        "summary": summary(v),
        "reviewed_by": REVIEWER,
        "reviewed_at": now,
    }


def main() -> None:
    client = get_client()
    panel = load_panel()
    now = datetime.now(timezone.utc).isoformat()

    version = client.table("panel_versions").upsert(
        {
            "label": PANEL_VERSION,
            "genome_build": GENOME_BUILD,
            "ensembl_server": "grch37.rest.ensembl.org",
            "notes": "GWAS Catalog hits on the 23andMe chip, built by select_panel + import_panel",
            "published_at": now,
        },
        on_conflict="label",
    ).execute().data[0]

    # wipe this versions entries first so rerunning doesnt make duplicates
    client.table("panel_entries").delete().eq("panel_version_id", version["id"]).execute()
    entries = client.table("panel_entries").insert(
        [entry_row(v, version["id"], now) for v in panel]
    ).execute().data

    by_rsid = {e["rsid"]: e["id"] for e in entries}
    sources = [
        {"panel_entry_id": by_rsid[v.rsid], "citation": f"PMID:{pmid}", "pubmed_id": pmid}
        for v in panel
        for pmid in v.pubmed_ids
    ]
    client.table("panel_sources").insert(sources).execute()
    print(f"Published panel {PANEL_VERSION}: {len(entries)} entries, {len(sources)} sources")


if __name__ == "__main__":
    main()
