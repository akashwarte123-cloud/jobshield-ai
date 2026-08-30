import io
import csv
from datetime import datetime, timezone
from xml.sax.saxutils import escape as xml_escape
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.pdfgen import canvas
from app.services.analysis_history_service import AnalysisHistoryService

class NumberedCanvas(canvas.Canvas):
    """Canvas for adding page numbers and running header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Top header rule
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 755, 572, 755)
        self.drawString(40, 760, "JobShield AI Security Analytics • Forensic Scan History Report")
        
        # Bottom footer rule
        self.line(40, 45, 572, 45)
        self.drawString(40, 32, "CONFIDENTIAL & PROPRIETARY — FOR PERSONAL & COMPLIANCE AUDITING ONLY")
        self.drawRightString(572, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


class ExportService:
    @classmethod
    def generate_csv(cls, analyses):
        """
        Generates RFC 4180 compliant CSV bytes from analysis models.
        Escapes commas, quotes, line breaks, and handles missing values.
        Prepends UTF-8 BOM (\ufeff) for seamless Microsoft Excel and Google Sheets compatibility.
        """
        output = io.StringIO()
        output.write('\ufeff')
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Header row
        writer.writerow([
            "Analysis ID",
            "Company",
            "Job Title",
            "Classification",
            "Risk Level",
            "Risk Score (0-100)",
            "Trust Score (0-100)",
            "Confidence (%)",
            "Domain",
            "Location",
            "Salary",
            "Employment Type",
            "Scan Date (UTC)",
            "Red Flags Found",
            "Flag Details",
            "Forensic Summary"
        ])

        for a in analyses:
            job = getattr(a, 'job', None)
            company = job.company if job else "Unknown Company"
            title = job.title if job else "Untitled Position"
            location = job.location if (job and job.location) else "N/A"
            salary = job.salary if (job and job.salary) else "Not disclosed"
            emp_type = job.employment_type if (job and job.employment_type) else "Full-time"
            
            # Extract domain cleanly
            domain = AnalysisHistoryService.resolve_domain(job, getattr(a, 'flags', []))
            if not domain:
                domain = "NOT AVAILABLE"
                
            # Date
            analyzed_at_str = a.analyzed_at.strftime("%Y-%m-%d %H:%M:%S UTC") if a.analyzed_at else "N/A"
            
            # Classification
            classification = a.prediction if a.prediction else "SAFE"
            if not a.prediction:
                if a.final_score >= 60:
                    classification = "DANGER"
                elif a.final_score >= 30:
                    classification = "CAUTION"
                else:
                    classification = "SAFE"

            # Flags summary
            flags = getattr(a, 'flags', [])
            flag_count = len(flags)
            flag_details = " | ".join([f"[{f.severity.upper()}] {f.category}: {f.message}" for f in flags]) if flags else "None"
            explanation = a.explanation or "No forensic narrative generated."

            writer.writerow([
                a.id,
                company,
                title,
                classification,
                a.risk_level,
                a.final_score,
                max(0, 100 - a.final_score),
                int(round(a.confidence * 100)) if a.confidence else 85,
                domain,
                location,
                salary,
                emp_type,
                analyzed_at_str,
                flag_count,
                flag_details,
                explanation
            ])

        return output.getvalue().encode('utf-8-sig')

    @classmethod
    def generate_pdf(cls, analyses, user_name="User"):
        """
        Generates publication-quality PDF bytes from user analysis models using ReportLab.
        Handles empty histories, XML escaping, color badges, and clean pagination.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=55,
            bottomMargin=55
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0F172A')
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569')
        )
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#0F766E'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#1E293B')
        )
        cell_sub = ParagraphStyle(
            'CellSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor('#64748B')
        )
        badge_style = ParagraphStyle(
            'Badge',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            alignment=1
        )

        story = []

        # Document Header
        story.append(Paragraph("JobShield AI Threat Intelligence", title_style))
        now_utc = datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')
        safe_user_name = xml_escape(str(user_name or "Valued User"))
        story.append(Paragraph(f"Scan History & Forensic Audit Dossier for {safe_user_name} • Generated {now_utc}", subtitle_style))
        story.append(Spacer(1, 12))

        # Metrics Summary Block
        total_scans = len(analyses)
        safe_count = sum(1 for a in analyses if a.final_score < 30)
        susp_count = sum(1 for a in analyses if 30 <= a.final_score < 60)
        scam_count = sum(1 for a in analyses if a.final_score >= 60)

        summary_data = [
            [
                Paragraph("<b>Total Scanned</b>", cell_sub),
                Paragraph("<b>Verified Safe</b>", cell_sub),
                Paragraph("<b>Suspicious</b>", cell_sub),
                Paragraph("<b>Scams Detected</b>", cell_sub)
            ],
            [
                Paragraph(f"<font size=14 color='#0F172A'><b>{total_scans}</b></font>", body_style),
                Paragraph(f"<font size=14 color='#16A34A'><b>{safe_count}</b></font>", body_style),
                Paragraph(f"<font size=14 color='#D97706'><b>{susp_count}</b></font>", body_style),
                Paragraph(f"<font size=14 color='#DC2626'><b>{scam_count}</b></font>", body_style)
            ]
        ]
        summary_table = Table(summary_data, colWidths=[133, 133, 133, 133])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 16))

        # Scan Records Table
        story.append(Paragraph("Scanned Job Records", section_style))

        if not analyses:
            empty_style = ParagraphStyle('Empty', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#64748B'), alignment=1)
            story.append(Spacer(1, 24))
            story.append(Paragraph("No scan history records found for this user account.", empty_style))
        else:
            table_headers = [
                Paragraph("<b>Date</b>", cell_sub),
                Paragraph("<b>Company / Job Title</b>", cell_sub),
                Paragraph("<b>Domain</b>", cell_sub),
                Paragraph("<b>Verdict</b>", cell_sub),
                Paragraph("<b>Scores</b>", cell_sub),
                Paragraph("<b>Flags & Key Evidence</b>", cell_sub),
            ]
            rows = [table_headers]

            for a in analyses:
                job = getattr(a, 'job', None)
                raw_company = job.company if job else "Unknown Company"
                raw_title = job.title if job else "Untitled Position"
                raw_domain = AnalysisHistoryService.resolve_domain(job, getattr(a, 'flags', [])) or "NOT AVAILABLE"
                date_str = a.analyzed_at.strftime("%b %d, %Y") if a.analyzed_at else "N/A"
                
                safe_company = xml_escape(raw_company)
                safe_title = xml_escape(raw_title)
                safe_domain = xml_escape(raw_domain)
                
                # Verdict badge formatting
                if a.final_score >= 60:
                    v_label = "SCAM"
                    v_color = "#DC2626"
                elif a.final_score >= 30:
                    v_label = "SUSPICIOUS"
                    v_color = "#D97706"
                else:
                    v_label = "SAFE"
                    v_color = "#16A34A"

                verdict_p = Paragraph(f"<font color='{v_color}'><b>{v_label}</b></font>", badge_style)
                
                comp_p = Paragraph(f"<b>{safe_company}</b><br/><font color='#475569'>{safe_title}</font>", body_style)
                domain_p = Paragraph(f"<font color='#0F766E'>{safe_domain}</font>", body_style)
                score_p = Paragraph(f"Risk: <b>{a.final_score}/100</b><br/><font color='#64748B'>Trust: {max(0, 100 - a.final_score)}</font>", body_style)
                
                flags = getattr(a, 'flags', [])
                if flags:
                    flag_items = []
                    for f in flags[:3]:
                        f_cat = xml_escape(f.category)
                        f_msg = xml_escape(f.message[:50] + "..." if len(f.message) > 50 else f.message)
                        flag_items.append(f"• <font color='#DC2626'><b>[{f_cat}]</b></font> {f_msg}")
                    
                    if len(flags) > 3:
                        flag_items.append(f"<font color='#64748B'><i>+{len(flags) - 3} more flags</i></font>")
                    flag_p = Paragraph("<br/>".join(flag_items), cell_sub)
                else:
                    flag_p = Paragraph("<font color='#16A34A'>✓ Zero threat indicators</font>", cell_sub)

                rows.append([
                    Paragraph(date_str, cell_sub),
                    comp_p,
                    domain_p,
                    verdict_p,
                    score_p,
                    flag_p
                ])

            # Column widths sum to 532 pt
            col_widths = [62, 120, 85, 65, 60, 140]
            records_table = Table(rows, colWidths=col_widths, repeatRows=1)
            records_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(records_table)

        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()
