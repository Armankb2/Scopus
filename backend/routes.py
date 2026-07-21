import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from sse_starlette.sse import EventSourceResponse

from backend.models import FetchRequest, FetchResponse
from backend.services.extractor import (
    get_faculty_list, find_faculty_by_name, extract_faculty,
    PROGRESS_STORE, update_progress
)
from backend.services.cache import (
    get_cached_portfolio, get_recent_reports,
    CSV_DIR, JSON_DIR, EXCEL_DIR, PDF_DIR
)
from backend.services.utils import sanitize_filename, compute_portfolio_metrics, compute_top_coauthors

# Custom check cached files logic
def files_exist_for_author(author_name: str) -> bool:
    safe_name = sanitize_filename(author_name)
    return (
        (CSV_DIR / f"{safe_name}.csv").exists() and
        (JSON_DIR / f"{safe_name}.json").exists() and
        (EXCEL_DIR / f"{safe_name}.xlsx").exists() and
        (PDF_DIR / f"{safe_name}.pdf").exists()
    )

router = APIRouter()

@router.get("/faculty")
async def get_faculty():
    return get_faculty_list()

@router.get("/recent")
async def get_recent():
    return get_recent_reports()

def _run_extraction_task(scopus_id: str, scholar_id: str, name: str, job_id: str):
    try:
        extract_faculty(scopus_id, scholar_id, author_name=name, job_id=job_id)
    except Exception as e:
        update_progress(job_id, "Error", 0, f"Extraction failed: {str(e)}", completed=True, error=str(e))

@router.post("/fetch/start")
async def start_fetch(req: FetchRequest, background_tasks: BackgroundTasks):
    fac = find_faculty_by_name(req.faculty)
    name = fac.get("name") or req.faculty
    job_id = sanitize_filename(name)
    
    # Check cache first if not forced
    if not req.force_refresh and files_exist_for_author(name):
        return {"job_id": job_id, "cached": True}
            
    # Initialize progress
    update_progress(job_id, "Connecting to Google Scholar", 5, f"Starting extraction engine for {name}...")
    
    # Launch background extraction task
    background_tasks.add_task(
        _run_extraction_task,
        fac.get("scopus_id", ""),
        fac.get("scholar_id", ""),
        name,
        job_id
    )
    
    return {"job_id": job_id, "cached": False}

@router.get("/progress/{job_id}")
async def stream_progress(job_id: str, request: Request):
    async def event_generator():
        last_timestamp = 0
        while True:
            if job_id in PROGRESS_STORE:
                event = PROGRESS_STORE[job_id]
                if event["timestamp"] > last_timestamp:
                    last_timestamp = event["timestamp"]
                    yield {
                        "event": "progress",
                        "data": json.dumps(event)
                    }
                    if event.get("completed") or event.get("error"):
                        break
            await asyncio.sleep(0.3)
    # Return SSE with ngrok-skip header so EventSource over ngrok isn't blocked
    return EventSourceResponse(
        event_generator(),
        headers={"ngrok-skip-browser-warning": "skip"}
    )

@router.post("/fetch", response_model=FetchResponse)
async def fetch_data(req: FetchRequest):
    fac = find_faculty_by_name(req.faculty)
    name = fac.get("name") or req.faculty
    safe_name = sanitize_filename(name)
    
    if not req.force_refresh:
        cached = get_cached_portfolio(name)
        if cached:
            rows = cached["rows"]
            metrics = compute_portfolio_metrics(rows, fac)
            top_ca = compute_top_coauthors(rows)
            return FetchResponse(
                author={"name": name, "scopus_id": fac.get("scopus_id", ""), "scholar_id": fac.get("scholar_id", "")},
                metrics=metrics,
                publications=rows,
                csv_file=cached["csv_file"],
                json_file=cached["json_file"],
                excel_file=cached.get("excel_file"),
                pdf_file=cached.get("pdf_file"),
                generated_at=cached["generated_at"],
                cached=True,
                top_coauthors=top_ca
            )
            
    # Run synchronous extraction if direct post called
    result = extract_faculty(fac.get("scopus_id", ""), fac.get("scholar_id", ""), author_name=name)
    rows = result["publications"]
    metrics = result["metrics"]
    top_ca = compute_top_coauthors(rows)
    
    return FetchResponse(
        author=result["author"],
        metrics=metrics,
        publications=rows,
        csv_file=f"{safe_name}.csv",
        json_file=f"{safe_name}.json",
        excel_file=f"{safe_name}.xlsx",
        pdf_file=f"{safe_name}.pdf",
        generated_at=datetime.now(timezone.utc).isoformat(),
        cached=False,
        top_coauthors=top_ca
    )

@router.get("/download/csv/{filename}")
async def download_csv(filename: str):
    file_path = CSV_DIR / os.path.basename(filename)
    if not file_path.exists():
        return JSONResponse(status_code=404, content={"success": False, "message": "Requested CSV file does not exist."})
    return FileResponse(
        str(file_path),
        media_type="text/csv",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/download/json/{filename}")
async def download_json(filename: str):
    file_path = JSON_DIR / os.path.basename(filename)
    if not file_path.exists():
        return JSONResponse(status_code=404, content={"success": False, "message": "Requested JSON file does not exist."})
    return FileResponse(
        str(file_path),
        media_type="application/json",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/download/excel/{filename}")
async def download_excel(filename: str):
    file_path = EXCEL_DIR / os.path.basename(filename)
    if not file_path.exists():
        return JSONResponse(status_code=404, content={"success": False, "message": "Requested Excel file does not exist."})
    return FileResponse(
        str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/download/pdf/{filename}")
async def download_pdf(filename: str):
    file_path = PDF_DIR / os.path.basename(filename)
    if not file_path.exists():
        return JSONResponse(status_code=404, content={"success": False, "message": "Requested PDF report does not exist."})
    return FileResponse(
        str(file_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/health")
async def health_check():
    from backend.services.extractor import engine
    scholar_ok = getattr(engine, "scholarly", None) is not None
    scopus_ok = bool(getattr(engine, "API_KEY", ""))
    return {
        "status": "online",
        "version": "2.5.0-PROD",
        "scopus_availability": "Available" if scopus_ok else "Degraded",
        "scholar_availability": "Available" if scholar_ok else "Not Installed",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
