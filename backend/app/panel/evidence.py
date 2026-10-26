from app.schemas import EvidenceTier

GENOME_WIDE_MLOG = 7.301

def evidence_tier(n_papers: int, max_sample_size: int, best_mlog: float) -> str:
    if best_mlog < GENOME_WIDE_MLOG or max_sample_size < 10_000:
        return EvidenceTier.LIMITED

    if n_papers >= 3:
        return EvidenceTier.STRONG
    
    return EvidenceTier.MODERATE 