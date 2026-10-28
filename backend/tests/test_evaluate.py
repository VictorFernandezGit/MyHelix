import pytest

from app.panel.evaluate import evaluate_panel
from app.panel.repository import Panel
from app.schemas import NormalizedSNPRecord


def rec(rsid, chrom, pos, a1, a2, build="hg19"):
    return NormalizedSNPRecord(rsid=rsid, chromosome=chrom, position=pos,
                               genome_build=build, allele1=a1, allele2=a2)


def entry(rsid, chrom, pos, effect="G", copies=1):
    return {"variant_id": f"{rsid}:focus_cognition", "rsid": rsid, "domain": "focus_cognition",
            "chromosome": chrom, "position": pos, "effect_allele": effect,
            "hit_min_copies": copies, "evidence_tier": "moderate",
            "summary": "s", "citations": []}


PANEL = Panel("v1", "v0.1", "hg19", [
    entry("rs1", "1", 100),               # carried
    entry("rs2", "2", 200),               # not carried
    entry("rs3", "3", 300),               # no call
    entry("rs4", "4", 400),               # not on chip
    entry("rs5", "5", 500, copies=2),     # needs 2 copies, has 1
])
FILE = [rec("rs1", "1", 100, "A", "G"), rec("rs2", "2", 200, "A", "A"),
        rec("rs3", "3", 300, "-", "-"), rec("rs5", "5", 500, "A", "G")]


def test_statuses():
    results, stats = evaluate_panel(FILE, PANEL)
    assert [r.status for r in results] == ["carried", "not_carried", "no_call", "not_on_chip", "not_carried"]
    assert results[0].genotype == "AG"
    assert stats.panel_total == 5 and stats.panel_found == 3
    assert stats.snps_in_file == 4 and stats.call_rate == 75.0


def test_build_mismatch_raises():
    with pytest.raises(ValueError):
        evaluate_panel([rec("rs1", "1", 100, "A", "G", build="hg38")], PANEL)
