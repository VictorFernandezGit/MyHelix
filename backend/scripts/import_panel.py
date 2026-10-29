import json
import time
from pathlib import Path

import pandas as pd
import requests

from app.panel.panel import PANEL_FILE
from scripts.select_panel import PER_DOMAIN

ENSEMBL = "https://grch37.rest.ensembl.org"
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW = DATA_DIR / "raw"

PRIMARY_CHROMOSOMES = {str(n) for n in range(1, 23)} | {"X", "Y", "MT"}
PALINDROMIC = ({"A", "T"}, {"C", "G"})


def fetch_ensembl(rsids: list[str]) -> dict:
    RAW.mkdir(parents=True, exist_ok=True)
    results = {}
    for i in range(0, len(rsids), 50):
        chunk = rsids[i:i + 50]
        r = requests.post(
            f"{ENSEMBL}/variation/human",
            headers={"Content-Type": "application/json",
                     "Accept": "application/json"},
            json={"ids": chunk},
            timeout=60,
        )
        r.raise_for_status()
        results.update(r.json())
        time.sleep(1)
    (RAW / "ensembl_variations.json").write_text(json.dumps(results, indent=2))
    return results


def grch37_fields(variant: dict | None) -> dict:
    if variant is None:
        return {"chr_grch37": None, "pos_grch37": None, "alleles": None, "aliases": ""}
    mapping = next(
        (m for m in variant["mappings"]
         if m["assembly_name"] == "GRCh37" and m["seq_region_name"] in PRIMARY_CHROMOSOMES),
        None,
    )
    return {
        "chr_grch37": mapping["seq_region_name"] if mapping else None,
        "pos_grch37": mapping["start"] if mapping else None,
        "alleles": mapping["allele_string"] if mapping else None,
        "aliases": ";".join(sorted(s for s in variant.get("synonyms", []) if s.startswith("rs"))),
    }


def enrich_panel(panel: pd.DataFrame, ensembl: dict) -> pd.DataFrame:
    panel = panel.drop(columns=["chr_grch37", "pos_grch37", "alleles", "aliases"], errors="ignore")
    extra = pd.DataFrame([grch37_fields(ensembl.get(rsid)) for rsid in panel["rsid"]])
    extra["pos_grch37"] = extra["pos_grch37"].astype("Int64")
    return pd.concat([panel.reset_index(drop=True), extra], axis=1)


def usable(row) -> bool:
    if pd.isna(row["alleles"]):
        return False
    alleles = set(row["alleles"].split("/"))
    return alleles not in PALINDROMIC and row["risk_allele"] in alleles


def finalize(panel: pd.DataFrame) -> pd.DataFrame:
    # drop palindromic ones and anything ensembl couldnt map, then keep the top ones per domain
    keep = panel[panel.apply(usable, axis=1)]
    return keep.groupby("domain", sort=False).head(PER_DOMAIN).reset_index(drop=True)


def main():
    panel = pd.read_csv(PANEL_FILE, dtype=str)
    ensembl = fetch_ensembl(panel["rsid"].tolist())
    enriched = enrich_panel(panel, ensembl)
    panel = finalize(enriched)
    panel.to_csv(PANEL_FILE, index=False)

    dropped = sorted(set(enriched["rsid"]) - set(panel["rsid"]))
    print(f"Enriched {len(panel)} variants in {PANEL_FILE}")
    print(f"Dropped (no mapping, palindromic, risk allele mismatch, or spare): {', '.join(dropped)}")
    print(panel["domain"].value_counts().to_string())
    print(panel[["rsid", "risk_allele", "alleles", "chr_grch37", "pos_grch37", "aliases"]].to_string(index=False))


if __name__ == "__main__":
    main()
