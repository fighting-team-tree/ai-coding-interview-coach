from fastapi import APIRouter, HTTPException

from app.models import ReportResponse
from app.session_store import session_store


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{session_id}", response_model=ReportResponse)
async def read_report(session_id: str) -> ReportResponse:
    try:
        session = session_store.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc

    if session.report is None:
        raise HTTPException(status_code=404, detail="Report not ready")
    return ReportResponse(report=session.report)

