from app.reporting import build_report
from app.schemas import Domain, EvidenceTier, Finding, FindingStatus, Vendor


def test_build_report_groups_findings_by_domain():
    findings = [
        Finding(
            variant_id="variant-2",
            rsid="rs222",
            domain=Domain.FOCUS,
            genotype="AG",
            status=FindingStatus.CARRIED,
            evidence_tier=EvidenceTier.MODERATE,
            summary="Example focus finding.",
            citations=["https://example.com/focus"],
        ),
        Finding(
            variant_id="variant-1",
            rsid="rs111",
            domain=Domain.MEMORY,
            genotype="AA",
            status=FindingStatus.CARRIED,
            evidence_tier=EvidenceTier.STRONG,
            summary="Example memory finding.",
            citations=["https://example.com/memory"],
        ),
    ]

    report = build_report(
        vendor=Vendor.TWENTYTHREE_AND_ME,
        findings=findings,
        panel_version="0.1.0",
    )

    assert report.vendor == Vendor.TWENTYTHREE_AND_ME
    assert report.panel_version == "0.1.0"

    assert len(report.findings_by_domain[Domain.MEMORY]) == 1
    assert len(report.findings_by_domain[Domain.FOCUS]) == 1

    assert (
        report.findings_by_domain[Domain.MEMORY][0].variant_id
        == "variant-1"
    )

    assert (
        report.findings_by_domain[Domain.FOCUS][0].variant_id
        == "variant-2"
    )

def test_build_report_includes_empty_domains():
    report = build_report(
        vendor=Vendor.ANCESTRY_DNA,
        findings=[],
        panel_version="0.1.0",
    )

    assert report.findings_by_domain[Domain.MEMORY] == []
    assert report.findings_by_domain[Domain.FOCUS] == []
    assert report.findings_by_domain[Domain.STRESS] == []
    assert report.findings_by_domain[Domain.PROCESSING_SPEED] == []