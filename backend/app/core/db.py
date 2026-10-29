# supabase client for the backend, uses the service role key from backend/.env
# never put this key in the frontend it skips all the row level security
from functools import cache

from supabase import Client, create_client

from app.core.config import settings


@cache
def get_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env")
    return create_client(
        settings.supabase_url, 
        settings.supabase_service_role_key
    )
