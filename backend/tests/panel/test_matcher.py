# matcher tests, each status plus the evidence tiers and a sanity check on the real panel file
from app.panel import load_panel, match_panel
from app.panel.panel import PanelVariant
from app.panel.evidence import evidence_tier
from app.panel.matcher import summary
from app.schemas import Domain, EvidenceTier, FindingStatus, NormalizedSNPRecord


def _variant(rsid: str, alleles: set[str], risk: str = "A") -> PanelVariant:
    return PanelVariant(
        rsid=rsid, domain=Domain.FOCUS, risk_allele=risk, alleles=frozenset(alleles), aliases=frozenset(),
        gene="GENE", chromosome="1", position=1000, n_papers=2, max_sample_size=50_000, best_mlog=9.0,
        pubmed_ids=("111", "222"), traits="cognitive function measurement",
    )


def _record(rsid: str, a1: str, a2: str | None, is_indel: bool = False) -> NormalizedSNPRecord:
    return NormalizedSNPRecord(
        rsid=rsid, chromosome="1", position=1000, genome_build="GRCh37",
        is_indel=is_indel, allele1=a1, allele2=a2,
    )


def _status_for(variant: PanelVariant, record: NormalizedSNPRecord | None, in_file: bool = True) -> FindingStatus:
    [finding] = match_panel([record] if record else [], (variant,), {variant.rsid} if in_file else set())
    return finding.status


def test_carried_hom_and_het():
    v = _variant("rs1", {"A", "G"})
    assert _status_for(v, _record("rs1", "A", "A")) == FindingStatus.CARRIED
    assert _status_for(v, _record("rs1", "A", "G")) == FindingStatus.CARRIED


def test_not_carried():
    assert _status_for(_variant("rs1", {"A", "G"}), _record("rs1", "G", "G")) == FindingStatus.NOT_CARRIED


def test_haploid_call():
    v = _variant("rs1", {"A", "G"})
    assert _status_for(v, _record("rs1", "A", None)) == FindingStatus.CARRIED
    assert _status_for(v, _record("rs1", "G", None)) == FindingStatus.NOT_CARRIED


def test_not_on_chip():
    assert _status_for(_variant("rs1", {"A", "G"}), None, in_file=False) == FindingStatus.NOT_ON_CHIP


def test_no_call_cases():
    v = _variant("rs1", {"A", "G"})
    assert _status_for(v, None, in_file=True) == FindingStatus.NO_CALL
    assert _status_for(v, _record("rs1", "D", "I", is_indel=True)) == FindingStatus.NO_CALL
    assert _status_for(v, _record("rs1", "C", "C")) == FindingStatus.NO_CALL
    palindromic = _variant("rs2", {"C", "G"}, risk="C")
    assert _status_for(palindromic, _record("rs2", "C", "C")) == FindingStatus.NO_CALL


def test_finding_carries_genotype_citations_and_traceable_summary():
    [f] = match_panel([_record("rs1", "A", "G")], (_variant("rs1", {"A", "G"}),))
    assert f.genotype == "AG"
    assert f.citations == ["PMID:111", "PMID:222"]
    assert "cognitive function measurement" in f.summary
    assert "50,000" in f.summary
    assert f.evidence_tier == EvidenceTier.MODERATE


def test_evidence_tier_rules():
    assert evidence_tier(400_000, 20.0, replicated_papers=1) == EvidenceTier.STRONG
    assert evidence_tier(400_000, 20.0, replicated_papers=0) == EvidenceTier.MODERATE
    assert evidence_tier(40_000, 20.0, replicated_papers=1) == EvidenceTier.LIMITED
    assert evidence_tier(400_000, 7.0, replicated_papers=1) == EvidenceTier.LIMITED


def test_summary_mentions_replication_only_when_present():
    v = _variant("rs1", {"A", "G"})
    assert "replication" not in summary(v)
    assert "replication sample of 12,000" in summary(v.model_copy(update={"replicated_papers": 1, "max_replication_size": 12_000}))


def test_real_panel_loads():
    panel = load_panel()
    assert 0 < len(panel) <= 32
    assert {v.domain for v in panel} == set(Domain)
    assert len({v.rsid for v in panel}) == len(panel)
    assert all(v.risk_allele in v.alleles for v in panel)
    assert not any(v.is_palindromic for v in panel)
