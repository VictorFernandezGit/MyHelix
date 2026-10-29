from app.schemas import Domain, Finding, PopularMarkerFinding, Report, Vendor


def build_report(
        vendor: Vendor, 
        findings: list[Finding], 
        panel_version: str,
        popular_markers: list[PopularMarkerFinding] | None = None,
    ) -> Report:

    """given all genetic findings, organize them into Memory, Focus, Stress, and Processing Speed, sort them consistently, and return a report object"""
    grouped: dict[Domain, list[Finding]] = {d_item: [] for d_item in Domain}

    for f in sorted(findings, key=lambda f: f.variant_id):
        grouped[f.domain].append(f)

    popular = sorted(popular_markers or [], key=lambda m: (m.domain, m.gene))
    return Report(vendor=vendor, findings_by_domain=grouped, panel_version=panel_version, popular_markers=popular)
