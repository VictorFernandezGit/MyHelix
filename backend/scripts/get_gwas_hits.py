import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GWAS = DATA_DIR / "gwas"
ASSOCIATIONS = GWAS / "gwas_associations_ontology_2026-10-18.zip"

def gwas_hits(rsid_set):
    hits = []
    for chunk in pd.read_csv(ASSOCIATIONS, sep = "\t", chunksize=100_000, low_memory=False):
        hits.append(chunk[chunk["SNPS"].isin(rsid_set)]["JOURNAL"])
    return hits

def main():
    s = {"rs62074125"}
    print(gwas_hits(s))

if __name__ == "__main__":
    main()