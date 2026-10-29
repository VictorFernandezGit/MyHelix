# normalize tests, no calls aliases strand flips indels and haploid calls
from app.normalize import normalize
from app.normalize.rsid_resolver import resolve_rsid
from app.normalize.strand import align_strand
from app.schemas import RawSNPRecord, Vendor


def _raw(rsid: str, genotype: str, is_indel: bool = False, chromosome: str = "1") -> RawSNPRecord:
    return RawSNPRecord(
        rsid=rsid, chromosome=chromosome, position=1000, genotype=genotype,
        is_indel=is_indel, vendor=Vendor.TWENTYTHREE_AND_ME,
    )


def test_resolve_rsid_maps_alias_and_passes_through_unknown():
    aliases = {"rs111": "rs999"}
    assert resolve_rsid("rs111", aliases) == "rs999"
    assert resolve_rsid("rs222", aliases) == "rs222"


def test_align_keeps_forward_strand():
    n = align_strand(_raw("rs1", "AC"), "rs1", frozenset({"A", "C"}))
    assert (n.allele1, n.allele2, n.genome_build) == ("A", "C", "GRCh37")


def test_align_flips_reverse_strand():
    n = align_strand(_raw("rs1", "GA"), "rs1", frozenset({"C", "T"}))
    assert (n.allele1, n.allele2) == ("C", "T")


def test_align_leaves_unmatched_and_unreferenced_genotypes():
    assert align_strand(_raw("rs1", "AG"), "rs1", frozenset({"A", "C"})).allele1 == "A"
    assert align_strand(_raw("rs1", "GA"), "rs1", None).allele1 == "G"


def test_align_never_flips_indels():
    n = align_strand(_raw("rs1", "DI", is_indel=True), "rs1", frozenset({"A", "T"}))
    assert (n.allele1, n.allele2, n.is_indel) == ("D", "I", True)


def test_align_haploid():
    n = align_strand(_raw("rs1", "G", chromosome="X"), "rs1", frozenset({"G", "A"}))
    assert (n.allele1, n.allele2) == ("G", None)


def test_normalize_drops_no_calls_resolves_aliases_and_sorts():
    out = normalize(
        [_raw("rs3", "AA"), _raw("rs2", "--", is_indel=True), _raw("rs_old", "GA")],
        aliases={"rs_old": "rs1"},
        reference={"rs1": frozenset({"C", "T"})},
    )
    assert [r.rsid for r in out] == ["rs1", "rs3"]
    assert (out[0].allele1, out[0].allele2) == ("C", "T")


def test_normalize_prefers_canonical_row_over_alias():
    out = normalize([_raw("rs_old", "GG"), _raw("rs1", "AA")], aliases={"rs_old": "rs1"})
    assert len(out) == 1
    assert out[0].allele1 == "A"
