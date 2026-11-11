
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CSV_PATH = ROOT / "backend" / "data" / "panel" / "panel_v2.csv"
OUTPUT_PATH = (
    ROOT / "myhelix-nextjs" / "public" / "data" / "panel_v2.json"
)


def split_values(value: str, delimiter: str = ",") -> list[str]:
    if not value:
        return []

    return [
        item.strip()
        for item in value.split(delimiter)
        if item.strip()
    ]


def optional_int(value: str):
    return int(value) if value and value.strip() else None


def optional_float(value: str):
    return float(value) if value and value.strip() else None


def convert_row(row: dict) -> dict:
    return {
        "rsid": row["rsid"].strip(),
        "domain": row["domain"].strip(),
        "risk_allele": row["risk_allele"].strip(),
        "gene": row["gene"].strip(),
        "chromosome": row["chr"].strip(),
        "position_grch38": optional_int(row["pos_grch38"]),
        "position_grch37": optional_int(row["pos_grch37"]),
        "n_papers": optional_int(row["n_papers"]) or 0,
        "max_sample_size": optional_int(row["max_sample_size"]) or 0,
        "replicated_papers": optional_int(row["replicated_papers"]) or 0,
        "max_replication_size": optional_int(
            row["max_replication_size"]
        ) or 0,
        "best_mlog": optional_float(row["best_mlog"]),
        "effect_sizes": split_values(row["effect_sizes"]),
        "pubmed_ids": split_values(row["pubmed_ids"]),
        "study_accessions": split_values(row["study_accessions"]),
        "traits": split_values(row["traits"], ";"),
        "alleles": split_values(row["alleles"], "/"),
        "aliases": split_values(row["aliases"], ";"),
    }


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        variants = [convert_row(row) for row in reader]

    OUTPUT_PATH.write_text(
        json.dumps(variants, indent=2),
        encoding="utf-8",
    )

    print(f"Exported {len(variants)} variants")
    print(f"Output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
