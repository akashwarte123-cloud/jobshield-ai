import unittest
import sys
import os
import json

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, Job, SavedJob
from app.utils.auth import generate_token

class SavedJobsAPITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Users and tokens
        self.user_a = User(name="User A", email="usera@example.com", password_hash="hash")
        self.user_b = User(name="User B", email="userb@example.com", password_hash="hash")
        db.session.add(self.user_a)
        db.session.add(self.user_b)
        db.session.commit()

        self.token_a = generate_token(self.user_a.id)
        self.token_b = generate_token(self.user_b.id)

        # Create jobs
        self.job_1 = Job(title="Backend Dev", company="Infosys", description="Write code.")
        self.job_2 = Job(title="Frontend Dev", company="Wipro", description="Write HTML.")
        db.session.add(self.job_1)
        db.session.add(self.job_2)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_anonymous_requests_rejected(self):
        """Test authentication requirement."""
        # Save
        response = self.client.post(f'/api/v1/jobs/{self.job_1.id}/save')
        self.assertEqual(response.status_code, 401)
        # Delete
        response = self.client.delete(f'/api/v1/jobs/{self.job_1.id}/save')
        self.assertEqual(response.status_code, 401)
        # Get
        response = self.client.get('/api/v1/jobs/saved')
        self.assertEqual(response.status_code, 401)

    def test_save_job_successfully_and_idempotency(self):
        """Test authenticated user saves job and repeated save requests are idempotent."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # 1st Save
        response = self.client.post(f'/api/v1/jobs/{self.job_1.id}/save', headers=headers)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.get_json()["success"])

        # Check entry exists in DB
        saved = SavedJob.query.filter_by(user_id=self.user_a.id, job_id=self.job_1.id).first()
        self.assertIsNotNone(saved)

        # 2nd Save (Idempotent call)
        response2 = self.client.post(f'/api/v1/jobs/{self.job_1.id}/save', headers=headers)
        self.assertEqual(response2.status_code, 201) # Idempotent save returns success
        
        # Verify only 1 entry remains in database
        saved_count = SavedJob.query.filter_by(user_id=self.user_a.id, job_id=self.job_1.id).count()
        self.assertEqual(saved_count, 1)

    def test_remove_saved_job_successfully_and_idempotency(self):
        """Test unsave job removes entry, and repeated unsave calls are safe."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # Save first
        saved_job = SavedJob(user_id=self.user_a.id, job_id=self.job_1.id)
        db.session.add(saved_job)
        db.session.commit()

        # 1st Delete
        response = self.client.delete(f'/api/v1/jobs/{self.job_1.id}/save', headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["success"])

        # DB assert
        saved = SavedJob.query.filter_by(user_id=self.user_a.id, job_id=self.job_1.id).first()
        self.assertIsNone(saved)

        # 2nd Delete (idempotency check)
        response2 = self.client.delete(f'/api/v1/jobs/{self.job_1.id}/save', headers=headers)
        self.assertEqual(response2.status_code, 200) # Safe idempotent return

    def test_user_isolation_on_saved_jobs(self):
        """Test that User A saved jobs do not overlap or expose User B's saved jobs."""
        # Save job_1 for User A
        saved_a = SavedJob(user_id=self.user_a.id, job_id=self.job_1.id)
        db.session.add(saved_a)
        
        # Save job_2 for User B
        saved_b = SavedJob(user_id=self.user_b.id, job_id=self.job_2.id)
        db.session.add(saved_b)
        db.session.commit()

        # Query User A saved list
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/jobs/saved', headers=headers_a)
        self.assertEqual(response.status_code, 200)
        
        items = response.get_json()["data"]["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["job"]["id"], self.job_1.id)

    def test_save_nonexistent_job_returns_404(self):
        """Test saving a fake job ID returns 404."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.post('/api/v1/jobs/fake-job-uuid/save', headers=headers)
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.get_json()["success"])

if __name__ == '__main__':
    unittest.main()
