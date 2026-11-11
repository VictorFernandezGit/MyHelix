from app.schemas import EvidenceTier

EVIDENCE_LINE = {
    EvidenceTier.STRONG: (
        "This association has been observed across multiple independent studies."
    ),
    EvidenceTier.MODERATE: (
        "This association has been reported in research, but additional "
        "independent replication is needed."
    ),
    EvidenceTier.LIMITED: (
        "Evidence for this association is preliminary and should be "
        "interpreted cautiously."
    ),
}

def render_overview(v, tier: EvidenceTier) -> str:
    first = (
        f"The {v.risk_allele} allele of {v.rsid} has been studied "
        f"in relation to {v.traits}."
    )
    evidence = EVIDENCE_LINE[tier]

    return " ".join([
        first, evidence
    ])