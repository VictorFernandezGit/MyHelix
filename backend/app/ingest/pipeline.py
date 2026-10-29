import io
import zipfile

from app.ingest.errors import IngestError
from app.ingest.parsers.registry import detect_parser
from app.ingest.validation import validate_records
from app.schemas import RawSNPRecord


def _unzip(data: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = [n for n in z.namelist() if n.lower().endswith(".txt")]
        if len(names) != 1:
            raise IngestError("Zip must contain exactly one .txt genotype file")
        return z.read(names[0])


def ingest(data: bytes) -> list[RawSNPRecord]:
    if data[:2] == b"PK":
        data = _unzip(data)
    text = data.decode("utf-8")
    parser = detect_parser(text)
    records = parser.parse(text)
    validate_records(records)
    return records
