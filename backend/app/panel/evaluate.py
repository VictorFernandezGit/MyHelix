"""Compare one person's normalized genotypes with the panel.

Every panel entry gets exactly one status, so "not tested" is never confused with "negative":
    carried      readable, and the hit rule is satisfied
    not_carried  readable, hit rule not satisfied
    no_call      marker is in the file but could not be read (-- / 0 / indel)
    not_on_chip  marker is not in the file at all
"""
from dataclasses import dataclass

from app.panel.repository import Panel
from app.schemas import Domain, EvidenceTier, Finding, NormalizedSNPRecord

NO_CALL = {None, "", "-", "0", "."}
BASES = set("ACGT")


@dataclass(frozen=True)
class EntryResult:
    entry: dict
    status: str
    genotype: str | None


@dataclass(frozen=True)
class PanelStats:
    snps_in_file: int
    call_rate: float        # percent
    panel_total: int
    panel_found: int        # entries readable in this file


def _build(value) -> str:
    return str(getattr(value, "value", value))


def evaluate_panel(
    records: list[NormalizedSNPRecord], panel: Panel
) -> tuple[list[EntryResult], PanelStats]:
    # refuse build mismatch
    builds = {_build(r.genome_build) for r in records}
    if builds and builds != {panel.genome_build}:
        raise ValueError(f"File is {builds} but panel is {panel.genome_build}; positions would not line up.")

    index = {(str(r.chromosome), int(r.position)): r for r in records}
    results: list[EntryResult] = []

    for e in panel.entries:
        rec = index.get((str(e["chromosome"]), int(e["position"])))
        if rec is None:
            results.append(EntryResult(e, "not_on_chip", None))
            continue
        a1, a2 = rec.allele1, rec.allele2
        if a1 not in BASES or a2 not in BASES:
            results.append(EntryResult(e, "no_call", None))
            continue
        copies = (a1 == e["effect_allele"]) + (a2 == e["effect_allele"])
        status = "carried" if copies >= e["hit_min_copies"] else "not_carried"
        results.append(EntryResult(e, status, "".join(sorted((a1, a2)))))

    called = sum(1 for r in records if r.allele1 not in NO_CALL and r.allele2 not in NO_CALL)
    stats = PanelStats(
        snps_in_file=len(records),
        call_rate=round(100 * called / len(records), 2) if records else 0.0,
        panel_total=len(panel.entries),
        panel_found=sum(1 for r in results if r.status in ("carried", "not_carried")),
    )
    return results, stats


def to_findings(results: list[EntryResult]) -> list[Finding]:
    """Findings are only for carried variants. They feed build_report / the Q&A."""
    return [
        Finding(
            variant_id=r.entry["variant_id"],
            rsid=r.entry["rsid"],
            domain=Domain(r.entry["domain"]),
            genotype=r.genotype,
            evidence_tier=EvidenceTier(r.entry["evidence_tier"]),
            summary=r.entry["summary"],
            citations=r.entry["citations"],
        )
        for r in results
        if r.status == "carried"
    ]
