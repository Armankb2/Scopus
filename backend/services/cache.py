import os
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from backend.services.utils import sanitize_filename

# Directory definitions
BASE_DIR = Path(__file__).resolve().parent.parent.parent
GENERATED_DIR = BASE_DIR / "generated"
CSV_DIR = GENERATED_DIR / "csv"
JSON_DIR = GENERATED_DIR / "json"
EXCEL_DIR = GENERATED_DIR / "excel"
PDF_DIR = GENERATED_DIR / "pdf"

# Ensure all directories exist
for d in [CSV_DIR, JSON_DIR, EXCEL_DIR, PDF_DIR]:
    d.mkdir(parents=True, exist_ok=True)

RECENT_REPORTS_FILE = GENERATED_DIR / ".recent_reports.json"

def get_cached_portfolio(author_name: str) -> Optional[Dict[str, Any]]:
    safe_name = sanitize_filename(author_name)
    json_path = JSON_DIR / f"{safe_name}.json"
    csv_path = CSV_DIR / f"{safe_name}.csv"
    excel_path = EXCEL_DIR / f"{safe_name}.xlsx"
    pdf_path = PDF_DIR / f"{safe_name}.pdf"
    
    # Must check all 4 files exist to guarantee immediate downloads
    if not (json_path.exists() and csv_path.exists() and excel_path.exists() and pdf_path.exists()):
        return None
        
    try:
        mtime = os.path.getmtime(json_path)
        gen_time = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
        
        with open(json_path, "r", encoding="utf-8") as f:
            rows = json.load(f)
            
        return {
            "rows": rows,
            "json_file": f"{safe_name}.json",
            "csv_file": f"{safe_name}.csv",
            "excel_file": f"{safe_name}.xlsx",
            "pdf_file": f"{safe_name}.pdf",
            "generated_at": gen_time
        }
    except Exception as e:
        print(f"[CACHE] Error reading cache for {author_name}: {e}")
        return None

def add_recent_report(author_name: str, scopus_id: str, scholar_id: str, doc_count: int, citations: int):
    try:
        reports = get_recent_reports()
        # Remove duplicate if any
        reports = [r for r in reports if r["name"].lower() != author_name.lower()]
        reports.insert(0, {
            "name": author_name,
            "scopus_id": scopus_id,
            "scholar_id": scholar_id,
            "document_count": doc_count,
            "total_citations": citations,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        reports = reports[:15]
        with open(RECENT_REPORTS_FILE, "w", encoding="utf-8") as f:
            json.dump(reports, f, indent=2)
    except Exception as e:
        print(f"[CACHE] Error saving recent report: {e}")

def get_recent_reports() -> List[Dict[str, Any]]:
    if not RECENT_REPORTS_FILE.exists():
        return []
    try:
        with open(RECENT_REPORTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []
