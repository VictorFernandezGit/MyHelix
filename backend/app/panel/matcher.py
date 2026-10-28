from app.panel.evaluate import evaluate_panel, to_findings
from app.panel.repository import Panel
from app.schemas import Finding, NormalizedSNPRecord


def match_panel(records: list[NormalizedSNPRecord], panel: Panel) -> list[Finding]:
    """Findings for the variants this person carries. Use evaluate_panel for full statuses."""
    results, _ = evaluate_panel(records, panel)
    return to_findings(results)