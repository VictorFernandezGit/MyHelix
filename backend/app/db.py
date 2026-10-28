"""One shared Supabase client for the backend, using the SERVICE ROLE key.

The service role bypasses row-level security, so this key must only ever live in the
backend's .env (never in Next.js, never in git).
"""
import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


@lru_cache(maxsize=1)
def get_client() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])