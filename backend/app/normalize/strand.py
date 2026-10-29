from collections.abc import Set

from app.schemas import NormalizedSNPRecord, RawSNPRecord

COMPLEMENT = {"A": "T", "T": "A", "C": "G", "G": "C"}
GENOME_BUILD = "GRCh37"


def align_strand(record: RawSNPRecord, rsid: str, reference: Set[str] | None = None) -> NormalizedSNPRecord:
    alleles = list(record.genotype)
    # 23andme is already forward strand so only flip if it doesnt fit as is but the flipped version does
    if reference and not record.is_indel and not set(alleles) <= reference:
        flipped = [COMPLEMENT[a] for a in alleles]
        if set(flipped) <= reference:
            alleles = flipped

    return NormalizedSNPRecord(
        rsid=rsid,
        chromosome=record.chromosome,
        position=record.position,
        genome_build=GENOME_BUILD,
        is_indel=record.is_indel,
        allele1=alleles[0],
        allele2=alleles[1] if len(alleles) > 1 else None,
    )
