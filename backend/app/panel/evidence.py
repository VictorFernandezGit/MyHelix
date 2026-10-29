# evidence tier rules, started from jonathans branch
# strong now needs a replication sample not just more papers since most papers reuse uk biobank
from app.schemas import EvidenceTier

GENOME_WIDE_MLOG = 7.301
MIN_SAMPLE_SIZE = 50_000

# GENOME_WIDE_MLOG is p < 5e-8 written as -log10


def evidence_tier(max_sample_size: int, best_mlog: float, replicated_papers: int) -> EvidenceTier:
    if best_mlog < GENOME_WIDE_MLOG or max_sample_size < MIN_SAMPLE_SIZE:
        return EvidenceTier.LIMITED
    if replicated_papers > 0:
        return EvidenceTier.STRONG
    return EvidenceTier.MODERATE
