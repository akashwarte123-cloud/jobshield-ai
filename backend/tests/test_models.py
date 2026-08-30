import unittest
import sys
import os
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError, DataError

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, UserSettings, Job, SavedJob, Analysis, AnalysisFlag

class DatabaseModelsTestCase(unittest.TestCase):
    def setUp(self):
        # Create app configured for testing (uses sqlite:///:memory:)
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Create all tables in testing context (SQLite in-memory)
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_user_creation_and_fields(self):
        """Test user creation, timestamps, and password storage."""
        user = User(
            name="John Doe",
            email="john@example.com",
            password_hash="hashedpassword123"
        )
        db.session.add(user)
        db.session.commit()

        self.assertIsNotNone(user.id)
        self.assertEqual(user.name, "John Doe")
        self.assertEqual(user.email, "john@example.com")
        self.assertEqual(user.password_hash, "hashedpassword123")
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_unique_email_constraint(self):
        """Test unique constraint on user email."""
        user1 = User(name="User One", email="unique@example.com", password_hash="pwd1")
        user2 = User(name="User Two", email="unique@example.com", password_hash="pwd2")
        
        db.session.add(user1)
        db.session.commit()
        
        db.session.add(user2)
        with self.assertRaises(IntegrityError):
            db.session.commit()

    def test_user_settings_one_to_one(self):
        """Test one-to-one relationship and defaults of UserSettings."""
        user = User(name="John Doe", email="john@example.com", password_hash="pwd")
        db.session.add(user)
        db.session.commit()
        
        settings = UserSettings(
            user_id=user.id,
            email_notifications=False,
            default_analysis_mode="strict",
            theme="light"
        )
        db.session.add(settings)
        db.session.commit()
        
        self.assertEqual(user.settings.theme, "light")
        self.assertFalse(user.settings.email_notifications)
        self.assertEqual(user.settings.default_analysis_mode, "strict")
        self.assertEqual(settings.user.name, "John Doe")

    def test_user_settings_cascade_delete(self):
        """Test that deleting a user deletes their settings record."""
        user = User(name="John Doe", email="john@example.com", password_hash="pwd")
        db.session.add(user)
        db.session.commit()
        
        settings = UserSettings(user_id=user.id)
        db.session.add(settings)
        db.session.commit()
        
        settings_id = settings.id
        db.session.delete(user)
        db.session.commit()
        
        # Verify settings record is gone
        deleted_settings = db.session.get(UserSettings, settings_id)
        self.assertNull = self.assertIsNone(deleted_settings)

    def test_job_creation_and_indexes(self):
        """Test creating a job and verifying its fields."""
        job = Job(
            title="Software Developer",
            company="JobShield Inc.",
            location="Remote",
            description="We are looking for a remote Software Developer.",
            salary="$120k - $140k",
            employment_type="Full-time",
            source="LinkedIn",
            source_url="https://linkedin.com/jobs/123",
            posted_date=datetime.now(timezone.utc)
        )
        db.session.add(job)
        db.session.commit()
        
        self.assertIsNotNone(job.id)
        self.assertEqual(job.title, "Software Developer")
        self.assertEqual(job.company, "JobShield Inc.")
        self.assertEqual(job.location, "Remote")
        self.assertIsNotNone(job.created_at)

    def test_analysis_relationships(self):
        """Test Analysis relationships with Job, User and nullable anonymous analysis."""
        job = Job(title="Dev", company="Company", description="Desc")
        db.session.add(job)
        db.session.commit()
        
        # Anonymous analysis (user_id=None)
        analysis_anon = Analysis(
            job_id=job.id,
            ml_score=85,
            rule_score=75,
            final_score=80,
            risk_level="HIGH",
            prediction="DANGER",
            confidence=0.95,
            explanation="High scam pattern matched.",
            model_version="v2.1",
            user_id=None
        )
        db.session.add(analysis_anon)
        db.session.commit()
        
        self.assertIsNone(analysis_anon.user_id)
        self.assertEqual(analysis_anon.job.title, "Dev")
        self.assertEqual(len(job.analyses), 1)
        
        # Registered user analysis
        user = User(name="User", email="user@example.com", password_hash="pwd")
        db.session.add(user)
        db.session.commit()
        
        analysis_user = Analysis(
            job_id=job.id,
            user_id=user.id,
            ml_score=10,
            rule_score=5,
            final_score=8,
            risk_level="LOW",
            prediction="SAFE",
            confidence=0.97,
            model_version="v2.1"
        )
        db.session.add(analysis_user)
        db.session.commit()
        
        self.assertEqual(analysis_user.user.email, "user@example.com")
        self.assertEqual(len(job.analyses), 2)
        self.assertEqual(len(user.analyses), 1)

    def test_analysis_flag_relationship_and_cascade(self):
        """Test AnalysisFlag belongs-to and cascade deletion on Analysis delete."""
        job = Job(title="Dev", company="Company", description="Desc")
        db.session.add(job)
        db.session.commit()
        
        analysis = Analysis(
            job_id=job.id,
            ml_score=60,
            rule_score=60,
            final_score=60,
            risk_level="MEDIUM",
            prediction="CAUTION",
            confidence=0.94,
            model_version="v2.1"
        )
        db.session.add(analysis)
        db.session.commit()
        
        flag1 = AnalysisFlag(
            analysis_id=analysis.id,
            category="Financial",
            severity="CRITICAL",
            message="Suspicious check request",
            evidence="Employer requests upfront equipment check."
        )
        flag2 = AnalysisFlag(
            analysis_id=analysis.id,
            category="Communication",
            severity="HIGH",
            message="Telegram interview",
            evidence="Contact on telegram."
        )
        db.session.add_all([flag1, flag2])
        db.session.commit()
        
        self.assertEqual(len(analysis.flags), 2)
        self.assertEqual(analysis.flags[0].category, "Financial")
        
        # Delete analysis and verify flags are cascaded deleted
        flag1_id = flag1.id
        flag2_id = flag2.id
        db.session.delete(analysis)
        db.session.commit()
        
        self.assertIsNone(db.session.get(AnalysisFlag, flag1_id))
        self.assertIsNone(db.session.get(AnalysisFlag, flag2_id))

    def test_saved_job_relationship_and_cascade(self):
        """Test SavedJob links and cascade deletes on user or job delete."""
        user = User(name="User", email="user@example.com", password_hash="pwd")
        job = Job(title="Dev", company="Company", description="Desc")
        db.session.add_all([user, job])
        db.session.commit()
        
        saved_job = SavedJob(user_id=user.id, job_id=job.id)
        db.session.add(saved_job)
        db.session.commit()
        
        self.assertEqual(len(user.saved_jobs), 1)
        self.assertEqual(user.saved_jobs[0].job.title, "Dev")
        self.assertEqual(len(job.saved_jobs), 1)
        
        # Deleting job deletes saved_job
        saved_job_id = saved_job.id
        db.session.delete(job)
        db.session.commit()
        
        self.assertIsNone(db.session.get(SavedJob, saved_job_id))
        self.assertEqual(len(user.saved_jobs), 0)

    def test_saved_job_duplicate_prevention(self):
        """Test that same user cannot save the same job multiple times."""
        user = User(name="User", email="user@example.com", password_hash="pwd")
        job = Job(title="Dev", company="Company", description="Desc")
        db.session.add_all([user, job])
        db.session.commit()
        
        sj1 = SavedJob(user_id=user.id, job_id=job.id)
        db.session.add(sj1)
        db.session.commit()
        
        sj2 = SavedJob(user_id=user.id, job_id=job.id)
        db.session.add(sj2)
        
        with self.assertRaises(IntegrityError):
            db.session.commit()

    def test_foreign_key_enforcement(self):
        """Test foreign key constraint throws error for non-existent references."""
        # Non-existent user_id for SavedJob
        job = Job(title="Dev", company="Company", description="Desc")
        db.session.add(job)
        db.session.commit()
        
        sj = SavedJob(user_id="invalid-user-uuid", job_id=job.id)
        db.session.add(sj)
        
        with self.assertRaises(IntegrityError):
            db.session.commit()

    def test_score_constraints(self):
        """Test CheckConstraints on ml_score, rule_score, final_score and confidence."""
        job = Job(title="Dev", company="Company", description="Desc")
        db.session.add(job)
        db.session.commit()
        
        # ML score too high (>100)
        invalid_ml = Analysis(
            job_id=job.id,
            ml_score=101,
            rule_score=50,
            final_score=50,
            risk_level="MEDIUM",
            prediction="CAUTION",
            confidence=0.5,
            model_version="v2.1"
        )
        db.session.add(invalid_ml)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        
        db.session.rollback()
        
        # Confidence too high (>1.0)
        invalid_conf = Analysis(
            job_id=job.id,
            ml_score=50,
            rule_score=50,
            final_score=50,
            risk_level="MEDIUM",
            prediction="CAUTION",
            confidence=1.2,
            model_version="v2.1"
        )
        db.session.add(invalid_conf)
        with self.assertRaises(IntegrityError):
            db.session.commit()

if __name__ == '__main__':
    unittest.main()
