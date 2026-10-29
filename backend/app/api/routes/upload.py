from fastapi import APIRouter, HTTPException, UploadFile

from app.core.config import settings
from app.ingest import IngestError
from app.pipeline import analyze
from app.schemas import Report

router = APIRouter()


@router.post("/upload", response_model=Report)
async def upload(file: UploadFile) -> Report:
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        report, _ = analyze(data)
    except (IngestError, UnicodeDecodeError) as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    return report
