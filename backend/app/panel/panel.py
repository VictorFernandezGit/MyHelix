# loads the panel csv, the csv is what decides which variants we report on so if you wanna change the panel edit that not this
import csv
from functools import cache
from pathlib import Path

from pydantic import BaseModel, ConfigDict

from app.schemas import Domain

PANEL_VERSION = "v2"
PANEL_FILE = Path(__file__).resolve().parents[2] / "data" / "panel" / f"panel_{PANEL_VERSION}.csv"

PALINDROMIC = ({"A", "T"}, {"C", "G"})


class PanelVariant(BaseModel):
    model_config = ConfigDict(frozen=True)

    rsid: str
    domain: Domain
    risk_allele: str
    alleles: frozenset[str]
    aliases: frozenset[str]
    gene: str
    chromosome: str
    position: int
    n_papers: int
    max_sample_size: int
    replicated_papers: int = 0
    max_replication_size: int = 0
    best_mlog: float
    pubmed_ids: tuple[str, ...]
    traits: str

    # A/T or C/G looks the same on both strands so we cant tell if its flipped
    @property
    def is_palindromic(self) -> bool:
        return set(self.alleles) in PALINDROMIC


def _split(value: str, sep: str) -> list[str]:
    return [v.strip() for v in value.split(sep) if v.strip()]


def _parse_row(row: dict[str, str]) -> PanelVariant:
    return PanelVariant(
        rsid=row["rsid"],
        domain=Domain(row["domain"]),
        risk_allele=row["risk_allele"],
        alleles=frozenset(_split(row["alleles"], "/")),
        aliases=frozenset(_split(row["aliases"], ";")),
        gene=row["gene"],
        chromosome=row["chr_grch37"],
        position=int(row["pos_grch37"]),
        n_papers=int(row["n_papers"]),
        max_sample_size=int(float(row["max_sample_size"])),
        replicated_papers=int(float(row.get("replicated_papers") or 0)),
        max_replication_size=int(float(row.get("max_replication_size") or 0)),
        best_mlog=float(row["best_mlog"]),
        pubmed_ids=tuple(_split(row["pubmed_ids"], ",")),
        traits=row["traits"],
    )


@cache
def load_panel(path: Path = PANEL_FILE) -> tuple[PanelVariant, ...]:
    with path.open(newline="") as f:
        return tuple(_parse_row(row) for row in csv.DictReader(f))


def panel_aliases(panel: tuple[PanelVariant, ...]) -> dict[str, str]:
    return {alias: v.rsid for v in panel for alias in v.aliases}


def panel_reference(panel: tuple[PanelVariant, ...]) -> dict[str, frozenset[str]]:
    return {v.rsid: v.alleles for v in panel}
