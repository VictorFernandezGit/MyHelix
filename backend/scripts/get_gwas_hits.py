import re
import sys
import pandas as pd
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.panel.evidence import evidence_tier

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GWAS = DATA_DIR / "gwas"
ASSOCIATIONS = GWAS / "gwas_associations_ontology_2026-10-18.zip"
PROCESSED = DATA_DIR / "processed"
OUTPUT = PROCESSED / "gwas_candidates.csv"

COLS = [
    "SNPS",
    "MAPPED_TRAIT",
    "STRONGEST SNP-RISK ALLELE",
    "PVALUE_MLOG",
    "OR or BETA",
    "PUBMEDID",
    "STUDY ACCESSION",
    "CHR_ID",
    "CHR_POS",
    "MAPPED_GENE",
    "INITIAL SAMPLE SIZE",
]

MIN_MLOG = 7.3

MIN_SAMPLE_SIZE = 10_000

DOMAIN_TRAITS = {
    "memory_retention": ["memory performance", "short-term memory", "episodic memory", "working memory", "verbal memory", "visual memory"],
    "focus_cognition": ["cognitive function", "intelligence", "executive function", "attention function"],
    "stress_resiliency": ["neuroticism", "stress", "anxiety measurement", "resilience"],
    "processing_speed": ["reaction time", "processing speed", "information processing"],
}

EXCLUDE = [
    "disorder",
    "disease",
    "deficit hyperactivity",
    "dementia",
    "alzheimer",
    "schizophrenia",
    "cell",
    "decline",
    "impairment",
]

EXCLUDE_GENES = {"APOE", "APOC1", "TOMM40", "NECTIN2"}

ALLOWED_COTRAITS = ["educational attainment"]


def _domain_for(part: str) -> str | None:
    for domain, terms in DOMAIN_TRAITS.items():
        if any(term in part for term in terms):
            return domain
    return None


def assign_domain(trait: str) -> str | None:
    trait = trait.lower()
    if any(term in trait for term in EXCLUDE):
        return None
    parts = [p.strip() for p in trait.split(",")]
    domains = [_domain_for(p) for p in parts]
    if any(d is None and not any(c in p for c in ALLOWED_COTRAITS) for p, d in zip(parts, domains)):
        return None
    return next((d for d in domains if d), None)


def in_scope_gene(genes: str) -> bool:
    return not EXCLUDE_GENES & {g.strip() for g in str(genes).replace(" - ", ",").split(",")}


def sample_size(text: str) -> int:
    return sum(int(n.replace(",", "")) for n in re.findall(r"\d[\d,]*", str(text)))


def filter_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
    chunk = chunk.copy()
    chunk["PVALUE_MLOG"] = pd.to_numeric(chunk["PVALUE_MLOG"], errors="coerce")
    chunk = chunk[chunk["PVALUE_MLOG"] >= MIN_MLOG]
    chunk["sample_size"] = chunk["INITIAL SAMPLE SIZE"].map(sample_size)
    chunk = chunk[chunk["sample_size"] >= MIN_SAMPLE_SIZE]
    chunk = chunk[chunk["SNPS"].str.fullmatch(r"rs\d+", na=False)]

    chunk["domain"] = chunk["MAPPED_TRAIT"].fillna("").map(assign_domain)
    chunk = chunk[chunk["domain"].notna() & chunk["MAPPED_GENE"].map(in_scope_gene)]

    chunk["risk_allele"] = chunk["STRONGEST SNP-RISK ALLELE"].str.extract(r"-([ACGT])$", expand=False)
    return chunk[chunk["risk_allele"].notna()]


def gwas_hits() -> pd.DataFrame:
    hits = [
        filter_chunk(chunk)
        for chunk in pd.read_csv(ASSOCIATIONS, sep="\t", usecols=COLS, dtype=str, chunksize=200_000)
    ]
    df = pd.concat(hits, ignore_index=True)

    def joined(sep):
        return lambda s: sep.join(sorted(set(s.dropna())))

    candidates = (
        df.groupby(["SNPS", "domain"])
        .agg(
            n_papers=("PUBMEDID", "nunique"),
            n_studies=("STUDY ACCESSION", "nunique"),
            max_sample_size=("sample_size", "max"),
            best_mlog=("PVALUE_MLOG", "max"),
            risk_alleles=("risk_allele", joined(",")),
            effect_sizes=("OR or BETA", joined(",")),
            pubmed_ids=("PUBMEDID", joined(",")),
            study_accessions=("STUDY ACCESSION", joined(",")),
            traits=("MAPPED_TRAIT", joined("; ")),
            chr=("CHR_ID", "first"),
            pos_grch38=("CHR_POS", "first"),
            gene=("MAPPED_GENE", "first"),
        )
        .reset_index()
        .rename(columns={"SNPS": "rsid"})
        .sort_values(["domain", "n_papers", "best_mlog"], ascending=[True, False, False])
    )
    candidates["suggested_tier"] = candidates.apply(
        lambda r: evidence_tier(r["n_papers"], r["max_sample_size"], r["best_mlog"]), axis=1
    )
    candidates["allele_conflict"] = candidates["risk_alleles"].str.contains(",")
    return candidates


def main():
    PROCESSED.mkdir(parents=True, exist_ok=True)
    candidates = gwas_hits()
    candidates.to_csv(OUTPUT, index=False)

    print(f"{len(candidates)} candidates written to {OUTPUT}")
    for domain, group in candidates.groupby("domain"):
        print(f"\n=== {domain} ({len(group)})")
        print(group.head(10)[["rsid", "n_papers", "max_sample_size", "best_mlog", "risk_alleles", "gene", "traits"]].to_string(index=False))


if __name__ == "__main__":
    main()
