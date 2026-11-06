import json
import re
from types import SimpleNamespace as NS

from app.language.narrative import (
    build_overview_input, fallback_overview, generate_overview, problems, reading_grade,
)
from app.language.wording import lint_summary


def res(domain, status, summary="Example wording.", tier="moderate"):
    return NS(status=status, entry={"domain": domain, "summary": summary, "evidence_tier": tier})


RESULTS = [
    res("memory_retention", "carried", "People with this version tended to score higher on memory tests."),
    res("memory_retention", "not_carried"),
    res("focus_cognition", "no_call"),
    res("stress_resiliency", "not_on_chip"),
    res("processing_speed", "carried", "People with this version tended to react a little faster.", "strong"),
]

GOOD = (
    "Here is a plain summary of your results. "
    "We looked at a small set of differences in DNA that large studies have linked to memory, focus, "
    "stress and mental speed. "
    "For memory, one difference we looked for was found in your file. People with it tended to score a bit "
    "higher on memory tests. The evidence for this is moderate, which means one big study reported it. "
    "For mental speed, one difference was found. People with it tended to react a little faster. "
    "Several studies agree on this one, so the evidence is stronger. "
    "Some places could not be checked, because your test kit did not cover them or could not read them. "
    "That tells us nothing either way about those areas. "
    "Please remember that these are patterns seen in big groups of people. "
    "They do not predict what will happen for you. Many other things matter too. "
    "Our list is small and still early, so treat this as a starting point for your own curiosity."
)


def test_input_has_no_ids_and_right_counts():
    data = build_overview_input(RESULTS)
    assert data["memory"]["readable"] == 2 and len(data["memory"]["found"]) == 1
    assert data["focus and thinking"]["not_tested"] == 1
    assert data["handling stress"]["not_tested"] == 1
    assert not re.search(r"\brs\d+", json.dumps(data))   # no rsIDs are sent to the model


def test_good_text_passes():
    assert problems(GOOD, build_overview_input(RESULTS)) == []


def test_bad_texts_are_caught():
    data = build_overview_input(RESULTS)
    assert "mentions an rsID" in problems(GOOD + " See rs12345.", data)
    assert any("banned" in p for p in problems(GOOD + " This causes better memory.", data))
    assert any("missing area" in p for p in problems(GOOD.replace("speed", "pace").replace("Speed", "Pace"), data))
    assert "length" in problems("Too short.", data)
    hard = ("Polygenic heritability estimates notwithstanding, genome-wide significance thresholds "
            "necessitate considerable epistemological circumspection regarding extrapolation. ") * 6
    assert "reading level too high" in problems(hard, data)


class FakeLLM:
    """Stands in for the Gemini call: returns canned replies, counts calls."""
    def __init__(self, replies):
        self.replies, self.calls = list(replies), 0

    def __call__(self, system, user):
        self.calls += 1
        return self.replies.pop(0)


def test_generate_retries_then_succeeds():
    llm = FakeLLM(["not json", json.dumps({"overview": "Too short."}), json.dumps({"overview": GOOD})])
    assert generate_overview(RESULTS, llm=llm) == GOOD and llm.calls == 3


def test_generate_gives_up_returns_none():
    llm = FakeLLM([json.dumps({"overview": "Too short."})] * 3)
    assert generate_overview(RESULTS, llm=llm) is None and llm.calls == 3


def test_fallback_is_clean():
    assert lint_summary(fallback_overview(RESULTS)) == []


def test_reading_grade_orders_texts_sensibly():
    assert reading_grade(GOOD) <= 8
    assert reading_grade("Polygenic heritability estimates necessitate epistemological circumspection.") > 14


def test_lint_matches_whole_words_only():
    assert lint_summary("This is because of chance.") == ["because of"]
    assert lint_summary("Treat this as a starting point.") == []
    assert lint_summary("It causes memory changes and may protect you.") == ["causes", "protect"]
