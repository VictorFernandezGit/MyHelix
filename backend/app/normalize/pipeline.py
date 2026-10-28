from app.normalize.rsid_resolver import resolve_rsid, fetch_aliases
from app.normalize.strand import align_strand
from app.schemas import NormalizedSNPRecord, RawSNPRecord


def normalize(records, client):
    mapping = fetch_aliases(client, [r.rsid for r in records])
    normalized = [align_strand(r, resolve_rsid(r.rsid, mapping)) for r in records]
    return sorted(normalized, key=lambda r: r.rsid)