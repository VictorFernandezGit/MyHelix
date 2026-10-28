"""POST /process/{upload_id}: the browser calls this after a file finishes uploading."""
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from app.db import get_client
from app.pipeline import run_pipeline

router = APIRouter()


@router.post("/process/{upload_id}", status_code=202)
def process(upload_id: str, background: BackgroundTasks, authorization: str = Header(...)):
    client = get_client()
    token = authorization.removeprefix("Bearer ").strip()
    try:
        user = client.auth.get_user(token).user          # checks the token with Supabase
    except Exception:
        raise HTTPException(401, "Invalid or expired session")

    # The caller must own this upload (we use the service role, so RLS won't check for us).
    rows = client.table("uploads").select("id").eq("id", upload_id).eq("user_id", user.id).execute().data
    if not rows:
        raise HTTPException(404, "Upload not found")

    background.add_task(run_pipeline, upload_id)          # runs after the response is sent
    return {"status": "processing"}
