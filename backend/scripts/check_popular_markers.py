# checks the popular markers against the gwas catalog and writes the results back into popular_markers.csv
# rerun this whenever we download a newer catalog
from datetime import date

import pandas as pd

from scripts.get_gwas_hits import ASSOCIATIONS, MIN_MLOG, assign_domain, sample_size

MARKERS = ASSOCIATIONS.parents[1] / "panel" / "popular_markers.csv"
CHECK_COLS = ["catalog_rows", "genome_wide_rows", "domain_hits", "top_traits", "checked_on"]
COLS = ["SNPS", "MAPPED_TRAIT", "PVALUE_MLOG", "INITIAL SAMPLE SIZE"]


def catalog_rows(rsids: set[str]) -> pd.DataFrame:
    rows = [
        chunk[chunk["SNPS"].isin(rsids)]
        for chunk in pd.read_csv(ASSOCIATIONS, sep="\t", usecols=COLS, dtype=str, chunksize=200_000)
    ]
    df = pd.concat(rows, ignore_index=True)
    df["mlog"] = pd.to_numeric(df["PVALUE_MLOG"], errors="coerce")
    df["domain"] = df["MAPPED_TRAIT"].fillna("").map(assign_domain)
    df["sample_size"] = df["INITIAL SAMPLE SIZE"].map(sample_size)
    return df


def check(marker: pd.Series, rows: pd.DataFrame) -> dict:
    mine = rows[rows["SNPS"] == marker["rsid"]]
    sig = mine[mine["mlog"] >= MIN_MLOG]
    traits = sig.sort_values("mlog", ascending=False)["MAPPED_TRAIT"].dropna().drop_duplicates().head(3)
    return {
        "catalog_rows": len(mine),
        "genome_wide_rows": len(sig),
        "domain_hits": int((sig["domain"] == marker["domain"]).sum()),
        "top_traits": "; ".join(traits),
        "checked_on": date.today().isoformat(),
    }


def main() -> None:
    markers = pd.read_csv(MARKERS, dtype=str).drop(columns=CHECK_COLS, errors="ignore")
    rows = catalog_rows(set(markers["rsid"]))
    checked = pd.concat([markers, pd.DataFrame([check(m, rows) for _, m in markers.iterrows()])], axis=1)
    checked.to_csv(MARKERS, index=False)
    print(checked[["gene", "rsid", "domain", "catalog_rows", "genome_wide_rows", "domain_hits", "top_traits"]].to_string(index=False))


if __name__ == "__main__":
    main()
