import unittest
import sys
import os
from unittest.mock import patch, MagicMock

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, Job, Analysis, AnalysisFlag
from app.services import AnalysisService
from app.services.ml_service import MLIntegrationError

class AnalysisServiceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Create a mock user
        self.user = User(name="Test Analyst", email="analyst@test.com", password_hash="hash")
        db.session.add(self.user)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    @patch('app.services.ml_service.MLService.predict')
    def test_analyze_valid_authenticated_flow(self, mock_predict):
        """Test complete valid analysis flow for authenticated user."""
        mock_predict.return_value = {
            "prediction": "SAFE",
            "ml_score": 10,
            "confidence": None,
            "model_version": None
        }

        job_data = {
            "title": "Software Architect",
            "company": "JobShield Tech",
            "description": "Develop security applications. Duties include writing code. Require 5 years experience.",
            "source_url": "https://jobshield.com/architect",
            "salary": "₹20 LPA"
        }

        # Execute
        result = AnalysisService.analyze(job_data, user=self.user)

        # Assert returned format
        self.assertIn("analysis_id", result)
        self.assertEqual(result["job"]["title"], "Software Architect")
        self.assertEqual(result["analysis"]["prediction"], "SAFE")
        self.assertEqual(result["analysis"]["ml_score"], 10)
        self.assertEqual(result["analysis"]["rule_score"], 0)
        self.assertEqual(result["analysis"]["final_score"], 6) # 10 * 0.6 + 0 * 0.4 = 6
        self.assertEqual(result["analysis"]["risk_level"], "LOW")
        self.assertIn("Legitimate job", result["analysis"]["explanation"])

        # Verify DB records
        job = Job.query.filter_by(source_url="https://jobshield.com/architect").first()
        self.assertIsNotNone(job)
        self.assertEqual(job.title, "Software Architect")
        self.assertEqual(job.salary, "₹20 LPA")

        analysis = Analysis.query.filter_by(job_id=job.id).first()
        self.assertIsNotNone(analysis)
        self.assertEqual(analysis.user_id, self.user.id)
        self.assertEqual(analysis.final_score, 6)
        self.assertEqual(analysis.risk_level, "LOW")
        self.assertEqual(len(analysis.flags), 0)

    @patch('app.services.ml_service.MLService.predict')
    def test_analyze_anonymous_flow(self, mock_predict):
        """Test complete valid analysis flow for anonymous user (user=None)."""
        mock_predict.return_value = {
            "prediction": "SAFE",
            "ml_score": 20,
            "confidence": None,
            "model_version": None
        }

        job_data = {
            "title": "Data Operator",
            "description": "Enter text files. Duties: logs entry. Qualifications: none.",
            "source_url": ""
        }

        result = AnalysisService.analyze(job_data, user=None)
        self.assertEqual(result["analysis"]["flags"], [])

        # Verify DB
        analysis = Analysis.query.get(result["analysis_id"])
        self.assertIsNotNone(analysis)
        self.assertIsNone(analysis.user_id) # Anonymous analysis

    @patch('app.services.ml_service.MLService.predict')
    def test_explanation_and_flags_generation(self, mock_predict):
        """Test flags and custom explanation generation."""
        mock_predict.return_value = {
            "prediction": "DANGER",
            "ml_score": 60,
            "confidence": None,
            "model_version": None
        }

        # Triggers upfront_payment (50) and messaging_recruit (15) + combination A (15) = 80
        # final = 60 * 0.60 + 80 * 0.40 = 36 + 32 = 68 -> HIGH
        job_data = {
            "title": "Work from Home Typist",
            "company": "EarnQuick",
            "description": "Contact us exclusively on Telegram to get selection. Pay ₹1000 registration fee before typing."
        }

        result = AnalysisService.analyze(job_data)
        self.assertEqual(result["analysis"]["final_score"], 68)
        self.assertEqual(result["analysis"]["risk_level"], "HIGH")
        
        explanation = result["analysis"]["explanation"]
        self.assertIn("High risk:", explanation)
        self.assertIn("upfront payment", explanation)
        self.assertIn("messaging platforms", explanation)

        # Verify AnalysisFlags in DB
        flags = AnalysisFlag.query.filter_by(analysis_id=result["analysis_id"]).all()
        self.assertEqual(len(flags), 2)
        categories = {f.category for f in flags}
        self.assertIn("upfront_payment", categories)
        self.assertIn("messaging_recruit", categories)

    @patch('app.services.ml_service.MLService.predict')
    def test_job_reuse_by_source_url(self, mock_predict):
        """Test that Job records are reused by source_url without overwriting original fields."""
        mock_predict.return_value = {"prediction": "SAFE", "ml_score": 0, "confidence": None, "model_version": None}

        # Create original Job
        existing_job = Job(
            title="Original Title",
            company="Original Company",
            description="Original description text. Duties: maintain reports. Qualifications: college degree.",
            source_url="http://shared-url.com/job"
        )
        db.session.add(existing_job)
        db.session.commit()
        original_job_id = existing_job.id

        job_data = {
            "title": "New Title Claims",
            "company": "New Stated Company",
            "description": "New description text. Duties: maintain reports. Qualifications: college degree.",
            "source_url": "http://shared-url.com/job"
        }

        result = AnalysisService.analyze(job_data)

        # Check that existing Job ID is reused
        self.assertEqual(result["job"]["id"], original_job_id)

        # Verify Job in DB is NOT overwritten
        job = Job.query.get(original_job_id)
        self.assertEqual(job.title, "Original Title")
        self.assertEqual(job.company, "Original Company")

    @patch('app.services.ml_service.MLService.predict')
    def test_db_failure_rolls_back_everything(self, mock_predict):
        """Test transaction rollback on database insertion exception."""
        mock_predict.return_value = {"prediction": "SAFE", "ml_score": 0, "confidence": None, "model_version": None}

        job_data = {
            "title": "Database Test",
            "description": "Developer position. Responsibilities include coding. Requirements: Python.",
            "source_url": "http://rollback-test.com"
        }

        # Force a database failure on Analysis add by mock or patching commit to fail
        with patch('app.extensions.db.session.commit', side_effect=Exception("Database Write Error")):
            with self.assertRaises(Exception):
                AnalysisService.analyze(job_data)

            # Check that neither Job nor Analysis was saved (rollback succeeded)
            job = Job.query.filter_by(source_url="http://rollback-test.com").first()
            self.assertIsNone(job)

    @patch('app.services.ml_service.MLService.predict')
    def test_ml_integration_failure_propagates(self, mock_predict):
        """Test that MLService failures are propagated cleanly."""
        mock_predict.side_effect = MLIntegrationError("ML Server Offline")

        job_data = {
            "title": "ML Failure Test",
            "description": "Software position. Duties include web programming. Qualifications: HTML.",
            "source_url": "http://ml-failure.com"
        }

        with self.assertRaises(MLIntegrationError):
            AnalysisService.analyze(job_data)

        # Verify no orphan Job record is committed
        job = Job.query.filter_by(source_url="http://ml-failure.com").first()
        self.assertIsNone(job)

    def test_missing_required_validation(self):
        """Test service input validation raises ValueError."""
        # Missing description
        with self.assertRaises(ValueError) as context:
            AnalysisService.analyze({"title": "Test Title"})
        self.assertIn("description", str(context.exception))

    def test_validate_and_normalize_company_location_separation(self):
        """Test company name and location separation when pasted in merged format."""
        # Case 1: Company has "Location: Pune, Maharashtra, India" and location is empty
        job_data = {
            "title": "Junior Python Developer",
            "company": "TechNova Solutions Location: Pune, Maharashtra, India",
            "description": "Develop backend scripts using Python."
        }
        normalized = AnalysisService.validate_and_normalize(job_data)
        self.assertEqual(normalized["company"], "TechNova Solutions")
        self.assertEqual(normalized["location"], "Pune, Maharashtra, India")

        # Case 2: Location was default 'Remote', company has embedded Location
        job_data_remote = {
            "title": "Junior Python Developer",
            "company": "TechNova Solutions - Location: Pune, Maharashtra, India",
            "location": "Remote",
            "description": "Develop backend scripts using Python."
        }
        normalized_remote = AnalysisService.validate_and_normalize(job_data_remote)
        self.assertEqual(normalized_remote["company"], "TechNova Solutions")
        self.assertEqual(normalized_remote["location"], "Pune, Maharashtra, India")

        # Case 3: Explicit different location is preserved
        job_data_explicit = {
            "title": "Junior Python Developer",
            "company": "TechNova Solutions Location: Pune, India",
            "location": "Bengaluru, Karnataka, India",
            "description": "Develop backend scripts using Python."
        }
        normalized_explicit = AnalysisService.validate_and_normalize(job_data_explicit)
        self.assertEqual(normalized_explicit["company"], "TechNova Solutions")
        self.assertEqual(normalized_explicit["location"], "Bengaluru, Karnataka, India")

    def test_extract_domain(self):
        """Test AnalysisService.extract_domain for emails, URLs, and edge cases."""
        # 1. Recruiter email
        self.assertEqual(
            AnalysisService.extract_domain(email="careers@technovasolutions.example"),
            "technovasolutions.example"
        )
        # 2. URL with protocol, www, and path
        self.assertEqual(
            AnalysisService.extract_domain(url="https://www.google.com/careers/jobs"),
            "google.com"
        )
        # 3. URL with port and query params
        self.assertEqual(
            AnalysisService.extract_domain(url="http://microsoft.com:8080/jobs?id=123"),
            "microsoft.com"
        )
        # 4. Email priority when both provided
        self.assertEqual(
            AnalysisService.extract_domain(email="hr@stripe.com", url="https://stripe.com"),
            "stripe.com"
        )
        # 5. Empty/None
        self.assertEqual(AnalysisService.extract_domain(), "")
        self.assertEqual(AnalysisService.extract_domain(email=None, url=None), "")

    def test_extract_salary(self):
        """Test AnalysisService.extract_salary across all standard and Indian salary formats."""
        # 1. Rupee LPA range with en-dash / hyphen
        self.assertEqual(
            AnalysisService.extract_salary("Salary: ₹4.5–7 LPA"),
            "₹4.5–7 LPA"
        )
        # 2. Rupee single LPA
        self.assertEqual(
            AnalysisService.extract_salary("Salary: ₹5 LPA"),
            "₹5 LPA"
        )
        # 3. Unlabeled LPA range
        self.assertEqual(
            AnalysisService.extract_salary("We offer 4.5–7 LPA for this role."),
            "4.5–7 LPA"
        )
        # 4. Lakhs per annum
        self.assertEqual(
            AnalysisService.extract_salary("Compensation: 5 lakhs per annum"),
            "5 lakhs per annum"
        )
        # 5. Monthly rupee salary
        self.assertEqual(
            AnalysisService.extract_salary("Remuneration: ₹50,000/month"),
            "₹50,000/month"
        )
        # 6. INR prefix
        self.assertEqual(
            AnalysisService.extract_salary("INR 5 LPA"),
            "INR 5 LPA"
        )
        # 7. CTC labeled format
        self.assertEqual(
            AnalysisService.extract_salary("CTC: 6–8 LPA"),
            "6–8 LPA"
        )
        # 8. Western format
        self.assertEqual(
            AnalysisService.extract_salary("Base Pay: $120,000 - $140,000 / yr"),
            "$120,000 - $140,000 / yr"
        )
        # 9. Avoid false positives from experience, employee counts, and dates
        self.assertEqual(
            AnalysisService.extract_salary("Required: 3-5 years of experience. Team has 500+ employees. Founded in 2024."),
            ""
        )
        # 10. Empty or missing text
        self.assertEqual(AnalysisService.extract_salary(""), "")
        self.assertEqual(AnalysisService.extract_salary(None), "")

    def test_validate_and_normalize_salary_extraction(self):
        """Test that validate_and_normalize extracts salary from description if not provided."""
        job_data = {
            "title": "Junior Python Developer",
            "company": "TechNova Solutions",
            "location": "Pune, Maharashtra, India",
            "description": "Company: TechNova Solutions\nLocation: Pune, Maharashtra, India\nRecruiter Email: careers@technovasolutions.example\nJob Type: Full-time\nSalary: ₹4.5–7 LPA\n\nDevelop backend scripts."
        }
        normalized = AnalysisService.validate_and_normalize(job_data)
        self.assertEqual(normalized["salary"], "₹4.5–7 LPA")
        self.assertEqual(normalized["employment_type"], "Full-time")

if __name__ == '__main__':
    unittest.main()
