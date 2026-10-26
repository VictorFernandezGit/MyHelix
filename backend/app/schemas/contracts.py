"""Data contracts passed between pipeline stages. Changes here affect every owner — coordinate in PR review."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class Vendor(StrEnum):
    TWENTYTHREE_AND_ME = "23andme"
    ANCESTRY_DNA = "ancestrydna"


class Domain(StrEnum):
    MEMORY = "memory_retention"
    FOCUS = "focus_cognition"
    STRESS = "stress_resiliency"
    PROCESSING_SPEED = "processing_speed"


class EvidenceTier(StrEnum):
    STRONG = "strong"
    MODERATE = "moderate"
    LIMITED = "limited"


class _Frozen(BaseModel):
    model_config = ConfigDict(frozen=True)


class RawSNPRecord(_Frozen):
    """Ingest output: one row as the vendor reported it."""

    rsid: str
    chromosome: str
    position: int
    genotype: str
    is_indel: bool
    vendor: Vendor


class NormalizedSNPRecord(_Frozen):
    """Normalize output: strand-aligned, canonical rsID, ready for panel lookup."""

    rsid: str
    chromosome: str
    position: int
    genome_build: str
    is_indel: bool
    allele1: str
    allele2: str | None = None

class FindingStatus(StrEnum):
    CARRIED = "carried"
    NOT_CARRIED = "not_carried"
    NOT_ASSESSABLE = "not_assessable"


class Finding(_Frozen):
    """Panel lookup output: one panel variant matched against the user's genotype."""

    variant_id: str
    rsid: str
    domain: Domain
    status: FindingStatus
    genotype: str | None = None
    evidence_tier: EvidenceTier | None = None
    summary: str
    citations: list[str]


class Report(_Frozen):
    vendor: Vendor
    findings_by_domain: dict[Domain, list[Finding]]
    panel_version: str
