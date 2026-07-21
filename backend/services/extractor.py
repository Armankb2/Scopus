import importlib.util
import os
import sys
import time
import builtins
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.services.utils import sanitize_filename, compute_portfolio_metrics
from backend.services.cache import CSV_DIR, JSON_DIR, EXCEL_DIR, PDF_DIR, add_recent_report
from backend.services.downloads import generate_excel_report, generate_pdf_report

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

PY_FILE = os.path.join(WORKSPACE_ROOT, "00.py")

# Cleanly import 00.py as engine without modifying it or running main()
spec = importlib.util.spec_from_file_location("extraction_engine", PY_FILE)
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)

# In-memory progress store for SSE
PROGRESS_STORE: Dict[str, Dict[str, Any]] = {}

def update_progress(job_id: str, stage: str, progress: int, message: str, completed: bool = False, error: Optional[str] = None):
    PROGRESS_STORE[job_id] = {
        "job_id": job_id,
        "stage": stage,
        "progress": progress,
        "message": message,
        "completed": completed,
        "error": error,
        "timestamp": time.time()
    }

def get_faculty_list() -> List[Dict[str, str]]:
    """Return the embedded FACULTY list from 00.py"""
    faculty_list = []
    for f in getattr(engine, "FACULTY", []):
        faculty_list.append({
            "name": f.get("name", ""),
            "scopus_id": f.get("scopus_id", ""),
            "scholar_id": f.get("scholar_id", "")
        })
    return faculty_list

def find_faculty_by_name(name: str) -> Dict[str, str]:
    name_lower = name.strip().lower()
    for f in getattr(engine, "FACULTY", []):
        if f.get("name", "").strip().lower() == name_lower:
            return f
    return {"name": name, "scopus_id": "", "scholar_id": ""}

# Custom open function to redirect output files without os.chdir()
original_open = builtins.open

def custom_open(file, *args, **kwargs):
    if isinstance(file, str) and "/" not in file and "\\" not in file:
        if file.endswith(".csv"):
            return original_open(str(CSV_DIR / file), *args, **kwargs)
        elif file.endswith(".json"):
            return original_open(str(JSON_DIR / file), *args, **kwargs)
    return original_open(file, *args, **kwargs)

def extract_faculty(scopus_id: str, scholar_id: str, author_name: str = "Custom Faculty", job_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Core reusable extraction entry point required by specification.
    Calls 00.py extraction sequence and stores outputs in generated/ directory.
    """
    if not job_id:
        job_id = sanitize_filename(author_name)

    # Hook progress bar in 00.py to stream granular progress updates
    original_display = getattr(engine, "display_progress_bar", None)
    
    def hooked_progress_bar(iteration, total, prefix='', suffix='', decimals=1, length=20, fill='█'):
        if original_display:
            original_display(iteration, total, prefix, suffix, decimals, length, fill)
        if total > 0:
            pct = int((iteration / float(total)) * 100)
            if "Scholar" in prefix:
                base_pct = 25 + int(pct * 0.15)
                update_progress(job_id, "Fetching Google Scholar Publications", base_pct, f"Downloading Google Scholar records ({iteration}/{total})...")
            elif "Scopus-only" in prefix:
                base_pct = 55 + int(pct * 0.15)
                update_progress(job_id, "Retrieving Journal Rankings", base_pct, f"Querying SCImago database & CrossRef ({iteration}/{total})...")
            elif "Writing CSV" in prefix:
                base_pct = 80 + int(pct * 0.10)
                update_progress(job_id, "Generating CSV", base_pct, f"Saving data to output files ({iteration}/{total})...")

    if original_display:
        engine.display_progress_bar = hooked_progress_bar

    # Monkeypatch open to redirect outputs cleanly
    builtins.open = custom_open

    try:
        # Step 1: Connecting to Google Scholar
        update_progress(job_id, "Connecting to Google Scholar", 10, "Initializing connections to academic databases...")
        
        scholar_filled = None
        if scholar_id and getattr(engine, "scholarly", None):
            try:
                update_progress(job_id, "Fetching Google Scholar Publications", 20, f"Fetching Scholar profile details...")
                scholar_filled = engine.fetch_scholar_author_pubs(scholar_id)
            except Exception as e:
                print(f"[EXTRACTOR] Scholar error: {e}")

        # Step 2: Fetching Scopus Publications
        update_progress(job_id, "Fetching Scopus Publications", 35, f"Connecting to Elsevier Scopus API...")
        scopus_entries = []
        if scopus_id:
            try:
                scopus_entries = engine.fetch_scopus_author_pubs(scopus_id, per_page=25)
            except Exception as e:
                print(f"[EXTRACTOR] Scopus error: {e}")

        # Step 3: Fetching Author Metrics
        update_progress(job_id, "Fetching Author Metrics", 50, "Extracting h-index, citations, and index scores...")
        author_metrics = engine.get_combined_author_metrics(scopus_id, scholar_id)

        # Step 4: Retrieving Journal Rankings & Matching Publications
        update_progress(job_id, "Retrieving Journal Rankings", 65, "Validating publication outlets and ranking metrics...")
        update_progress(job_id, "Matching Publications", 70, "Deduplicating entries from Scopus and Scholar...")
        update_progress(job_id, "Building Dataset", 75, "Compiling unified database records...")
        
        rows = engine.build_unified_rows(author_name, scholar_filled, scopus_entries, scopus_id, scholar_id)

        # Step 5: Generating CSV & JSON
        update_progress(job_id, "Generating CSV", 85, "Writing CSV and JSON publications reports...")
        engine.save_outputs(author_name, rows)

        # Step 6: Excel and PDF compilation
        update_progress(job_id, "Generating CSV", 90, "Compiling Excel spreadsheet and styling PDF report...")
        portfolio_metrics = compute_portfolio_metrics(rows, author_metrics)
        
        generate_excel_report(author_name, rows)
        generate_pdf_report(author_name, portfolio_metrics, rows, {
            "scopus_id": scopus_id,
            "scholar_id": scholar_id
        })

        safe_name = sanitize_filename(author_name)
        csv_path = CSV_DIR / f"{safe_name}.csv"
        json_path = JSON_DIR / f"{safe_name}.json"

        # Step 7: Preparing Dashboard (Completed)
        update_progress(job_id, "Preparing Dashboard", 100, "Successfully constructed academic portfolio dashboard!", completed=True)
        add_recent_report(author_name, scopus_id, scholar_id, len(rows), int(portfolio_metrics["total_citations"]))

        return {
            "author": {
                "name": author_name,
                "scopus_id": scopus_id,
                "scholar_id": scholar_id
            },
            "metrics": portfolio_metrics,
            "publications": rows,
            "csv_path": str(csv_path),
            "json_path": str(json_path)
        }
    finally:
        builtins.open = original_open
        if original_display:
            engine.display_progress_bar = original_display
