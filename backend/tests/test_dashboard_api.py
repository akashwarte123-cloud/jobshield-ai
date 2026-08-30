import unittest
import sys
import os
import json
from datetime import datetime, timezone, timedelta

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, Job, Analysis
from app.utils.auth import generate_token

class DashboardAPITestCase(unittest.TestCase):
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

        # Create some jobs
        self.jobs = [
            Job(title=f"Job {i}", company="Company", description="Job details.")
            for i in range(10)
        ]
        for job in self.jobs:
            db.session.add(job)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_anonymous_requests_rejected(self):
        """Test anonymous request returns HTTP 401."""
        response = self.client.get('/api/v1/dashboard/summary')
        self.assertEqual(response.status_code, 401)

    def test_empty_user_dashboard(self):
        """Test empty database dashboard for a user returns zero statistics."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/dashboard/summary', headers=headers)
        self.assertEqual(response.status_code, 200)

        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        
        summary = json_data["data"]
        self.assertEqual(summary["total_analyses"], 0)
        self.assertEqual(summary["average_score"], 0.0)
        self.assertEqual(summary["risk_distribution"]["low"], 0)
        self.assertEqual(summary["risk_distribution"]["critical"], 0)
        self.assertEqual(summary["recent_analyses"], [])

    def test_populated_dashboard_calculations(self):
        """Test score average, risk group distribution, and recent analyses limiting."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # Add analyses for User A:
        # Final scores: 10 (LOW), 25 (LOW), 40 (MEDIUM), 70 (HIGH), 90 (CRITICAL), 95 (CRITICAL)
        # Average: (10 + 25 + 40 + 70 + 90 + 95) / 6 = 330 / 6 = 55.0
        # Distribution: LOW: 2, MEDIUM: 1, HIGH: 1, CRITICAL: 2
        # Let's add them
        scores_levels = [
            (10, "LOW"),
            (25, "LOW"),
            (40, "MEDIUM"),
            (70, "HIGH"),
            (90, "CRITICAL"),
            (95, "CRITICAL")
        ]

        for i, (score, level) in enumerate(scores_levels):
            analysis = Analysis(
                job_id=self.jobs[i].id,
                user_id=self.user_a.id,
                ml_score=score,
                rule_score=score,
                final_score=score,
                risk_level=level,
                prediction="SAFE" if score < 40 else "DANGER",
                confidence=0.0,
                model_version="1.0",
                analyzed_at=datetime.now(timezone.utc) - timedelta(minutes=(10 - i))
            )
            db.session.add(analysis)

        # Add 1 analysis for User B to verify data isolation
        analysis_b = Analysis(
            job_id=self.jobs[6].id,
            user_id=self.user_b.id,
            ml_score=100,
            rule_score=100,
            final_score=100,
            risk_level="CRITICAL",
            prediction="DANGER",
            confidence=0.0,
            model_version="1.0",
            analyzed_at=datetime.now(timezone.utc)
        )
        db.session.add(analysis_b)
        db.session.commit()

        # Query dashboard
        response = self.client.get('/api/v1/dashboard/summary', headers=headers)
        self.assertEqual(response.status_code, 200)

        json_data = response.get_json()
        summary = json_data["data"]

        # Counts check
        self.assertEqual(summary["total_analyses"], 6) # Excludes user B
        self.assertEqual(summary["average_score"], 55.0)

        # Distribution check
        dist = summary["risk_distribution"]
        self.assertEqual(dist["low"], 2)
        self.assertEqual(dist["medium"], 1)
        self.assertEqual(dist["high"], 1)
        self.assertEqual(dist["critical"], 2)

        # Weekly trends check
        self.assertIn("weekly_trends", summary)
        self.assertEqual(len(summary["weekly_trends"]), 7)
        for trend in summary["weekly_trends"]:
            self.assertIn("day", trend)
            self.assertIn("scans", trend)
            self.assertIn("threats", trend)

        # Recent analyses check: limited to 5
        self.assertEqual(len(summary["recent_analyses"]), 5)

        # Verify ordering check: most recent first (starts with 95, i.e., score 95 CRITICAL)
        self.assertEqual(summary["recent_analyses"][0]["analysis"]["final_score"], 95)

if __name__ == '__main__':
    unittest.main()
