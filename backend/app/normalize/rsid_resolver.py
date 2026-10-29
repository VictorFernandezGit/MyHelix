from collections.abc import Mapping


def resolve_rsid(rsid: str, aliases: Mapping[str, str]) -> str:
    return aliases.get(rsid, rsid)
