import os
import json
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List
from pathlib import Path
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.services.utils import sanitize_filename
from backend.services.cache import EXCEL_DIR, PDF_DIR

def generate_excel_report(author_name: str, rows: List[Dict[str, Any]]) -> str:
    safe_name = sanitize_filename(author_name)
    excel_path = EXCEL_DIR / f"{safe_name}.xlsx"
    
    df = pd.DataFrame(rows)
    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Publications", index=False)
        
    return str(excel_path)

def generate_pdf_report(author_name: str, metrics: Dict[str, Any], rows: List[Dict[str, Any]], author_info: Dict[str, Any]) -> str:
    safe_name = sanitize_filename(author_name)
    pdf_path = PDF_DIR / f"{safe_name}.pdf"
    
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=landscape(letter),
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=12
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#1F2937')
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10
    )

    elements = []

    # University Header
    elements.append(Paragraph("MSRIT Department of Computer Science & Engineering", title_style))
    elements.append(Paragraph(f"Academic Publication Portfolio & Analytics Report — {author_name}", subtitle_style))
    elements.append(Paragraph(f"Generated on: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", body_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#E43D12'), spaceAfter=14))

    # Faculty Profile & Identifiers Table
    elements.append(Paragraph("Faculty Profile & Identifiers", h2_style))
    prof_data = [
        ["Author Name:", author_name, "Department:", "Computer Science & Engineering"],
        ["Scopus ID:", author_info.get("scopus_id") or "N/A", "Scholar ID:", author_info.get("scholar_id") or "N/A"]
    ]
    t_prof = Table(prof_data, colWidths=[90, 260, 90, 260])
    t_prof.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#4B5563')),
        ('TEXTCOLOR', (2,0), (2,-1), colors.HexColor('#4B5563')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_prof)
    elements.append(Spacer(1, 12))

    # KPI Summary Table
    elements.append(Paragraph("Portfolio Metrics Summary", h2_style))
    kpi_data = [
        ["Total Publications", "Total Citations", "h-index", "i10-index", "Verified Scopus", "Journal / Conf"],
        [
            str(metrics.get("total_publications", len(rows))),
            str(metrics.get("total_citations", 0)),
            str(metrics.get("h_index", "0")),
            str(metrics.get("i10_index", "0")),
            str(metrics.get("verified_publications", 0)),
            f"{metrics.get('journal_papers', 0)} J / {metrics.get('conference_papers', 0)} C"
        ]
    ]
    t_kpi = Table(kpi_data, colWidths=[116]*6)
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#374151')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,1), 11),
        ('TEXTCOLOR', (0,1), (-1,1), colors.HexColor('#1E3A8A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 14))

    # Quartile Breakdown Table
    elements.append(Paragraph("Journal Quartile Distribution", h2_style))
    q_data = [
        ["Q1 Journals", "Q2 Journals", "Q3 Journals", "Q4 Journals"],
        [
            str(metrics.get("q1_journals", 0)),
            str(metrics.get("q2_journals", 0)),
            str(metrics.get("q3_journals", 0)),
            str(metrics.get("q4_journals", 0))
        ]
    ]
    t_q = Table(q_data, colWidths=[175]*4)
    t_q.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EFF6FF')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BFDBFE')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_q)
    elements.append(Spacer(1, 16))

    # Publications Table
    elements.append(Paragraph("Complete Publications Inventory (Top 40 Displayed)", h2_style))
    table_headers = ["#", "Title", "Year", "Journal / Conference", "Quartile", "Cites", "Verified"]
    table_data = [table_headers]
    
    for i, r in enumerate(rows[:40], start=1):
        title_p = Paragraph(str(r.get("Journal Paper Title") or r.get("JournalTitle") or "")[:90], cell_style)
        journal_p = Paragraph(str(r.get("JournalName") or r.get("JournalTitle") or "")[:60], cell_style)
        table_data.append([
            str(i),
            title_p,
            str(r.get("Year", "")),
            journal_p,
            str(r.get("Quartile", "N/A")),
            str(r.get("NumberOfCitations", "0")),
            str(r.get("ScopusVerified", "NO"))
        ])
        
    t_pubs = Table(table_data, colWidths=[25, 270, 40, 230, 50, 40, 45])
    t_pubs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('ALIGN', (2,1), (2,-1), 'CENTER'),
        ('ALIGN', (4,1), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_pubs)

    doc.build(elements)
    return str(pdf_path)
