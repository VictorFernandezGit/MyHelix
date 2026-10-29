from app.ingest.errors import IngestError
from app.ingest.parsers.base import Parser
from app.ingest.parsers.twentythree_and_me import TwentyThreeAndMeParser

PARSERS: list[Parser] = [
    TwentyThreeAndMeParser(),
]


def detect_parser(text: str) -> Parser:
    for parser in PARSERS:
        if parser.can_parse(text):
            return parser
    raise IngestError("Unrecognized file format")
