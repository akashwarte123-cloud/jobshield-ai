import unittest
import sys
import os
import json
from datetime import datetime, timezone, timedelta

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, Job, Analysis, AnalysisFlag
from app.utils.auth import generate_token

class HistoryAPITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Create two test users and their tokens
        self.user_a = User(name="User A", email="usera@example.com", password_hash="hash")
        self.user_b = User(name="User B", email="userb@example.com", password_hash="hash")
        db.session.add(self.user_a)
        db.session.add(self.user_b)
        db.session.commit()

        self.token_a = generate_token(self.user_a.id)
        self.token_b = generate_token(self.user_b.id)

        # Populate some job and analysis data for User A
        self.job_1 = Job(title="Job A1", company="Company A", description="Desc 1")
        self.job_2 = Job(title="Job A2", company="Company A", description="Desc 2")
        db.session.add(self.job_1)
        db.session.add(self.job_2)
        db.session.commit()

        # Add analyses
        self.analysis_1 = Analysis(
            job_id=self.job_1.id,
            user_id=self.user_a.id,
            ml_score=10,
            rule_score=20,
            final_score=14,
            risk_level="LOW",
            prediction="SAFE",
            confidence=0.0,
            model_version="1.0",
            explanation="Neutral test explanation",
            analyzed_at=datetime.now(timezone.utc) - timedelta(hours=1)
        )
        self.analysis_2 = Analysis(
            job_id=self.job_2.id,
            user_id=self.user_a.id,
            ml_score=80,
            rule_score=90,
            final_score=84,
            risk_level="CRITICAL",
            prediction="DANGER",
            confidence=0.0,
            model_version="1.0",
            explanation="Dangerous test explanation",
            analyzed_at=datetime.now(timezone.utc)
        )
        db.session.add(self.analysis_1)
        db.session.add(self.analysis_2)
        db.session.commit()

        # Add a flag to analysis_2
        self.flag = AnalysisFlag(
            analysis_id=self.analysis_2.id,
            category="upfront_payment",
            severity="critical",
            message="Upfront fee requested."
        )
        db.session.add(self.flag)
        db.session.commit()

        # Populate a job and analysis for User B
        self.job_b = Job(title="Job B1", company="Company B", description="Desc B")
        db.session.add(self.job_b)
        db.session.commit()

        self.analysis_b = Analysis(
            job_id=self.job_b.id,
            user_id=self.user_b.id,
            ml_score=30,
            rule_score=30,
            final_score=30,
            risk_level="MEDIUM",
            prediction="CAUTION",
            confidence=0.0,
            model_version="1.0",
            explanation="Medium danger test",
            analyzed_at=datetime.now(timezone.utc)
        )
        db.session.add(self.analysis_b)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_anonymous_requests_rejected(self):
        """Test that missing or invalid Auth token triggers HTTP 401."""
        response = self.client.get('/api/v1/analyses')
        self.assertEqual(response.status_code, 401)

        response = self.client.get(f'/api/v1/analyses/{self.analysis_1.id}')
        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_retrieves_own_history(self):
        """Test retrieving authenticated user A's scan history and newest-first order."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/analyses', headers=headers)
        self.assertEqual(response.status_code, 200)

        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertEqual(len(json_data["data"]["items"]), 2)

        # Ordering check: newest first
        # analysis_2 was analyzed at datetime.now(timezone.utc), analysis_1 is older
        first_item = json_data["data"]["items"][0]
        self.assertEqual(first_item["analysis_id"], self.analysis_2.id)
        self.assertEqual(first_item["job"]["title"], "Job A2")
        self.assertEqual(first_item["analysis"]["risk_level"], "CRITICAL")
        self.assertNotIn("description", first_item["job"]) # should not expose full job description

    def test_user_isolation_on_history(self):
        """Test that User A history does not include User B's record."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/analyses', headers=headers)
        json_data = response.get_json()

        item_ids = [item["analysis_id"] for item in json_data["data"]["items"]]
        self.assertNotIn(self.analysis_b.id, item_ids)

    def test_single_analysis_details(self):
        """Test detail visualization for owned analysis."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get(f'/api/v1/analyses/{self.analysis_2.id}', headers=headers)
        self.assertEqual(response.status_code, 200)

        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["analysis_id"], self.analysis_2.id)
        self.assertEqual(json_data["data"]["job"]["description"], "Desc 2") # includes description
        self.assertEqual(len(json_data["data"]["analysis"]["flags"]), 1)
        self.assertEqual(json_data["data"]["analysis"]["flags"][0]["category"], "upfront_payment")

    def test_user_cannot_access_another_user_analysis(self):
        """Test accessing another user's analysis yields clean 404."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        # User A tries to view User B's analysis
        response = self.client.get(f'/api/v1/analyses/{self.analysis_b.id}', headers=headers)
        self.assertEqual(response.status_code, 404)
        json_data = response.get_json()
        self.assertFalse(json_data["success"])
        self.assertEqual(json_data["error"]["code"], "NOT_FOUND")

    def test_pagination_and_invalid_params(self):
        """Test history pagination bounds."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        
        # Valid paginated query
        response = self.client.get('/api/v1/analyses?page=1&limit=1', headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()["data"]["items"]), 1)
        self.assertEqual(response.get_json()["data"]["pagination"]["pages"], 2)

        # Invalid page index
        response = self.client.get('/api/v1/analyses?page=0', headers=headers)
        self.assertEqual(response.status_code, 400)

        # Limit exceeds max
        response = self.client.get('/api/v1/analyses?limit=101', headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_risk_level_filtering(self):
        """Test history filtering by risk level."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # Filter HIGH -> expect 0 matches
        response = self.client.get('/api/v1/analyses?risk_level=HIGH', headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()["data"]["items"]), 0)

        # Filter CRITICAL -> expect 1 match (analysis_2)
        response = self.client.get('/api/v1/analyses?risk_level=CRITICAL', headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()["data"]["items"]), 1)

        # Invalid filter value
        response = self.client.get('/api/v1/analyses?risk_level=DANGEROUS', headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_nonexistent_analysis_returns_404(self):
        """Test single retrieval of fake analysis id returns 404."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/analyses/fake-uuid-string', headers=headers)
        self.assertEqual(response.status_code, 404)

    def test_delete_history_success_and_orphaning(self):
        """Test user A history deletion deletes user A analyses, flags, and orphaned jobs."""
        # Check initial state: User A has 2 analyses, 1 flag, and Job 1 & 2 exist
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        
        job_1_id = self.job_1.id
        job_2_id = self.job_2.id
        job_b_id = self.job_b.id
        
        response = self.client.delete('/api/v1/analyses/history', headers=headers_a)
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["analyses_deleted"], 2)
        self.assertEqual(json_data["data"]["flags_deleted"], 1)
        self.assertEqual(json_data["data"]["orphaned_jobs_deleted"], 2) # Job 1 & 2 are orphaned and deleted
        
        # Verify User A has 0 analyses left
        r_history = self.client.get('/api/v1/analyses', headers=headers_a)
        self.assertEqual(len(r_history.get_json()["data"]["items"]), 0)
        
        # Verify User B's history is untouched
        headers_b = {'Authorization': f'Bearer {self.token_b}'}
        r_history_b = self.client.get('/api/v1/analyses', headers=headers_b)
        self.assertEqual(len(r_history_b.get_json()["data"]["items"]), 1)
        
        # Verify Job B still exists in database
        self.assertIsNotNone(Job.query.get(job_b_id))
        
        # Verify Job 1 & 2 are deleted from database
        self.assertIsNone(Job.query.get(job_1_id))
        self.assertIsNone(Job.query.get(job_2_id))

    def test_delete_history_empty(self):
        """Test history deletion for a user with no scan history."""
        # Create a new user with no history
        new_user = User(name="User C", email="userc@example.com", password_hash="hash")
        db.session.add(new_user)
        db.session.commit()
        token_c = generate_token(new_user.id)
        
        headers = {'Authorization': f'Bearer {token_c}'}
        response = self.client.delete('/api/v1/analyses/history', headers=headers)
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["analyses_deleted"], 0)
        self.assertEqual(json_data["data"]["flags_deleted"], 0)
        self.assertEqual(json_data["data"]["orphaned_jobs_deleted"], 0)

    def test_delete_history_unauthenticated(self):
        """Test unauthenticated deletion is rejected with 401."""
        response = self.client.delete('/api/v1/analyses/history')
        self.assertEqual(response.status_code, 401)

    def test_delete_history_job_shared_referenced_elsewhere(self):
        """Test that a Job is NOT deleted if still referenced by another user's analysis or a saved job."""
        # Create a job and share it: User A and User B both analyze the same job URL
        shared_job = Job(title="Shared Job", company="Co", description="Shared description", source_url="http://shared-job.com")
        db.session.add(shared_job)
        db.session.commit()
        
        analysis_a = Analysis(
            job_id=shared_job.id, user_id=self.user_a.id,
            ml_score=10, rule_score=10, final_score=10,
            risk_level="LOW", prediction="SAFE", confidence=0.0,
            model_version="1.0", explanation="Exp"
        )
        analysis_b = Analysis(
            job_id=shared_job.id, user_id=self.user_b.id,
            ml_score=10, rule_score=10, final_score=10,
            risk_level="LOW", prediction="SAFE", confidence=0.0,
            model_version="1.0", explanation="Exp"
        )
        db.session.add(analysis_a)
        db.session.add(analysis_b)
        db.session.commit()
        
        analysis_a_id = analysis_a.id
        analysis_b_id = analysis_b.id
        shared_job_id = shared_job.id
        
        # User A deletes history
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.delete('/api/v1/analyses/history', headers=headers_a)
        self.assertEqual(response.status_code, 200)
        
        # Verify User A's analysis on shared job was deleted
        self.assertIsNone(Analysis.query.get(analysis_a_id))
        
        # Verify User B's analysis remains
        self.assertIsNotNone(Analysis.query.get(analysis_b_id))
        
        # Verify the shared Job is NOT deleted because User B's analysis still references it
        self.assertIsNotNone(Job.query.get(shared_job_id))

    def test_delete_history_job_shared_with_saved_job(self):
        """Test that a Job is NOT deleted if it is saved by any user."""
        # User A has an analysis on job_1 and also saves job_1
        from app.models import SavedJob
        saved_job = SavedJob(user_id=self.user_a.id, job_id=self.job_1.id)
        db.session.add(saved_job)
        db.session.commit()
        
        analysis_1_id = self.analysis_1.id
        job_1_id = self.job_1.id
        saved_job_id = saved_job.id
        
        # User A deletes history
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.delete('/api/v1/analyses/history', headers=headers_a)
        self.assertEqual(response.status_code, 200)
        
        # Verify analysis_1 is deleted
        self.assertIsNone(Analysis.query.get(analysis_1_id))
        
        # Verify job_1 still exists because of the saved job relationship
        self.assertIsNotNone(Job.query.get(job_1_id))
        
        # Verify saved job relationship remains valid
        self.assertIsNotNone(SavedJob.query.get(saved_job_id))

    def test_delete_history_rollback_on_failure(self):
        """Test that a failure in the deletion process rolls back all deletions."""
        from unittest.mock import patch
        
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        
        analysis_1_id = self.analysis_1.id
        analysis_2_id = self.analysis_2.id
        flag_id = self.flag.id
        job_1_id = self.job_1.id
        job_2_id = self.job_2.id
        
        # Mock database commit to raise an exception
        with patch('app.extensions.db.Session.commit', side_effect=Exception("Database Failure")):
            response = self.client.delete('/api/v1/analyses/history', headers=headers_a)
            self.assertEqual(response.status_code, 500)
            
            # Verify no analyses or flags were deleted from database
            self.assertIsNotNone(Analysis.query.get(analysis_1_id))
            self.assertIsNotNone(Analysis.query.get(analysis_2_id))
            self.assertIsNotNone(AnalysisFlag.query.get(flag_id))
            self.assertIsNotNone(Job.query.get(job_1_id))
            self.assertIsNotNone(Job.query.get(job_2_id))

    def test_domain_resolution_in_history_and_detail(self):
        """Test that domain is properly resolved from source, source_url, and flags."""
        from app.services.analysis_history_service import AnalysisHistoryService

        # 1. Job with source as domain
        job_source = Job(title="Dev", company="Corp", description="Desc", source="technovasolutions.example")
        self.assertEqual(AnalysisHistoryService.resolve_domain(job_source), "technovasolutions.example")

        # 2. Job with source_url
        job_url = Job(title="Dev", company="Corp", description="Desc", source_url="https://www.google.com/jobs/42")
        self.assertEqual(AnalysisHistoryService.resolve_domain(job_url), "google.com")

        # 3. Job with unverified_domain flag
        job_flag = Job(title="Dev", company="TechNova", description="Desc")
        flag = AnalysisFlag(
            category="unverified_domain",
            severity="medium",
            message="The employer's domain (@technovasolutions.example) is unverified or has low trust scores."
        )
        self.assertEqual(AnalysisHistoryService.resolve_domain(job_flag, flags=[flag]), "technovasolutions.example")

        # 4. Job with no domain info
        job_empty = Job(title="Dev", company="Local Shop", description="Desc")
        self.assertEqual(AnalysisHistoryService.resolve_domain(job_empty), "")

        # 5. Verify domain field in API response
        headers = {'Authorization': f'Bearer {self.token_a}'}
        self.job_1.source = "example.org"
        db.session.commit()

        resp = self.client.get(f'/api/v1/analyses/{self.analysis_1.id}', headers=headers)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["job"]["domain"], "example.org")
        self.assertEqual(data["data"]["analysis"]["domain"], "example.org")

    def test_salary_resolution_in_history_and_detail(self):
        """Test that salary is serialized properly and resolved from description if job.salary is empty."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # Case 1: job has explicit salary
        self.job_1.salary = "₹4.5–7 LPA"
        db.session.commit()

        resp = self.client.get(f'/api/v1/analyses/{self.analysis_1.id}', headers=headers)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["job"]["salary"], "₹4.5–7 LPA")

        # Case 2: job.salary is empty but description has salary
        self.job_2.salary = ""
        self.job_2.description = "Company: TechNova\nJob Type: Full-time\nSalary: ₹50,000/month\nDevelop Python apps."
        db.session.commit()

        resp2 = self.client.get(f'/api/v1/analyses/{self.analysis_2.id}', headers=headers)
        data2 = resp2.get_json()
        self.assertTrue(data2["success"])
        self.assertEqual(data2["data"]["job"]["salary"], "₹50,000/month")

        # Case 3: neither has salary -> None
        self.job_1.salary = ""
        self.job_1.description = "Standard technical role with no pay details."
        db.session.commit()

        resp3 = self.client.get(f'/api/v1/analyses/{self.analysis_1.id}', headers=headers)
        data3 = resp3.get_json()
        self.assertTrue(data3["success"])
        self.assertIsNone(data3["data"]["job"]["salary"])

if __name__ == '__main__':
    unittest.main()

