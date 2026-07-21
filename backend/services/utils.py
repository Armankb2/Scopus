import re
from typing import List, Dict, Any
from collections import Counter

def sanitize_filename(name: str) -> str:
    """Sanitize author name for use in filename, identical to 00.py"""
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '_', name)
    return name.strip('_')

def compute_portfolio_metrics(rows: List[Dict[str, Any]], author_info: Dict[str, Any]) -> Dict[str, Any]:
    """Compute rich KPIs from publication rows"""
    total_pubs = len(rows)
    conf_count = 0
    journal_count = 0
    verified_count = 0
    q1 = q2 = q3 = q4 = 0
    
    total_citations_calc = 0
    citation_list = []
    
    for r in rows:
        # Conference vs Journal
        is_conf = str(r.get("IsConference", "")).upper() == "YES"
        if is_conf:
            conf_count += 1
        else:
            journal_count += 1
            
        # Verified
        if str(r.get("ScopusVerified", "")).upper() == "YES":
            verified_count += 1
            
        # Quartile
        q = str(r.get("Quartile", "")).upper()
        if "Q1" in q: q1 += 1
        elif "Q2" in q: q2 += 1
        elif "Q3" in q: q3 += 1
        elif "Q4" in q: q4 += 1
        
        # Citations
        c = r.get("NumberOfCitations", 0)
        try:
            val = int(c)
            total_citations_calc += val
            citation_list.append(val)
        except (ValueError, TypeError):
            pass

    # Reliable calculation of h-index and i10-index from publication citation distribution
    citation_list.sort(reverse=True)
    calc_h_index = 0
    for i, c in enumerate(citation_list):
        if c >= i + 1:
            calc_h_index = i + 1
        else:
            break
    calc_i10_index = sum(1 for c in citation_list if c >= 10)

    # Extract author-level metrics from author_info or first row, fallback to calculated indices
    raw_h = author_info.get("h_index") or (rows[0].get("h_index") if rows else "")
    raw_i10 = author_info.get("i10_index") or (rows[0].get("i10_index") if rows else "")
    
    h_index = raw_h if (raw_h and str(raw_h).strip() not in ("", "0", "N/A")) else str(calc_h_index)
    i10_index = raw_i10 if (raw_i10 and str(raw_i10).strip() not in ("", "0", "N/A")) else str(calc_i10_index)
    total_citations = author_info.get("total_citations") or (rows[0].get("total_citations") if rows else "") or str(total_citations_calc)
    doc_count = author_info.get("document_count") or (rows[0].get("document_count") if rows else "") or str(total_pubs)

    return {
        "h_index": str(h_index),
        "i10_index": str(i10_index),
        "total_citations": str(total_citations),
        "document_count": str(doc_count),
        "total_publications": total_pubs,
        "verified_publications": verified_count,
        "conference_papers": conf_count,
        "journal_papers": journal_count,
        "q1_journals": q1,
        "q2_journals": q2,
        "q3_journals": q3,
        "q4_journals": q4
    }

def compute_top_coauthors(rows: List[Dict[str, Any]], top_n: int = 10) -> List[Dict[str, Any]]:
    coauthors = []
    for r in rows:
        ca_str = str(r.get("coauthor", "")).strip()
        if not ca_str:
            continue
        parts = [p.strip() for p in ca_str.split(",") if p.strip()]
        for p in parts:
            if len(p) > 2:
                coauthors.append(p)
    counts = Counter(coauthors).most_common(top_n)
    return [{"name": name, "count": count} for name, count in counts]
