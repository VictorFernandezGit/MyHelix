from collections.abc import Mapping, Set

from app.normalize.rsid_resolver import resolve_rsid
from app.normalize.strand import align_strand
from app.schemas import NormalizedSNPRecord, RawSNPRecord

NO_CALL = "-"


def normalize(
    records: list[RawSNPRecord],
    aliases: Mapping[str, str] | None = None,
    reference: Mapping[str, Set[str]] | None = None,
) -> list[NormalizedSNPRecord]:
    aliases = aliases or {}
    reference = reference or {}
    present = {r.rsid for r in records}

    normalized = []
    for r in records:
        # no calls have no genotype so just skip them
        if NO_CALL in r.genotype:
            continue
        rsid = resolve_rsid(r.rsid, aliases)
        # file has both the old id and the current one, keep the current one so we dont get it twice
        if rsid != r.rsid and rsid in present:
            continue
        normalized.append(align_strand(r, rsid, reference.get(rsid)))
    return sorted(normalized, key=lambda r: r.rsid)
