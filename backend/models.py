from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class FacultyItem(BaseModel):
    name: str
    scopus_id: str
    scholar_id: str

class FetchRequest(BaseModel):
    faculty: str
    force_refresh: Optional[bool] = False

class ProgressEvent(BaseModel):
    job_id: str
    stage: str
    progress: int
    message: str
    completed: bool = False
    error: Optional[str] = None

class MetricSource(BaseModel):
    h_index: str = ""
    i10_index: str = ""
    total_citations: str = ""
    document_count: str = ""
    source: str = ""

class MetricsComparison(BaseModel):
    scopus: MetricSource
    scholar: MetricSource
    combined: MetricSource

class CoauthorStat(BaseModel):
    name: str
    count: int

class FetchResponse(BaseModel):
    author: Dict[str, Any]
    metrics: Dict[str, Any]
    publications: List[Dict[str, Any]]
    csv_file: str
    json_file: str
    excel_file: Optional[str] = None
    pdf_file: Optional[str] = None
    generated_at: str
    cached: bool
    metrics_comparison: Optional[MetricsComparison] = None
    top_coauthors: Optional[List[CoauthorStat]] = None
