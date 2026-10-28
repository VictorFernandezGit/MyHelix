from app.schemas import Finding, NormalizedSNPRecord
from app.panel.evaluate import evaluate_panel, to_findings



def match_panel(records: list[NormalizedSNPRecord]) -> list[Finding]:
    """Match normalized genotypes against the curated panel and attach evidence tiers."""
    results, _ = evaluate_panel(records, panel)
    return to_findings(results)
