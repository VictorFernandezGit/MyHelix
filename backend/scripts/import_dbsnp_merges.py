from pathlib import Path
from urllib.request import urlretrieve
import bz2
import json

from app.db import insert_rsid_aliases

URL = ("https://ftp.ncbi.nih.gov/"
        "snp/latest_release/JSON/refsnp-merged.json.bz2")

PATH = Path("data/dbsnp/refsnp-merged.json.bz2")

def download():
    PATH.parent.mkdir(parents=True, exist_ok=True)

    if PATH.exists():
        print(f"{PATH} already exists")
        return

    print(f"Downloading {URL}")
    urlretrieve(URL, PATH)
    print(f"Downloaded to {PATH}")

def extract_merges(record):
    refsnp_id = f"rs{record['refsnp_id']}"

    merges = []

    # Old dbSNP IDs that merged into this RefSNP
    for merge in record.get("dbsnp1_merges", []):
        merged_rsid = f"rs{merge['merged_rsid']}"
        merges.append((merged_rsid, refsnp_id))

    # This RefSNP later merged into another RefSNP
    merged_into = record.get(
        "merged_snapshot_data", {}
    ).get("merged_into", [])

    for destination in merged_into:
        merges.append(
            (refsnp_id, f"rs{destination}")
        )

    return merges

def parse_merges():
    merges = {}

    with bz2.open(PATH, "rt") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()

            if not line:
                continue

            record = json.loads(line)

            for old_rsid, new_rsid in extract_merges(record):
                merges[old_rsid] = new_rsid

            if line_no % 100_000 == 0:
                print(f"Processed {line_no:,} records...")

    return merges

def resolve_chain(
    rsid: str,
    merges: dict[str, str],
    cache: dict[str, str],
) -> str:

    if rsid in cache:
        return cache[rsid]

    path = []
    seen = set()
    current = rsid

    while current in merges:
        if current in cache:
            current = cache[current]
            break

        if current in seen:
            raise RuntimeError(
                f"Cycle detected in merge chain starting at {rsid}"
            )

        seen.add(current)
        path.append(current)

        current = merges[current]

    for node in path:
        cache[node] = current

    return current

def build_aliases(merges):
    cache = {}
    aliases = []

    for rsid in merges:
        canonical = resolve_chain(
            rsid,
            merges,
            cache,
        )

        aliases.append((rsid, canonical))

    return aliases

def main():
    download()

    print("Parsing merge data...")
    merges = parse_merges()

    print(f"Found {len(merges):,} merge relationships")

    print ("Resolving merge chains...")
    aliases = build_aliases(merges)

    print(f"Inserting {len(aliases):,} aliases...")

    insert_rsid_aliases(aliases)

    print("Done.")

if __name__ == "__main__":
    main()