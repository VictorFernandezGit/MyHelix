import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

def resolve_rsid(rsid: str) -> str:
    """Map merged/retired rsIDs to their current canonical dbSNP ID."""
    return supabase.table("rsid_alias").select("canonical_rsid").eq(rsid, "alias_rsid")

