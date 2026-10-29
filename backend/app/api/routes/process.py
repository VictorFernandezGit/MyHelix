# frontend hits this after the upload finishes
# checks the user actually owns the upload then runs the pipeline in the background
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from app.core.db import get_client
from app.pipeline import run_pipeline

router = APIRouter()


@router.post("/process/{upload_id}", status_code=202)
def process(upload_id: str, background: BackgroundTasks, authorization: str = Header(...)) -> dict[str, str]:
    client = get_client()
    token = authorization.removeprefix("Bearer ").strip()
    try:
        user = client.auth.get_user(token).user
    except Exception as e:
        raise HTTPException(401, "Invalid or expired session") from e

    # service role skips rls so we have to check ownership ourselves
    rows = (
        client.table("uploads").select("id, status")
        .eq("id", upload_id).eq("user_id", user.id)
        .execute().data
    )
    if not rows:
        raise HTTPException(404, "Upload not found")
    # file is deleted after the first run so a second run would just fail
    if rows[0]["status"] != "pending":
        raise HTTPException(409, f"Upload is already {rows[0]['status']}")

    background.add_task(run_pipeline, upload_id)
    return {"status": "processing"}
