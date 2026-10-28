"""Create a TEST-ONLY panel from your own 23andMe file so you can test the whole flow.

    cd backend
    python -m scripts.seed_test_panel "path/to/your_23andme_file.txt"     (or the .zip)

It picks real positions and genotypes from YOUR file, so every status appears:
  - 4 entries you carry   (one per domain)
  - 1 entry you do not carry
  - 1 entry that is not in your file
Nothing here is a real finding. Delete this version before loading the real panel:
    delete from panel_versions where label = 'test-plumbing';
"""
import io
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from app.db import get_client

LABEL = "test-plumbing"
DOMAINS = ["memory_retention", "focus_cognition", "stress_resiliency", "processing_speed"]
GOOD_CHROMS = {str(i) for i in range(1, 23)} | {"X"}
PALINDROMIC = ({"A", "T"}, {"C", "G"})


def read_text(path: Path) -> str:
    data = path.read_bytes()
    if data[:2] == b"PK":
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            data = z.read(next(n for n in z.namelist() if n.lower().endswith((".txt", ".csv"))))
    return data.decode("utf-8-sig")


def pick_snps(text: str) -> tuple[list[dict], dict]:
    """Return (heterozygous non-palindromic SNPs, one homozygous SNP)."""
    het, hom = [], None
    for line in text.splitlines():
        if line.startswith("#") or line.startswith("rsid") or not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        rsid, chrom, pos, gt = parts[0], parts[1], parts[2], parts[3].strip()
        if not rsid.startswith("rs") or chrom not in GOOD_CHROMS or len(gt) != 2:
            continue
        if not set(gt) <= set("ACGT") or not pos.isdigit():
            continue
        snp = {"rsid": rsid, "chromosome": chrom, "position": int(pos), "genotype": gt}
        if gt[0] != gt[1]:
            if set(gt) not in PALINDROMIC and len(het) < 4 and (len(het) == 0 or het[-1]["chromosome"] != chrom):
                het.append(snp)
        elif hom is None:
            hom = snp
        if len(het) == 4 and hom:
            break
    if len(het) < 4 or not hom:
        raise SystemExit("Could not find enough usable SNPs in this file.")
    return het, hom


def entry(snp: dict, domain: str, effect: str, note: str) -> dict:
    a, b = sorted(set(snp["genotype"])) if snp["genotype"][0] != snp["genotype"][1] else (snp["genotype"][0], effect)
    return {
        "variant_id": f"{snp['rsid']}:{domain}", "rsid": snp["rsid"], "domain": domain,
        "genome_build": "hg19", "chromosome": snp["chromosome"], "position": snp["position"],
        "allele_string": f"{a}/{b}", "is_palindromic": False,
        "effect_allele": effect, "hit_min_copies": 1, "effect_direction": "unknown",
        "trait_label": "TEST ONLY", "evidence_tier": "limited",
        "summary": f"TEST ONLY: plumbing check ({note}). Not a real finding.",
        "reviewed_by": "test", "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }


def build_entries(het: list[dict], hom: dict) -> list[dict]:
    entries = [entry(s, d, s["genotype"][0], "carried") for s, d in zip(het, DOMAINS)]
    other = next(b for b in "ACGT" if b != hom["genotype"][0])
    entries.append(entry(hom, "memory_retention", other, "not carried"))
    ghost = {"rsid": "rs0", "chromosome": "1", "position": 1, "genotype": "AG"}
    entries.append(entry(ghost, "processing_speed", "A", "not in file"))
    return entries


def main(path: str) -> None:
    het, hom = pick_snps(read_text(Path(path)))
    entries = build_entries(het, hom)
    client = get_client()
    version = client.table("panel_versions").insert({
        "label": LABEL, "genome_build": "hg19", "notes": "TEST ONLY - delete before real panel",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }).execute().data[0]
    for e in entries:
        e["panel_version_id"] = version["id"]
    rows = client.table("panel_entries").insert(entries).execute().data
    client.table("panel_sources").insert(
        [{"panel_entry_id": r["id"], "citation": "Test source (not real)"} for r in rows]
    ).execute()
    print(f"Inserted panel '{LABEL}' with {len(rows)} test entries.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit('usage: python -m scripts.seed_test_panel "path/to/file"')
    main(sys.argv[1])
