# picks the top variants per domain from the gwas candidates
# only keeps ones that are actually on the 23andme chip, pass a raw file with --chip
import argparse
from pathlib import Path

import pandas as pd

from app.panel.panel import PANEL_FILE

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CANDIDATES = DATA_DIR / "processed" / "gwas_candidates.csv"
OUTPUT = PANEL_FILE

PER_DOMAIN = 8
SPARES = 4
LOCUS_WINDOW = 1_000_000

COLS = [
    "rsid",
    "domain",
    "risk_allele",
    "gene",
    "chr",
    "pos_grch38",
    "n_papers",
    "max_sample_size",
    "replicated_papers",
    "max_replication_size",
    "best_mlog",
    "effect_sizes",
    "pubmed_ids",
    "study_accessions",
    "traits",
]


def same_locus(a, b) -> bool:
    return str(a["chr"]) == str(b["chr"]) and abs(a["pos"] - b["pos"]) < LOCUS_WINDOW


def chip_rsids(paths: list[Path]) -> set[str]:
    rsids = set()
    for path in paths:
        with path.open() as f:
            rsids |= {line.split("\t", 1)[0] for line in f if line.startswith("rs")}
    return rsids


def select_panel(candidates: pd.DataFrame, chip: set[str] | None = None, per_domain: int = PER_DOMAIN + SPARES) -> pd.DataFrame:
    df = candidates[~candidates["allele_conflict"] & candidates["pos_grch38"].notna()].copy()
    # only rsids that are actually on the chip, otherwise most of the panel comes back not tested
    if chip is not None:
        df = df[df["rsid"].isin(chip)]
    df["pos"] = pd.to_numeric(df["pos_grch38"].astype(str).str.split(";").str[0], errors="coerce")
    df["replicated"] = df["replicated_papers"] > 0
    df = df.sort_values(["replicated", "n_papers", "best_mlog", "rsid"], ascending=[False, False, False, True])

    picked = []
    for _, group in df.groupby("domain", sort=True):
        chosen = 0
        for _, row in group.iterrows():
            # skip anything within 1mb of one we already picked, its usually the same signal
            if any(same_locus(row, p) for p in picked):
                continue
            picked.append(row)
            chosen += 1
            if chosen == per_domain:
                break

    panel = pd.DataFrame(picked).rename(columns={"risk_alleles": "risk_allele"})
    return panel[COLS].reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--chip", type=Path, nargs="+", required=True, help="23andMe raw files whose rsIDs define chip coverage")
    args = parser.parse_args()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    panel = select_panel(pd.read_csv(CANDIDATES), chip_rsids(args.chip))
    panel.to_csv(OUTPUT, index=False)

    print(f"{len(panel)} variants written to {OUTPUT}")
    print(panel["domain"].value_counts().to_string())


if __name__ == "__main__":
    main()
