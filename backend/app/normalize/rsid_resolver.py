import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

def fetch_aliases(client, rsids: list[str], chunk: int = 200) -> dict[str, str]:
    mapping = {}
    for i in range(0, len(rsids), chunk):
        part = rsids[i:i + chunk]
        resp = (
            client.table("rsid_alias")
            .select("alias_rsid, canonical_rsid")
            .in_("alias_rsid", part)
            .execute()
        )

        for row in resp.data:
            mapping[row["alias_rsid"]] = row["canonical_rsid"]
        return mapping
    
def resolve_rsid(rsid: str, mapping: dict[str, str]) -> str:
    """Map merged/retired rsIDs to their current canonical dbSNP ID."""
    return mapping.get(rsid, rsid)

