#!/usr/bin/env python3
"""
unified.py

Single-file tool that merges Google Scholar + Scopus data for faculty.

Usage:
  - Interactive:
      python unified.py
    Then pick a faculty number from the printed list.

  - Direct (non-interactive):
      python unified.py <scopus_author_id> <google_scholar_id>
    Example:
      python unified.py 57384843400 vTUAWAsAAAAJ

Outputs:
  - unified_<author_name>.csv
  - unified_<author_name>.json

Requirements:
  pip install scholarly requests beautifulsoup4 python-dotenv

Notes:
  - Provide Elsevier API key in env var ELSEVIER_API_KEY or set API_KEY constant.
  - Many fields (IF, SJR, ORCID) are best-effort and may show "N/A".
"""
import os
import re
import sys
import time
import json
import csv
import traceback
from urllib.parse import quote_plus, urljoin, unquote
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# scholar: pip install scholarly
try:
    from scholarly import scholarly
except Exception:
    scholarly = None

# Load .env if present
load_dotenv()

# ----------------------------
# Configuration - update if needed
# ----------------------------
API_KEY = ""
BASE_URL = ""
ABSTRACT_BY_EID = ""
ABSTRACT_BY_DOI = "}"
AUTHOR_PROFILE_URL = ""
SCIMAGO_BASE = ""
CROSSREF_WORKS = ""
SLEEP_BETWEEN_REQUESTS = 0.35

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "en-US,en;q=0.9",
}

# caches
_sjr_cache = {}
_if_cache = {}
_scopus_profile_cache = {}
_abstract_cache = {}
_crossref_cache = {}
_enrich_cache = {}

# ----------------------------
# Faculty list embedded (use your provided table)
# ----------------------------
FACULTY = [
    {"name": "Dr.R China Appala Naidu", "scopus_id": "57192153880", "scholar_id": "R9mwtaUAAAAJ"},
    {"name": "Dr.Seema S", "scopus_id": "57188643917", "scholar_id": "1rg4Qg4AAAAJ"},
    {"name": "Dr.Monica R Mundada", "scopus_id": "55532875100", "scholar_id": "_gNJRewAAAAJ"},
    {"name": "Prof. Nagabhushan A M", "scopus_id": "", "scholar_id": ""},
    {"name": "Dr.Shilpa S Chaudhari", "scopus_id": "56177436200", "scholar_id": "daxojLsAAAAJ"},
    {"name": "Dr.T.N R. Kumar", "scopus_id": "57193570853", "scholar_id": ""},
    {"name": "Dr.Rajarajeswari S", "scopus_id": "57216700909", "scholar_id": "S0rWhnMAAAAJ"},
    {"name": "Dr.J.Sangeetha", "scopus_id": "59125848800", "scholar_id": "FZ0848wAAAAJ"},
    {"name": "Dr.A Parkavi", "scopus_id": "56040990300", "scholar_id": "uOwul8kAAAAJ"},
    {"name": "Dr.J Geetha", "scopus_id": "55317720400", "scholar_id": "uEh6zRUAAAAJ"},
    {"name": "Dr.Dayananda R B", "scopus_id": "57211906753", "scholar_id": "i6I2-GQAAAAJ"},
    {"name": "Dr.Sangeetha V", "scopus_id": "57189683778", "scholar_id": "qX-0prYAAAAJ"},
    {"name": "Dr.Ganeshayya I Shidaganti", "scopus_id": "55995597600", "scholar_id": "U4Hi0MkAAAAJ"},
    {"name": "Veena GS", "scopus_id": "57198996526", "scholar_id": "iZpKmYEAAAAJ"},
    {"name": "Dr.Mallegowda M", "scopus_id": "57210205641", "scholar_id": "geX_RLEAAAAJ"},
    {"name": "Chandrika Prasad", "scopus_id": "57216439920", "scholar_id": "QkJ9Kh0AAAAJ"},
    {"name": "Pradeep kumar D", "scopus_id": "57192437204", "scholar_id": "CF_Afu8AAAAJ"},
    {"name": "Darshana A Naik", "scopus_id": "57208920461", "scholar_id": "m6U3HGQAAAAJ"},
    {"name": "Jamuna S Murthy", "scopus_id": "59313457800", "scholar_id": "DIJx__kAAAAJ"},
    {"name": "Dr.Sushma B", "scopus_id": "57224575855", "scholar_id": "CVd5LiYAAAAJ"},
    {"name": "Nandini S B", "scopus_id": "", "scholar_id": ""},
    {"name": "Chetan D S", "scopus_id": "", "scholar_id": ""},
    {"name": "Soumya C S", "scopus_id": "57384843400", "scholar_id": "vTUAWAsAAAAJ"},
    {"name": "Akshata S Bhayyar", "scopus_id": "57542272700", "scholar_id": "GeaVQ2wAAAAJ"},
    {"name": "Vishwachetan D", "scopus_id": "58706686500", "scholar_id": "sxLUjPoAAAAJ"},
    {"name": "Akshatha Kamath", "scopus_id": "58983111900", "scholar_id": "_r3-R54AAAAJ"},
    {"name": "Mamatha A", "scopus_id": "58819213200", "scholar_id": "adfesocAAAAJ"},
    {"name": "Pallavi N", "scopus_id": "58976488300", "scholar_id": "nFIWEyQAAAAJ"},
    {"name": "Dr.Manjula Chougala", "scopus_id": "", "scholar_id": ""},
    {"name": "Priya K", "scopus_id": "", "scholar_id": ""},
    {"name": "Uzma Sulthana", "scopus_id": "59187785900", "scholar_id": "lWIfKEcAAAAJ"},
    {"name": "Brunda G", "scopus_id": "", "scholar_id": ""},
]

# ----------------------------
# Progress Bar Functions
# ----------------------------
def display_progress_bar(iteration, total, prefix='', suffix='', decimals=1, length=20, fill='█'):
    """
    Display a progress bar in the console.
    
    Parameters:
    iteration   - Current iteration (Int)
    total       - Total iterations (Int)
    prefix      - Prefix string (Str)
    suffix      - Suffix string (Str)
    decimals    - Positive number of decimals in percent complete (Int)
    length      - Character length of bar (Int)
    fill        - Bar fill character (Str)
    """
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '░' * (length - filled_length)
    
    # Use carriage return to stay on the same line
    sys.stdout.write(f'\r{prefix} [{bar}] {percent}% {suffix}')
    sys.stdout.flush()
    
    # Print new line when complete
    if iteration == total:
        print()

# ----------------------------
# Warning Display Function (Blinking Red)
# ----------------------------
def display_warning():
    """Display blinking warning message in red"""
    # Clear line
    sys.stdout.write('\r' + ' ' * 100 + '\r')
    sys.stdout.flush()
    
    # Blinking effect using ANSI escape codes
    # \033[5m = Blinking, \033[91m = Red foreground, \033[1m = Bold
    blinking_start = "\033[5m\033[91m\033[1m"
    blinking_end = "\033[0m"
    
    # Display blinking warning
    for i in range(3):  # Blink 3 times
        print(f"\n{blinking_start}[⚠] IMPORTANT NOTE:{blinking_end}")
        print(f"{blinking_start}[⚠] Data scraped through APIs (Scopus & Google Scholar) may contain inaccuracies.{blinking_end}")
        print(f"{blinking_start}[⚠] Please verify critical information before use in official reports.{blinking_end}")
        print(f"{blinking_start}[⚠] API limitations may affect completeness and accuracy of extracted data.{blinking_end}")
        
        if i < 2:  # Don't wait after last blink
            time.sleep(0.5)
            
            # Clear the warning lines
            sys.stdout.write('\033[4A')  # Move cursor up 4 lines
            for j in range(4):
                sys.stdout.write('\033[2K\r')  # Clear each line
            sys.stdout.flush()
            
            time.sleep(0.5)  # Wait before showing again
    
    # Clear line again and show final static red warning (not blinking)
    sys.stdout.write('\r' + ' ' * 100 + '\r')
    sys.stdout.flush()
    
    # Final static red warning
    red_start = "\033[91m\033[1m"
    red_end = "\033[0m"
    print(f"\n{red_start}[⚠] IMPORTANT NOTE:{red_end}")
    print(f"{red_start}[⚠] Data scraped through APIs (Scopus & Google Scholar) may contain inaccuracies.{red_end}")
    print(f"{red_start}[⚠] Please verify critical information before use in official reports.{red_end}")
    print(f"{red_start}[⚠] API limitations may affect completeness and accuracy of extracted data.{red_end}\n")

# ----------------------------
# Helpers
# ----------------------------
def safe_get(url, headers=None, params=None, tries=3, timeout=12, sleep=0.6):
    hdrs = headers or DEFAULT_HEADERS
    for attempt in range(tries):
        try:
            r = requests.get(url, headers=hdrs, params=params, timeout=timeout)
            return r
        except Exception:
            if attempt + 1 == tries:
                return None
            time.sleep(sleep)
    return None

def normalize_title_for_match(t):
    if not t:
        return ""
    s = re.sub(r'\W+', '', t).lower()
    return s

def sanitize_filename(name):
    """Sanitize author name for use in filename"""
    # Remove special characters and replace spaces with underscores
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '_', name)
    return name.strip('_')

# ----------------------------
# NEW: Fetch Scopus Author Metrics (h-index, citations)
# ----------------------------
def fetch_scopus_author_metrics(scopus_id):
    """Fetch h-index, total citations, and document count from Scopus API"""
    if not scopus_id:
        return {"h_index": "", "total_citations": "", "document_count": ""}
    
    # Check cache first
    if scopus_id in _scopus_profile_cache:
        return _scopus_profile_cache[scopus_id]
    
    headers = {"Accept": "application/json", "X-ELS-APIKey": API_KEY}
    url = AUTHOR_PROFILE_URL.format(author_id=scopus_id)
    
    try:
        response = safe_get(url, headers=headers, tries=2, timeout=15)
        if response and response.status_code == 200:
            data = response.json()
            
            # Parse author profile data
            author_profile = data.get("author-retrieval-response", [{}])[0] if isinstance(data.get("author-retrieval-response"), list) else {}
            
            # Get citation metrics
            citation_counts = author_profile.get("coredata", {}).get("citation-count", 0)
            document_count = author_profile.get("coredata", {}).get("document-count", 0)
            
            # Get h-index - it's usually in the h-index field
            h_index = author_profile.get("h-index", "")
            
            # If h-index is not directly available, try to calculate from author-profile
            if not h_index:
                # Check in author-profile section
                author_profile_section = author_profile.get("author-profile", {})
                h_index = author_profile_section.get("h-index", "")
            
            # Alternative: sometimes it's in classification
            if not h_index:
                classifications = author_profile.get("classification", [])
                if classifications and isinstance(classifications, list):
                    for classification in classifications:
                        if isinstance(classification, dict) and classification.get("h-index"):
                            h_index = classification.get("h-index")
                            break
            
            result = {
                "h_index": str(h_index) if h_index else "",
                "total_citations": str(citation_counts) if citation_counts else "",
                "document_count": str(document_count) if document_count else ""
            }
            
            _scopus_profile_cache[scopus_id] = result
            return result
            
    except Exception as e:
        print(f"[!] Error fetching Scopus author metrics: {e}")
    
    # Return empty values if failed
    result = {"h_index": "", "total_citations": "", "document_count": ""}
    _scopus_profile_cache[scopus_id] = result
    return result

# ----------------------------
# NEW: Fetch Google Scholar Author Metrics
# ----------------------------
def fetch_scholar_author_metrics(scholar_id):
    """Fetch h-index, i10-index, and total citations from Google Scholar"""
    if not scholar_id or not scholarly:
        return {"h_index": "", "i10_index": "", "total_citations": ""}
    
    try:
        # Search for author by ID
        author = scholarly.search_author_id(scholar_id)
        if not author:
            print(f"[!] Google Scholar author not found: {scholar_id}")
            return {"h_index": "", "i10_index": "", "total_citations": ""}
        
        # Fill author details
        author_filled = scholarly.fill(author, sections=["basics", "indices"])
        
        # Extract metrics
        h_index = author_filled.get("hindex", "")
        i10_index = author_filled.get("i10index", "")
        total_citations = author_filled.get("citedby", "")
        
        return {
            "h_index": str(h_index) if h_index else "",
            "i10_index": str(i10_index) if i10_index else "",
            "total_citations": str(total_citations) if total_citations else ""
        }
        
    except Exception as e:
        print(f"[!] Error fetching Google Scholar metrics: {e}")
        return {"h_index": "", "i10_index": "", "total_citations": ""}

# ----------------------------
# NEW: Get Combined Author Metrics
# ----------------------------
def get_combined_author_metrics(scopus_id, scholar_id):
    """Get metrics from both sources, preferring Scopus for h-index/citations"""
    scopus_metrics = fetch_scopus_author_metrics(scopus_id)
    scholar_metrics = fetch_scholar_author_metrics(scholar_id)
    
    # Combine with preference for Scopus when available
    combined = {
        "h_index": scopus_metrics.get("h_index") or scholar_metrics.get("h_index") or "",
        "i10_index": scholar_metrics.get("i10_index") or "",  # i10-index is Google Scholar specific
        "total_citations": scopus_metrics.get("total_citations") or scholar_metrics.get("total_citations") or "",
        "document_count": scopus_metrics.get("document_count") or ""
    }
    
    return combined

# ----------------------------
# SJR & quartile via SCImago (best-effort)
# ----------------------------
def get_sjr_and_quartile(journal_name):
    if not journal_name:
        return ("N/A", "N/A")
    key = journal_name.strip().lower()
    if key in _sjr_cache:
        return _sjr_cache[key]
    try:
        q = quote_plus(journal_name)
        search_url = f"{SCIMAGO_BASE}journalsearch.php?q={q}"
        r = safe_get(search_url, tries=2, sleep=0.5)
        if not r or r.status_code != 200:
            _sjr_cache[key] = ("N/A", "N/A")
            return ("N/A", "N/A")
        soup = BeautifulSoup(r.text, "html.parser")
        candidate_href = None
        selectors = [
            "table.search_results a",
            "div.search_results a",
            ".journal_list a",
            "a[href*='journalrank.php?']",
            "a[href*='journal.php?']",
            "a"
        ]
        for sel in selectors:
            el = soup.select_one(sel)
            if el and el.get("href"):
                href = el["href"].strip()
                if href.startswith("javascript:") or href.startswith("#"):
                    continue
                candidate_href = urljoin(SCIMAGO_BASE, href)
                break
        if not candidate_href:
            text = soup.get_text(" ", strip=True)
            m = re.search(r"SJR[:\s]*([0-9]+\.[0-9]+)", text, re.IGNORECASE)
            q2 = re.search(r"(Q[1-4])", text, re.IGNORECASE)
            if m or q2:
                sjr_val = m.group(1) if m else "N/A"
                quart = q2.group(1).upper() if q2 else "N/A"
                _sjr_cache[key] = (sjr_val, quart)
                return (sjr_val, quart)
            _sjr_cache[key] = ("N/A", "N/A")
            return ("N/A", "N/A")
        time.sleep(0.25)
        r2 = safe_get(candidate_href, tries=2, sleep=0.5)
        if not r2 or r2.status_code != 200:
            _sjr_cache[key] = ("N/A", "N/A")
            return ("N/A", "N/A")
        page = BeautifulSoup(r2.text, "html.parser")
        page_text = page.get_text(" ", strip=True)
        sjr_val = None
        quart = None
        m = re.search(r"(?:SJR|SCImago Journal Rank)[^\d\-]*?([0-9]+\.[0-9]+)", page_text, re.IGNORECASE)
        if m:
            sjr_val = m.group(1)
        q2 = re.search(r"(Q[1-4])", page_text, re.IGNORECASE)
        if q2:
            quart = q2.group(1).upper()
        if not sjr_val:
            for tag in page.find_all(string=re.compile(r"SJR", re.IGNORECASE)):
                parent = getattr(tag, "parent", None)
                if parent:
                    txt = parent.get_text(" ", strip=True)
                    m2 = re.search(r"([0-9]+\.[0-9]+)", txt)
                    if m2:
                        sjr_val = m2.group(1)
                        break
        if not sjr_val:
            for sel in ["span.sjr", ".sjr", ".score", ".indicator-value", ".metric", ".sjr-score"]:
                el = page.select_one(sel)
                if el:
                    mm = re.search(r"([0-9]+\.[0-9]+)", el.get_text(" ", strip=True))
                    if mm:
                        sjr_val = mm.group(1)
                        break
        sjr_val = sjr_val if sjr_val else "N/A"
        quart = quart if quart else "N/A"
        _sjr_cache[key] = (sjr_val, quart)
        return (sjr_val, quart)
    except Exception:
        _sjr_cache[key] = ("N/A", "N/A")
        return ("N/A", "N/A")

# ----------------------------
# CrossRef helpers (search by DOI or by title)
# ----------------------------
def crossref_get_by_doi(doi):
    if not doi:
        return {}
    key = f"doi:{doi}"
    if key in _crossref_cache:
        return _crossref_cache[key]
    try:
        url = f"{CROSSREF_WORKS}/{quote_plus(doi)}"
        r = safe_get(url, tries=2, timeout=15)
        if r and r.status_code == 200:
            data = r.json().get("message", {})
            _crossref_cache[key] = data
            return data
    except Exception:
        pass
    _crossref_cache[key] = {}
    return {}

def crossref_search_by_title(title, year=None):
    """Search CrossRef for a DOI by title (best-effort). Returns message dict or {}"""
    if not title:
        return {}
    key = f"title:{title}:{year or''}"
    if key in _crossref_cache:
        return _crossref_cache[key]
    try:
        params = {"query.title": title, "rows": 3}
        if year:
            params["filter"] = f"from-pub-date:{year},until-pub-date:{year}"
        r = safe_get(CROSSREF_WORKS, params=params, tries=2, timeout=15)
        if r and r.status_code == 200:
            items = r.json().get("message", {}).get("items", [])
            if items:
                # choose best candidate (title similarity)
                best = items[0]
                _crossref_cache[key] = best
                return best
    except Exception:
        pass
    _crossref_cache[key] = {}
    return {}

# ----------------------------
# Elsevier abstract fetch & helpers (EID/DOI)
# ----------------------------
def fetch_abstract_by_eid_or_doi(eid=None, doi=None):
    key = eid or doi or ""
    if key in _abstract_cache:
        return _abstract_cache[key]
    headers = {"Accept": "application/json", "X-ELS-APIKey": API_KEY}
    try:
        if eid:
            url = ABSTRACT_BY_EID.format(eid=eid)
            r = safe_get(url, headers=headers, tries=2, sleep=0.4, timeout=15)
            if r and r.status_code == 200:
                _abstract_cache[key] = r.json()
                return _abstract_cache[key]
        if doi:
            doi_q = quote_plus(doi)
            url = ABSTRACT_BY_DOI.format(doi=doi_q)
            r = safe_get(url, headers=headers, tries=2, sleep=0.4, timeout=15)
            if r and r.status_code == 200:
                _abstract_cache[key] = r.json()
                return _abstract_cache[key]
    except Exception:
        pass
    _abstract_cache[key] = None
    return None

def extract_fields_from_abstract_json(j):
    """Try to read coredata -> prism fields from Elsevier abstract JSON."""
    try:
        root = j.get("abstracts-retrieval-response", {}) if isinstance(j, dict) else {}
        core = root.get("coredata", {}) if isinstance(root, dict) else {}
        out = {}
        out["doi"] = core.get("prism:doi") or core.get("dc:identifier") or ""
        out["publisher"] = core.get("prism:publisher") or core.get("dc:publisher") or ""
        out["volume"] = core.get("prism:volume") or ""
        out["issue"] = core.get("prism:issueIdentifier") or core.get("prism:issue") or ""
        out["pages"] = core.get("prism:pageRange") or core.get("prism:startingPage") or ""
        out["article_number"] = core.get("prism:articleNumber") or core.get("pii") or core.get("eid") or ""
        out["date"] = core.get("prism:coverDate") or core.get("prism:coverDisplayDate") or ""
        return out
    except Exception:
        return {}

# ----------------------------
# Enrich Scopus entry (fill missing DOI, Publisher, volume, issue, pages, articleNumber, date)
# ----------------------------
def enrich_scopus_entry(entry, title_for_crossref=None, year_for_crossref=None):
    """
    Mutates entry dictionary (best-effort) and returns a dict with enriched fields:
    {doi,publisher,volume,issue,pages,article_number,date}
    """
    if not isinstance(entry, dict):
        return {}
    # cache by EID or existing DOI or title hash
    key = entry.get("eid") or entry.get("prism:doi") or (title_for_crossref or "")
    if key in _enrich_cache:
        return _enrich_cache[key]
    enriched = {"doi": "", "publisher": "", "volume": "", "issue": "", "pages": "", "article_number": "", "date": ""}
    # 1) Try to read from entry direct fields
    doi_candidates = []
    for k in ("prism:doi", "dc:identifier", "doi"):
        v = entry.get(k)
        if v:
            s = str(v)
            m = re.search(r'(10\.\d{4,9}/[A-Za-z0-9\-\._;()/:]+)', s)
            if m:
                doi_candidates.append(m.group(1))
            else:
                # sometimes dc:identifier contains 'SCOPUS_ID:...' or 'doi:...'
                m2 = re.search(r'doi[:\s]*(10\.\d{4,9}/\S+)', s, re.IGNORECASE)
                if m2:
                    doi_candidates.append(m2.group(1))
    if doi_candidates:
        enriched["doi"] = doi_candidates[0]
    # direct publisher/volume/issue/pages/date if present
    if entry.get("prism:publisher"):
        enriched["publisher"] = entry.get("prism:publisher")
    if entry.get("prism:volume"):
        enriched["volume"] = entry.get("prism:volume")
    if entry.get("prism:issueIdentifier"):
        enriched["issue"] = entry.get("prism:issueIdentifier")
    if entry.get("prism:pageRange"):
        enriched["pages"] = entry.get("prism:pageRange")
    if entry.get("prism:articleNumber"):
        enriched["article_number"] = entry.get("prism:articleNumber")
    if entry.get("prism:coverDate"):
        enriched["date"] = entry.get("prism:coverDate")
    # 2) If some important fields missing try Elsevier abstract API by eid or doi
    eid = entry.get("eid") or entry.get("prism:eid") or ""
    if isinstance(eid, str):
        m = re.search(r"eid:(.+)", eid)
        if m:
            eid = m.group(1).strip()
    if (not enriched["doi"] or not enriched["publisher"] or not enriched["volume"] or not enriched["pages"] or not enriched["article_number"] or not enriched["date"]):
        abs_json = None
        if enriched["doi"]:
            abs_json = fetch_abstract_by_eid_or_doi(doi=enriched["doi"])
        if not abs_json and eid:
            abs_json = fetch_abstract_by_eid_or_doi(eid=eid)
        if abs_json:
            fields = extract_fields_from_abstract_json(abs_json)
            # update missing ones
            for k in ("doi","publisher","volume","issue","pages","article_number","date"):
                if fields.get(k) and not enriched.get(k):
                    enriched[k] = fields.get(k)
    # 3) If DOI still missing try CrossRef by title
    if not enriched["doi"] and title_for_crossref:
        cr = crossref_search_by_title(title_for_crossref, year_for_crossref)
        if cr:
            doi_cr = cr.get("DOI") or cr.get("doi")
            if doi_cr:
                enriched["doi"] = doi_cr
            # crossref fields
            if not enriched["publisher"]:
                enriched["publisher"] = cr.get("publisher") or cr.get("publisher-name", "")
            if not enriched["volume"]:
                enriched["volume"] = cr.get("volume") or ""
            if not enriched["issue"]:
                enriched["issue"] = cr.get("issue") or ""
            if not enriched["pages"]:
                pages_cr = cr.get("page") or cr.get("article-number") or ""
                enriched["pages"] = pages_cr
            if not enriched["date"]:
                issued = cr.get("issued", {}).get("date-parts") if isinstance(cr.get("issued",{}), dict) else None
                if issued and isinstance(issued, list) and issued[0]:
                    enriched["date"] = "-".join(str(x) for x in issued[0])
    # 4) If DOI found via crossref earlier, try crossref_get_by_doi to fetch more
    if enriched["doi"] and (not enriched["publisher"] or not enriched["volume"] or not enriched["pages"] or not enriched["date"]):
        cr2 = crossref_get_by_doi(enriched["doi"])
        if cr2:
            if not enriched["publisher"]:
                enriched["publisher"] = cr2.get("publisher") or ""
            if not enriched["volume"]:
                enriched["volume"] = cr2.get("volume") or ""
            if not enriched["issue"]:
                enriched["issue"] = cr2.get("issue") or ""
            if not enriched["pages"]:
                enriched["pages"] = cr2.get("page") or cr2.get("article-number") or ""
            if not enriched["date"]:
                issued = cr2.get("issued", {}).get("date-parts") if isinstance(cr2.get("issued",{}), dict) else None
                if issued and isinstance(issued, list) and issued[0]:
                    enriched["date"] = "-".join(str(x) for x in issued[0])
    # 5) Normalize empty strings -> ""
    for k in enriched:
        if enriched[k] is None:
            enriched[k] = ""
    _enrich_cache[key] = enriched
    return enriched

# ----------------------------
# Extract article number helper (generic)
# ----------------------------
def extract_article_number(entry):
    for key in ("prism:articleNumber", "pii", "eid", "prism:eid"):
        v = entry.get(key)
        if v:
            return str(v)
    pr = entry.get("prism:pageRange", "") or ""
    if pr and "-" not in pr and len(pr) < 50:
        return pr
    return ""

# ----------------------------
# Parse authors from Scopus entry
# ----------------------------
def parse_authors(entry):
    authors = []
    if entry.get("dc:creator"):
        authors = [entry.get("dc:creator")]
    if entry.get("author") and isinstance(entry.get("author"), list):
        try:
            authors = []
            for a in entry.get("author"):
                if isinstance(a, dict):
                    name = a.get("authname") or a.get("ce:indexedname") or a.get("name") or a.get("authname")
                    if name:
                        authors.append(name)
                else:
                    authors.append(str(a))
        except Exception:
            pass
    if not authors and entry.get("dc:creator"):
        authors = [entry.get("dc:creator")]
    return ", ".join(authors) if authors else ""

# ----------------------------
# Conference detection & extraction (kept same)
# ----------------------------
CONF_KEYWORDS = [
    "proceedings", "proceeding", "conference", "conf.", "symposium", "workshop",
    "proceedings of the", "proceedings of", "international conference", "intl conference",
    "ieee conference", "acm conference"
]

def looks_like_conference_by_title(text):
    if not text:
        return False
    t = text.lower()
    for kw in CONF_KEYWORDS:
        if kw in t:
            return True
    return False

def looks_like_conference_by_aggregation(entry):
    agg = entry.get("prism:aggregationType") or entry.get("aggregationType") or ""
    if not agg:
        return False
    if "conference" in str(agg).lower() or "proceed" in str(agg).lower():
        return True
    return False

def fetch_conference_details_from_abstract(eid=None, doi=None):
    headers = {"Accept": "application/json", "X-ELS-APIKey": API_KEY}
    try:
        if eid:
            url = ABSTRACT_BY_EID.format(eid=eid)
            r = safe_get(url, headers=headers, tries=2, sleep=0.5)
            if r and r.status_code == 200:
                j = r.json()
                conf = _extract_conference_from_abstract_json(j)
                if conf:
                    return conf
        if doi:
            doi_q = quote_plus(doi)
            url = ABSTRACT_BY_DOI.format(doi=doi_q)
            r = safe_get(url, headers=headers, tries=2, sleep=0.5)
            if r and r.status_code == 200:
                j = r.json()
                conf = _extract_conference_from_abstract_json(j)
                if conf:
                    return conf
    except Exception:
        pass
    return ("", "")

def _extract_conference_from_abstract_json(j):
    try:
        root = j.get("abstracts-retrieval-response") or j
        def find_key(d, keyname):
            if not isinstance(d, (dict, list)):
                return None
            if isinstance(d, list):
                for item in d:
                    res = find_key(item, keyname)
                    if res:
                        return res
                return None
            if keyname in d:
                return d[keyname]
            for v in d.values():
                res = find_key(v, keyname)
                if res:
                    return res
            return None
        conference = find_key(root, "conference")
        if conference and isinstance(conference, dict):
            conf_place = conference.get("confPlace") or conference.get("confLocation") or conference.get("confVenue") or ""
            conf_start = conference.get("confStartDate") or conference.get("confDate") or ""
            conf_end = conference.get("confEndDate") or ""
            date_parts = []
            if conf_start:
                date_parts.append(str(conf_start))
            if conf_end:
                date_parts.append(str(conf_end))
            conf_date = " to ".join(date_parts) if date_parts else conference.get("confDate") or ""
            if isinstance(conf_place, dict):
                conf_place = conf_place.get("affiliation") or conf_place.get("city") or conf_place.get("country") or ""
            return (conf_date or "", conf_place or "")
        bib = find_key(root, "bibrecord")
        if bib:
            text = json.dumps(bib)
            m = re.search(r"(?:conf(?:erence)?(?: date|:)?\s*)([0-9]{4}(?:-[0-9]{2}-[0-9]{2})?)", text, re.IGNORECASE)
            conf_date = m.group(1) if m else ""
            m2 = re.search(r"(?:conf(?:erence)?(?: place| location| venue|:)\s*)([A-Za-z0-9, \-]+)", text, re.IGNORECASE)
            conf_place = m2.group(1).strip() if m2 else ""
            if conf_date or conf_place:
                return (conf_date, conf_place)
    except Exception:
        pass
    return None

# ----------------------------
# Scopus API fetch (paginated)
# ----------------------------
def fetch_scopus_author_pubs(author_id, per_page=25, max_pages=None):
    start = 0
    all_entries = []
    page_num = 0
    headers = {"Accept": "application/json", "X-ELS-APIKey": API_KEY}
    
    # First, get total count for progress bar
    print(f"[INFO] Fetching Scopus publications...")
    
    while True:
        page_num += 1
        url = BASE_URL
        params = {
            "query": f"AU-ID({author_id})",
            "apiKey": API_KEY,
            "start": start,
            "count": per_page,
        }
        
        print(f"[INFO] Fetching Scopus publications (batch {page_num})")
        
        try:
            r = safe_get(url, headers=headers, params=params, tries=3, sleep=0.6, timeout=20)
        except Exception as e:
            print(f"[!] Scopus request failed: {e}")
            break
        
        if not r or r.status_code != 200:
            print(f"[!] Scopus API returned {getattr(r,'status_code',None)}")
            break
        
        try:
            data = r.json()
        except Exception:
            print("[!] Scopus response not JSON")
            break
        
        entries = data.get("search-results", {}).get("entry", [])
        if not entries:
            break
        
        all_entries.extend([e for e in entries if isinstance(e, dict)])
        
        # Show progress for this batch
        total = data.get("search-results", {}).get("opensearch:totalResults", 0)
        if isinstance(total, str) and total.isdigit():
            total = int(total)
        else:
            total = len(all_entries) + per_page  # Estimate
        
        # Calculate progress percentage
        progress = min(100, int((start + len(entries)) / total * 100))
        display_progress_bar(progress, 100, prefix='[PROGRESS]', suffix='')
        
        if max_pages and page_num >= max_pages:
            break
        
        if len(entries) < per_page:
            display_progress_bar(100, 100, prefix='[PROGRESS]', suffix='')
            break
        
        start += per_page
        time.sleep(SLEEP_BETWEEN_REQUESTS)
    
    print(f"\n[✔] Total Scopus entries fetched: {len(all_entries)}")
    return all_entries

# ----------------------------
# Google Scholar fetch (scholarly)
# ----------------------------
def fetch_scholar_author_pubs(scholar_id):
    if not scholarly:
        print("[!] scholarly library not installed. Install: pip install scholarly")
        return None
    try:
        print(f"[+] Fetching Google Scholar author {scholar_id} ...")
        author = scholarly.search_author_id(scholar_id)
        filled = scholarly.fill(author, sections=["basics", "indices", "publications"])
        return filled
    except Exception as e:
        print("[!] Scholar fetch error:", e)
        return None

# ----------------------------
# Scopus verification (title-based or DOI-based)
# ----------------------------
def check_scopus_verification_for_scholar_pubs(scholar_pubs, scopus_entries):
    doi_set = set()
    title_set = set()
    for e in scopus_entries:
        doi = (e.get("prism:doi") or e.get("dc:identifier") or "") or ""
        if isinstance(doi, str) and doi:
            doi_set.add(doi.lower().strip())
        t = normalize_title_for_match(e.get("dc:title") or e.get("title") or "")
        if t:
            title_set.add(t)
    verified = {}
    pubs = scholar_pubs.get("publications", []) if isinstance(scholar_pubs, dict) else []
    for p in pubs:
        try:
            bib = p.get("bib", {}) if isinstance(p, dict) else {}
            title = bib.get("title", "") or p.get("title", "")
            doi = bib.get("doi") if isinstance(bib, dict) else None
            doi_norm = doi.lower().strip() if doi else ""
            tnorm = normalize_title_for_match(title)
            ok = False
            if doi_norm and doi_norm in doi_set:
                ok = True
            elif tnorm and tnorm in title_set:
                ok = True
            verified[title] = ok
        except Exception:
            pass
    return verified

# ----------------------------
# Merge and output
# ----------------------------
def build_unified_rows(author_profile, scholar_filled, scopus_entries, scopus_id, scholar_id):
    """
    Build list of unified rows (dicts) combining scholar + scopus.
    For every Google Scholar pub, include scopus verification and scopus metadata if present.
    Additionally include Scopus-only papers (optional) - included at end.
    """
    rows = []
    
    # Get author metrics
    author_metrics = get_combined_author_metrics(scopus_id, scholar_id)
    author_h_index = author_metrics.get("h_index", "")
    author_i10_index = author_metrics.get("i10_index", "")
    author_total_citations = author_metrics.get("total_citations", "")
    author_document_count = author_metrics.get("document_count", "")
    
    # scopus lookup by DOI and normalized title for quick metadata grab
    scopus_by_doi = {}
    scopus_by_title = {}
    for e in scopus_entries:
        doi = (e.get("prism:doi") or e.get("dc:identifier") or "") or ""
        if isinstance(doi, str) and doi:
            scopus_by_doi[doi.lower().strip()] = e
        t = normalize_title_for_match(e.get("dc:title") or e.get("title") or "")
        if t:
            scopus_by_title[t] = e

    # Scopus verification map
    verification = {}
    if scholar_filled:
        verification = check_scopus_verification_for_scholar_pubs(scholar_filled, scopus_entries)

    # Process scholar publications first (keeps order)
    if scholar_filled and isinstance(scholar_filled, dict):
        pubs = scholar_filled.get("publications", []) or []
        print(f"[INFO] Processing {len(pubs)} Google Scholar publications...")
        for idx, p in enumerate(pubs, start=1):
            try:
                try:
                    p_filled = scholarly.fill(p)
                except Exception:
                    p_filled = p
                bib = p_filled.get("bib", {}) if isinstance(p_filled, dict) else {}
                title = bib.get("title", "") or p_filled.get("title", "")
                authors_str = bib.get("author", "") if isinstance(bib, dict) else ""
                coauthors = authors_str.replace(" and ", ", ") if authors_str else ""
                year = bib.get("year") or bib.get("pub_year") or ""
                doi = bib.get("doi") if isinstance(bib, dict) else None
                doi_norm = doi.lower().strip() if doi else ""
                url = p_filled.get("pub_url") or bib.get("url") or bib.get("eprint") or ""
                citations = int(p_filled.get("num_citations", 0)) if p_filled.get("num_citations") else 0

                scopus_meta = None
                if doi_norm and doi_norm in scopus_by_doi:
                    scopus_meta = scopus_by_doi[doi_norm]
                else:
                    tnorm = normalize_title_for_match(title)
                    if tnorm and tnorm in scopus_by_title:
                        scopus_meta = scopus_by_title[tnorm]

                # defaults
                journal_title = ""
                journal_name = ""
                volume = ""
                issue = ""
                pages = ""
                article_number = ""
                date_of_publication = ""
                publisher = ""
                sjr = "N/A"
                quartile = "N/A"
                scopus_cites = ""
                is_conf = "NO"
                conf_date = ""
                conf_place = ""
                orcid = ""

                # If scopus metadata found, attempt to enrich it to populate missing fields
                if scopus_meta:
                    # attempt enrichment (Elsevier abstract -> CrossRef)
                    enriched = enrich_scopus_entry(scopus_meta, title_for_crossref=title, year_for_crossref=year)
                    # take from entry first then enriched fields if still missing
                    journal_name = scopus_meta.get("prism:publicationName", "") or ""
                    journal_title = journal_name
                    # volume/issue/pages/article/date: prefer prism fields, else enriched
                    volume = scopus_meta.get("prism:volume", "") or enriched.get("volume", "")
                    issue = scopus_meta.get("prism:issueIdentifier", "") or scopus_meta.get("prism:issue", "") or enriched.get("issue", "")
                    pages = scopus_meta.get("prism:pageRange", "") or enriched.get("pages", "")
                    article_number = extract_article_number(scopus_meta) or enriched.get("article_number", "")
                    date_of_publication = scopus_meta.get("prism:coverDate", "") or enriched.get("date", "")
                    publisher = scopus_meta.get("prism:publisher", "") or enriched.get("publisher", "")
                    doi_final = enriched.get("doi", "") or (scopus_meta.get("prism:doi") or scopus_meta.get("dc:identifier") or "")
                    sjr, quartile = get_sjr_and_quartile(journal_name)
                    scopus_cites = scopus_meta.get("citedby-count", "") or ""
                    # conference detection
                    if looks_like_conference_by_aggregation(scopus_meta) or looks_like_conference_by_title(journal_name) or looks_like_conference_by_title(title):
                        is_conf = "YES"
                        eid = scopus_meta.get("eid") or scopus_meta.get("prism:eid") or ""
                        if isinstance(eid, str):
                            m = re.search(r"eid:(.+)", eid)
                            if m:
                                eid = m.group(1).strip()
                        conf_date, conf_place = fetch_conference_details_from_abstract(eid=eid, doi=doi_final or None)
                    # ORCID extraction (try scopus abstract JSON)
                    abs_json = fetch_abstract_by_eid_or_doi(eid=(scopus_meta.get("eid") or None), doi=doi_final or None)
                    if abs_json:
                        # look for orcid pattern anywhere
                        txt = json.dumps(abs_json)
                        m_orcid = re.search(r"\b(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])\b", txt)
                        if m_orcid:
                            orcid = m_orcid.group(1)
                else:
                    # not present in scopus: attempt CrossRef by title to get DOI/publisher/volume/issue/pages/date
                    cr = crossref_search_by_title(title, year)
                    doi_final = doi or (cr.get("DOI") if cr else "")
                    if cr:
                        publisher = cr.get("publisher") or ""
                        volume = volume or cr.get("volume") or ""
                        issue = issue or cr.get("issue") or ""
                        pages = pages or cr.get("page") or cr.get("article-number") or ""
                        if not date_of_publication:
                            issued = cr.get("issued", {}).get("date-parts") if isinstance(cr.get("issued", {}), dict) else None
                            if issued and isinstance(issued, list) and issued[0]:
                                date_of_publication = "-".join(str(x) for x in issued[0])
                scopus_verified = "YES" if (title in verification and verification.get(title)) else "NO"
                # build row according to required schema
                row = {
                    "sl_no": idx,
                    "author": author_profile or author_name_from_scholar(scholar_filled) or "",
                    "coauthor": coauthors,
                    "Journal Paper Title": title,
                    "JournalTitle": journal_title,
                    "JournalName": journal_name,
                    "Volume": volume,
                    "Issue": issue,
                    "Pages": pages,
                    "ArticleNumber": article_number,
                    "DateOfPublication": date_of_publication,
                    "Year": year,
                    "DOI": doi_final or (doi or ""),
                    "Publisher": publisher,
                    "SJR": sjr,
                    "Quartile": quartile,
                    "NumberOfCitations": citations if citations is not None else scopus_cites,
                    "IsConference": is_conf,
                    "ConferenceDate": conf_date,
                    "ConferenceLocation": conf_place,
                    "URL": url,
                    "h_index": author_h_index,
                    "i10_index": author_i10_index,
                    "total_citations": author_total_citations,
                    "document_count": author_document_count,
                    "ScopusVerified": scopus_verified,
                    "ORCID": orcid
                }
                rows.append(row)
                
                # Show progress for scholar publications
                if idx % 5 == 0 or idx == len(pubs):
                    display_progress_bar(idx, len(pubs), prefix='[PROGRESS] Processing Scholar publications', suffix=f'{idx}/{len(pubs)}')
                    
            except Exception:
                traceback.print_exc()
                continue

    # Add Scopus-only entries (that did not match any scholar title/doi)
    seen_titles = set(normalize_title_for_match(r["Journal Paper Title"]) for r in rows if r.get("Journal Paper Title"))
    sc_idx = len(rows) + 1
    
    if scopus_entries:
        scopus_only_count = len([e for e in scopus_entries if normalize_title_for_match(e.get("dc:title") or e.get("title") or "") not in seen_titles])
        print(f"\n[INFO] Processing {scopus_only_count} Scopus-only publications...")
        
        processed_count = 0
        for e in scopus_entries:
            try:
                title = e.get("dc:title") or e.get("title") or ""
                tnorm = normalize_title_for_match(title)
                if tnorm in seen_titles:
                    continue
                    
                journal_name = e.get("prism:publicationName", "") or ""
                # enrich scopus entry to fill missing fields
                enriched = enrich_scopus_entry(e, title_for_crossref=title)
                volume = e.get("prism:volume", "") or enriched.get("volume", "")
                issue = e.get("prism:issueIdentifier", "") or e.get("prism:issue", "") or enriched.get("issue", "")
                pages = e.get("prism:pageRange", "") or enriched.get("pages", "")
                article_number = extract_article_number(e) or enriched.get("article_number", "")
                date_of_pub = e.get("prism:coverDate", "") or enriched.get("date", "")
                year = str(date_of_pub).split("-")[0] if date_of_pub else ""
                doi = (e.get("prism:doi") or e.get("dc:identifier") or enriched.get("doi") or "") or ""
                publisher = e.get("prism:publisher", "") or enriched.get("publisher", "")
                sjr, quart = get_sjr_and_quartile(journal_name)
                citations = e.get("citedby-count", "") or ""
                authors_of_paper = parse_authors(e)
                is_conf = "YES" if (looks_like_conference_by_aggregation(e) or looks_like_conference_by_title(journal_name) or looks_like_conference_by_title(title)) else "NO"
                conf_date = ""
                conf_place = ""
                if is_conf:
                    eid = e.get("eid") or e.get("prism:eid") or ""
                    if isinstance(eid, str):
                        m = re.search(r"eid:(.+)", eid)
                        if m:
                            eid = m.group(1).strip()
                    conf_date, conf_place = fetch_conference_details_from_abstract(eid=eid, doi=doi)
                orcid = ""
                abs_json = fetch_abstract_by_eid_or_doi(eid=e.get("eid"), doi=doi)
                if abs_json:
                    txt = json.dumps(abs_json)
                    m_orcid = re.search(r"\b(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])\b", txt)
                    if m_orcid:
                        orcid = m_orcid.group(1)
                row = {
                    "sl_no": sc_idx,
                    "author": author_profile or "",
                    "coauthor": authors_of_paper,
                    "Journal Paper Title": title,
                    "JournalTitle": title,
                    "JournalName": journal_name,
                    "Volume": volume,
                    "Issue": issue,
                    "Pages": pages,
                    "ArticleNumber": article_number,
                    "DateOfPublication": date_of_pub,
                    "Year": year,
                    "DOI": doi,
                    "Publisher": publisher,
                    "SJR": sjr,
                    "Quartile": quart,
                    "NumberOfCitations": citations,
                    "IsConference": is_conf,
                    "ConferenceDate": conf_date,
                    "ConferenceLocation": conf_place,
                    "URL": e.get("prism:url") or "",
                    "h_index": author_h_index,
                    "i10_index": author_i10_index,
                    "total_citations": author_total_citations,
                    "document_count": author_document_count,
                    "ScopusVerified": "YES",
                    "ORCID": orcid
                }
                rows.append(row)
                sc_idx += 1
                processed_count += 1
                
                # Show progress for Scopus-only publications
                if processed_count % 5 == 0 or processed_count == scopus_only_count:
                    display_progress_bar(processed_count, scopus_only_count, prefix='[PROGRESS] Processing Scopus-only publications', suffix=f'{processed_count}/{scopus_only_count}')
                    
            except Exception:
                traceback.print_exc()
                continue

    return rows

# Helper to get author display name from scholar structure
def author_name_from_scholar(scholar_filled):
    if not scholar_filled or not isinstance(scholar_filled, dict):
        return ""
    return scholar_filled.get("name") or scholar_filled.get("fullname") or ""

# ----------------------------
# CSV + JSON output
# ----------------------------
def save_outputs(author_name, rows):
    """Save outputs using author name instead of Scopus ID"""
    # Sanitize author name for filename
    safe_name = sanitize_filename(author_name)
    csv_fn = f"{safe_name}.csv"
    json_fn = f"{safe_name}.json"
    
    # Header order exactly as requested
    fieldnames = [
        "sl_no", "author", "coauthor", "Journal Paper Title", "JournalTitle", "JournalName",
        "Volume", "Issue", "Pages", "ArticleNumber", "DateOfPublication", "Year",
        "DOI", "Publisher", "SJR", "Quartile", "NumberOfCitations",
        "IsConference", "ConferenceDate", "ConferenceLocation",
        "URL", "h_index", "i10_index", "total_citations", "document_count", "ScopusVerified", "ORCID"
    ]
    
    # Show progress for saving files
    print(f"\n[INFO] Saving data to {csv_fn}...")
    with open(csv_fn, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for i, r in enumerate(rows):
            out = {k: r.get(k, "") for k in fieldnames}
            writer.writerow(out)
            # Show progress for CSV writing
            if (i + 1) % 10 == 0 or (i + 1) == len(rows):
                display_progress_bar(i + 1, len(rows), prefix='[PROGRESS] Writing CSV', suffix=f'{i + 1}/{len(rows)}')
    
    print(f"\n[INFO] Saving data to {json_fn}...")
    with open(json_fn, "w", encoding="utf-8") as jf:
        json.dump(rows, jf, indent=2, ensure_ascii=False)
    
    print(f"\n[✔] CSV written: {csv_fn}")
    print(f"[✔] JSON written: {json_fn}")

# ----------------------------
# Main interactive flow
# ----------------------------
def select_faculty():
    print("\n" + "="*60)
    print("           MSRIT ACADEMIC DATA EXTRACTION TOOL")
    print("="*60 + "\n")
    print("\033[95m")
    print("███╗   ███╗███████╗██████╗ ██╗████████╗")
    print("████╗ ████║██╔════╝██╔══██╗██║╚══██╔══╝")
    print("██╔████╔██║███████╗██████╔╝██║   ██║   ")
    print("██║╚██╔╝██║╚════██║██╔══██╗██║   ██║   ")
    print("██║ ╚═╝ ██║███████║██║  ██║██║   ██║   ")
    print("╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ")
    # Add CSE in subscript effect (using smaller characters)
    print("\033[94m" + " " * 18 + "c s e" + "\033[0m")
    print("\033[95m" + "="*60 + "\033[0m")
    print("Select faculty to extract data:\n")
    for i, f in enumerate(FACULTY, start=1):
        print(f"{i:2d}. {f['name']}")
    print("\n 0. Exit")
    try:
        num = int(input("\nEnter number: ").strip())
    except Exception:
        return None
    if num <= 0 or num > len(FACULTY):
        return None
    return FACULTY[num - 1]

def main():
    start_time = time.time()
    
    # CLI override: allow calling with scopus_id and scholar_id
    if len(sys.argv) >= 3:
        scopus_id = sys.argv[1].strip()
        scholar_id = sys.argv[2].strip()
        selected = {"name": "Custom Faculty", "scopus_id": scopus_id, "scholar_id": scholar_id}
    elif len(sys.argv) == 2:
        scopus_id = sys.argv[1].strip()
        selected = next((f for f in FACULTY if f["scopus_id"] == scopus_id), None)
        if not selected:
            selected = {"name": "Custom Faculty", "scopus_id": scopus_id, "scholar_id": ""}
    else:
        selected = select_faculty()
        if not selected:
            print("No selection. Exiting.")
            return

    author_name = selected.get("name", "")
    scopus_id = selected.get("scopus_id", "")
    scholar_id = selected.get("scholar_id", "")

    print(f"\n[+] Target: {author_name}")
    print(f"[+] Scopus ID: {scopus_id or 'N/A'}")
    print(f"[+] Scholar ID: {scholar_id or 'N/A'}")
    
    # Fetch author metrics
    print("\n[+] Extracting author metrics...")
    author_metrics = get_combined_author_metrics(scopus_id, scholar_id)
    print(f"[✔] Author Metrics Extracted:")
    print(f"    h-index: {author_metrics.get('h_index', 'N/A')}")
    print(f"    i10-index: {author_metrics.get('i10_index', 'N/A')}")
    print(f"    Total Citations: {author_metrics.get('total_citations', 'N/A')}")
    if author_metrics.get('document_count'):
        print(f"    Document Count: {author_metrics.get('document_count')}")
    print()

    # Fetch Google Scholar
    scholar_filled = None
    if scholar_id and scholarly:
        try:
            print("[+] Accessing Google Scholar database...")
            scholar_filled = fetch_scholar_author_pubs(scholar_id)
            if scholar_filled:
                print("[✔] Scholar publications extracted.")
        except Exception as e:
            print(f"[!] Scholar extraction failed: {e}")
    elif not scholarly:
        print("[!] scholarly not installed; skipping scholar data.")

    # Fetch Scopus entries
    scopus_entries = []
    if scopus_id:
        try:
            print("[+] Fetching Scopus publications...")
            scopus_entries = fetch_scopus_author_pubs(scopus_id, per_page=25)
        except Exception as e:
            print(f"[!] Scopus extraction failed: {e}")

    # Build unified rows
    print("\n[+] Compiling extracted data...")
    rows = build_unified_rows(author_name, scholar_filled, scopus_entries, scopus_id, scholar_id)

    if not rows:
        print("[!] No data extracted.")
        return

    # Save outputs using author name
    print("\n[+] Writing data to files...")
    save_outputs(author_name, rows)
    
    # Calculate actual time taken
    end_time = time.time()
    actual_time = int(end_time - start_time)
    
    print(f"\n" + "="*60)
    print(f"[✔] MISSION ACCOMPLISHED!")
    print(f"[✔] Total time: {actual_time}s")
    print(f"[✔] Total records extracted: {len(rows)}")
    print(f"[✔] Files saved as:{sanitize_filename(author_name)}.{{csv,json}}")
    print("="*60)
    
    # Display blinking red warning
    display_warning()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Operation aborted by user.")
    except Exception as e:
        print(f"[!] Fatal error: {e}")
        traceback.print_exc()
