# the markers you may have heard of list like comt bdnf etc
# we show the genotype but dont score them since the big studies never backed them up
import csv
from functools import cache
from pathlib import Path

from pydantic import BaseModel, ConfigDict

from app.schemas import Domain, PopularMarkerFinding, RawSNPRecord

POPULAR_FILE = Path(__file__).resolve().parents[2] / "data" / "panel" / "popular_markers.csv"

DOMAIN_LABELS = {
    Domain.MEMORY: "memory",
    Domain.FOCUS: "focus or cognition",
    Domain.STRESS: "stress or mood",
    Domain.PROCESSING_SPEED: "processing speed",
}


class PopularMarker(BaseModel):
    model_config = ConfigDict(frozen=True)

    rsid: str
    gene: str
    domain: Domain
    common_claim: str
    review_pmid: str
    domain_hits: int
    top_traits: str
    checked_on: str


@cache
def load_popular_markers(path: Path = POPULAR_FILE) -> tuple[PopularMarker, ...]:
    with path.open(newline="") as f:
        return tuple(PopularMarker(**row) for row in csv.DictReader(f))


def evidence_note(m: PopularMarker) -> str:
    if m.domain_hits:
        return f"Has {m.domain_hits} genome-wide significant {DOMAIN_LABELS[m.domain]} association(s) in the GWAS Catalog."
    note = (
        f"No genome-wide significant association with {DOMAIN_LABELS[m.domain]} traits "
        f"in the GWAS Catalog (checked {m.checked_on})."
    )
    if m.top_traits:
        note += f" Its genome-wide hits are for: {m.top_traits}."
    return note


def match_popular(records: list[RawSNPRecord], markers: tuple[PopularMarker, ...] | None = None) -> list[PopularMarkerFinding]:
    markers = load_popular_markers() if markers is None else markers
    by_rsid = {r.rsid: r for r in records}
    return [
        PopularMarkerFinding(
            rsid=m.rsid,
            gene=m.gene,
            domain=m.domain,
            # genotype as the file reports it, no strand flip since we arent scoring these
            genotype=by_rsid[m.rsid].genotype if m.rsid in by_rsid and "-" not in by_rsid[m.rsid].genotype else None,
            common_claim=m.common_claim,
            evidence_note=evidence_note(m),
            citations=[f"PMID:{m.review_pmid}"],
        )
        for m in markers
    ]
