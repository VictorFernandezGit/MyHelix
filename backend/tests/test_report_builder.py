from app.reporting import build_report
from app.schemas import Domain, EvidenceTier, Finding, FindingStatus, Vendor


def _finding(variant_id: str, domain: Domain) -> Finding:
    return Finding(
        variant_id=variant_id,
        rsid="rs0",
        domain=domain,
        genotype="AA",
        status=FindingStatus.CARRIED,
        evidence_tier=EvidenceTier.LIMITED,
        summary="",
        citations=[],
    )


def test_groups_all_domains_and_is_deterministic():
    findings = [_finding("v2", Domain.FOCUS), _finding("v1", Domain.FOCUS)]
    a = build_report(Vendor.ANCESTRY_DNA, findings, "0.0.0")
    b = build_report(Vendor.ANCESTRY_DNA, list(reversed(findings)), "0.0.0")

    assert set(a.findings_by_domain) == set(Domain)
    assert [f.variant_id for f in a.findings_by_domain[Domain.FOCUS]] == ["v1", "v2"]
    assert a == b
