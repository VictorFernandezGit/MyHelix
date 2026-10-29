from app.panel.evidence import evidence_tier
from app.panel.panel import PanelVariant, load_panel
from app.schemas import Finding, FindingStatus, NormalizedSNPRecord


def summary(v: PanelVariant) -> str:
    papers = "publication" if v.n_papers == 1 else "publications"
    text = (
        f"Associated with {v.traits} in {v.n_papers} GWAS {papers} "
        f"(largest discovery sample {v.max_sample_size:,}; strongest p = {10 ** -v.best_mlog:.1e})."
    )
    if v.max_replication_size:
        text += f" Tested in an independent replication sample of {v.max_replication_size:,}."
    return text


def _status(v: PanelVariant, record: NormalizedSNPRecord | None, in_file: bool) -> FindingStatus:
    # order matters here, missing first then anything we cant read then carried or not
    if record is None:
        return FindingStatus.NO_CALL if in_file else FindingStatus.NOT_ON_CHIP
    if record.is_indel or v.is_palindromic:
        return FindingStatus.NO_CALL
    alleles = {a for a in (record.allele1, record.allele2) if a}
    if not alleles <= v.alleles:
        return FindingStatus.NO_CALL
    return FindingStatus.CARRIED if v.risk_allele in alleles else FindingStatus.NOT_CARRIED


def _finding(v: PanelVariant, record: NormalizedSNPRecord | None, in_file: bool) -> Finding:
    genotype = record.allele1 + (record.allele2 or "") if record else None
    return Finding(
        variant_id=v.rsid,
        rsid=v.rsid,
        domain=v.domain,
        status=_status(v, record, in_file),
        genotype=genotype,
        evidence_tier=evidence_tier(v.max_sample_size, v.best_mlog, v.replicated_papers),
        summary=summary(v),
        citations=[f"PMID:{pmid}" for pmid in v.pubmed_ids],
    )


def match_panel(
    records: list[NormalizedSNPRecord],
    panel: tuple[PanelVariant, ...] | None = None,
    in_file: set[str] | None = None,
) -> list[Finding]:
    panel = load_panel() if panel is None else panel
    by_rsid = {r.rsid: r for r in records}
    in_file = in_file or set()
    return [_finding(v, by_rsid.get(v.rsid), v.rsid in in_file) for v in panel]
