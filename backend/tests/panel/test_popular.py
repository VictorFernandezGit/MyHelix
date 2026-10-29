# popular marker tests, genotype lookup and the evidence note text
from app.panel.popular import PopularMarker, evidence_note, load_popular_markers, match_popular
from app.schemas import Domain, RawSNPRecord, Vendor


def _marker(**kw) -> PopularMarker:
    base = dict(
        rsid="rs4680", gene="COMT", domain=Domain.FOCUS, common_claim="claim", review_pmid="23012269",
        domain_hits=0, top_traits="", checked_on="2026-10-29",
    )
    return PopularMarker(**(base | kw))


def _raw(rsid: str, genotype: str) -> RawSNPRecord:
    return RawSNPRecord(rsid=rsid, chromosome="22", position=1, genotype=genotype, is_indel=False, vendor=Vendor.TWENTYTHREE_AND_ME)


def test_genotype_reported_when_called():
    [f] = match_popular([_raw("rs4680", "AG")], (_marker(),))
    assert f.genotype == "AG"
    assert f.citations == ["PMID:23012269"]


def test_missing_or_no_call_has_no_genotype():
    assert match_popular([], (_marker(),))[0].genotype is None
    assert match_popular([_raw("rs4680", "--")], (_marker(),))[0].genotype is None


def test_evidence_note_is_built_from_catalog_check():
    note = evidence_note(_marker(top_traits="body mass index"))
    assert "No genome-wide significant association with focus or cognition traits" in note
    assert "2026-10-29" in note and "body mass index" in note
    assert "Has 2 genome-wide significant" in evidence_note(_marker(domain_hits=2))


def test_real_popular_markers_load():
    markers = load_popular_markers()
    assert len(markers) == 11
    assert all(m.review_pmid and m.checked_on for m in markers)
