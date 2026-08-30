import unittest
import sys
import os
import json
import csv
import io

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, Job, Analysis, AnalysisFlag
from app.utils.auth import generate_token
from app.services.export_service import ExportService

class ExportTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.client = self.app.test_client()

        # User A
        self.user_a = User(id="user-a-1234", email="usera@test.com", password_hash="hash")
        setattr(self.user_a, 'name', 'Alice Tester')
        
        # User B
        self.user_b = User(id="user-b-5678", email="userb@test.com", password_hash="hash")
        setattr(self.user_b, 'name', 'Bob Private')

        db.session.add_all([self.user_a, self.user_b])
        db.session.commit()

        self.token_a = generate_token(self.user_a.id)
        self.token_b = generate_token(self.user_b.id)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_unauthenticated_export_denied(self):
        """Ensure endpoints strictly enforce authentication (401)."""
        endpoints = ['/api/v1/analyses/export/csv', '/api/v1/analyses/export/pdf', '/api/v1/analyses/export?format=csv']
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 401)

    def test_export_csv_with_records_and_isolation(self):
        """Verify CSV generation, user isolation, and RFC 4180 escaping."""
        # Create job & analysis for User A with tricky characters
        job_a = Job(
            id="job-a-1",
            title="Senior Engineer, Full-Stack & DevOps <Remote>",
            company='Acme Corp "Special", Inc.',
            location="New York, NY",
            salary="$120,000 - $140,000 / year",
            employment_type="Full-time",
            source="careers.acme.example",
            description="Great opportunity with commas, quotes, and newlines."
        )
        analysis_a = Analysis(
            id="analysis-a-1",
            user_id=self.user_a.id,
            job_id=job_a.id,
            ml_score=25,
            rule_score=20,
            final_score=22,
            risk_level="LOW",
            prediction="SAFE",
            confidence=0.92,
            explanation="Legitimate corporate posting.",
            model_version="1.0"
        )

        # Create job & analysis for User B
        job_b = Job(
            id="job-b-1",
            title="Confidential Secret Project Lead",
            company="Classified Syndicate",
            location="Remote",
            salary="$500/hr",
            employment_type="Contract",
            source="secret.example",
            description="Confidential posting."
        )
        analysis_b = Analysis(
            id="analysis-b-1",
            user_id=self.user_b.id,
            job_id=job_b.id,
            ml_score=95,
            rule_score=90,
            final_score=95,
            risk_level="CRITICAL",
            prediction="DANGER",
            confidence=0.98,
            explanation="Blatant scam.",
            model_version="1.0"
        )
        flag_b = AnalysisFlag(
            id="flag-b-1",
            analysis_id=analysis_b.id,
            category="upfront_payment",
            severity="CRITICAL",
            message="Demands $100 registration fee"
        )

        db.session.add_all([job_a, analysis_a, job_b, analysis_b, flag_b])
        db.session.commit()

        # User A requests CSV
        res = self.client.get(
            '/api/v1/analyses/export/csv',
            headers={'Authorization': f'Bearer {self.token_a}'}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)
        self.assertIn('attachment', res.headers.get('Content-Disposition', ''))

        csv_text = res.data.decode('utf-8-sig')
        reader = csv.reader(io.StringIO(csv_text))
        rows = list(reader)

        self.assertEqual(len(rows), 2)  # Header + 1 record
        self.assertIn("Senior Engineer, Full-Stack & DevOps <Remote>", rows[1][2])
        self.assertIn('Acme Corp "Special", Inc.', rows[1][1])

        # Verify User B data is NOT leaked to User A
        self.assertNotIn("Confidential Secret Project Lead", csv_text)
        self.assertNotIn("Classified Syndicate", csv_text)

    def test_export_pdf_with_records_and_validation(self):
        """Verify publication-quality PDF is generated with %PDF- and %%EOF."""
        job = Job(
            id="job-scam-1",
            title="Data Entry Assistant (High Pay)",
            company="FastCash LLC",
            location="Online",
            salary="$75/hr",
            employment_type="Part-time",
            source="telegram-recruiter.example",
            description="Telegram interview required. Purchase $200 equipment."
        )
        analysis = Analysis(
            id="analysis-scam-1",
            user_id=self.user_a.id,
            job_id=job.id,
            ml_score=90,
            rule_score=95,
            final_score=95,
            risk_level="CRITICAL",
            prediction="DANGER",
            confidence=0.96,
            explanation="High-risk scam detected with multiple compounding signals.",
            model_version="1.0"
        )
        flag = AnalysisFlag(
            id="flag-scam-1",
            analysis_id=analysis.id,
            category="upfront_payment",
            severity="CRITICAL",
            message="Equipment purchase required before starting"
        )
        db.session.add_all([job, analysis, flag])
        db.session.commit()

        res = self.client.get(
            '/api/v1/analyses/export/pdf',
            headers={'Authorization': f'Bearer {self.token_a}'}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn('application/pdf', res.content_type)
        self.assertIn('attachment', res.headers.get('Content-Disposition', ''))
        self.assertTrue(res.data.startswith(b'%PDF-'))
        self.assertIn(b'%%EOF', res.data[-200:])

    def test_export_empty_history(self):
        """Verify clean empty state for a user with zero scans."""
        # CSV
        res_csv = self.client.get(
            '/api/v1/analyses/export/csv',
            headers={'Authorization': f'Bearer {self.token_a}'}
        )
        self.assertEqual(res_csv.status_code, 200)
        rows = list(csv.reader(io.StringIO(res_csv.data.decode('utf-8-sig'))))
        self.assertEqual(len(rows), 1)  # Only header row

        # PDF
        res_pdf = self.client.get(
            '/api/v1/analyses/export/pdf',
            headers={'Authorization': f'Bearer {self.token_a}'}
        )
        self.assertEqual(res_pdf.status_code, 200)
        self.assertTrue(res_pdf.data.startswith(b'%PDF-'))
        self.assertIn(b'%%EOF', res_pdf.data[-200:])

if __name__ == '__main__':
    unittest.main()
