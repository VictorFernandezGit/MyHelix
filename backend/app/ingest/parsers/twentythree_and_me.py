from app.ingest.errors import IngestError
from app.schemas import RawSNPRecord, Vendor

HEADER_SNIFF_LINES = 50


class TwentyThreeAndMeParser:
    vendor = Vendor.TWENTYTHREE_AND_ME

    def can_parse(self, text: str) -> bool:
        for line in text.splitlines()[:HEADER_SNIFF_LINES]:
            if not line.startswith("#"):
                return False
            if "23andme" in line.lower():
                return True
        return False

    def parse(self, text: str) -> list[RawSNPRecord]:
        records = []
        for line_no, line in enumerate(text.splitlines(), start=1):
            is_indel = False
            if not line.strip() or line.startswith("#"):
                continue
            fields = line.split("\t")
            if len(fields) != 4:
                raise IngestError(f"Line {line_no}: expected 4 tab-separated columns, got {len(fields)}")
            rsid, chromosome, position, genotype = (f.strip() for f in fields)
            if genotype[0] in ["D", "I", "-"] or genotype[1] in ["D", "I", "-"]:
                is_indel = True
            if not position.isdigit():
                raise IngestError(f"Line {line_no}: position '{position}' is not a number")
            records.append(
                RawSNPRecord(
                    rsid=rsid,
                    chromosome=chromosome,
                    position=int(position),
                    genotype=genotype,
                    is_indel=is_indel,
                    vendor=self.vendor,
                )
            )
        return records
