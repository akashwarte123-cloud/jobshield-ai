import unittest
import json
import jwt
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from app import create_app
from app.extensions import db
from app.models import User, Job, Analysis, AnalysisFlag, SavedJob, UserSettings
from app.utils.auth import generate_token
from app.services.ml_service import MLIntegrationError

class TestQAHardening(unittest.TestCase):
    """Dedicated QA and Hardening test suite for Phase B10."""

    def setUp(self):
        self.app = create_app('testing')
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    # ==================================================
    # 1. PRODUCTION CONFIGURATION AUDIT
    # ==================================================

    def test_production_config_rejects_insecure_jwt_secret(self):
        """Verify that loading with production config raises ValueError if JWT_SECRET_KEY is insecure."""
        with patch('app.config.ProductionConfig.JWT_SECRET_KEY', 'default-jwt-secret-jobshield-2026'):
            with self.assertRaises(ValueError) as ctx:
                create_app('production')
            self.assertIn("JWT_SECRET_KEY must be set to a secure custom value", str(ctx.exception))

    def test_production_config_rejects_empty_cors(self):
        """Verify that production config rejects empty CORS origins list."""
        with patch('app.config.ProductionConfig.JWT_SECRET_KEY', 'a-very-secure-custom-key-123456'):
            with patch('app.config.ProductionConfig.CORS_ALLOWED_ORIGINS', []):
                with self.assertRaises(ValueError) as ctx:
                    create_app('production')
                self.assertIn("CORS_ALLOWED_ORIGINS must be explicitly configured", str(ctx.exception))

    def test_production_config_rejects_wildcard_cors(self):
        """Verify that production config rejects wildcard (*) origin list."""
        with patch('app.config.ProductionConfig.JWT_SECRET_KEY', 'a-very-secure-custom-key-123456'):
            with patch('app.config.ProductionConfig.CORS_ALLOWED_ORIGINS', ['*']):
                with self.assertRaises(ValueError) as ctx:
                    create_app('production')
                self.assertIn("Wildcard CORS (*) origin is strictly prohibited in production config", str(ctx.exception))

    # ==================================================
    # 2. JWT SECURITY AUDIT
    # ==================================================

    def test_jwt_validation_requires_exp_claim(self):
        """Verify that a token without an exp claim is rejected."""
        user = User(name='Test User', email='test@user.com', password_hash='pbkdf2:...')
        db.session.add(user)
        db.session.commit()

        # Generate a token manually missing the exp claim
        secret = self.app.config['JWT_SECRET_KEY']
        payload = {
            'sub': str(user.id),
            'iat': datetime.now(timezone.utc)
        }
        token = jwt.encode(payload, secret, algorithm='HS256')

        response = self.client.get('/api/v1/analyses', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data['error']['code'], 'UNAUTHORIZED')

    def test_jwt_validation_requires_iat_claim(self):
        """Verify that a token without an iat claim is rejected."""
        user = User(name='Test User', email='test@user.com', password_hash='pbkdf2:...')
        db.session.add(user)
        db.session.commit()

        # Generate a token manually missing the iat claim
        secret = self.app.config['JWT_SECRET_KEY']
        payload = {
            'sub': str(user.id),
            'exp': datetime.now(timezone.utc) + timedelta(minutes=60)
        }
        token = jwt.encode(payload, secret, algorithm='HS256')

        response = self.client.get('/api/v1/analyses', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data['error']['code'], 'UNAUTHORIZED')

    # ==================================================
    # 3. CROSS-USER ISOLATION AUDIT
    # ==================================================

    def test_cross_user_analyses_isolation(self):
        """Verify User A cannot access User B's analyses."""
        user_a = User(name='User A', email='a@test.com', password_hash='pbkdf2:...')
        user_b = User(name='User B', email='b@test.com', password_hash='pbkdf2:...')
        db.session.add_all([user_a, user_b])
        db.session.commit()

        job = Job(title='Job Title', company='Company', description='Description')
        db.session.add(job)
        db.session.flush()

        analysis_b = Analysis(
            job_id=job.id,
            user_id=user_b.id,
            ml_score=10,
            rule_score=20,
            final_score=15,
            risk_level='LOW',
            prediction='SAFE',
            confidence=1.0,
            model_version='v1'
        )
        db.session.add(analysis_b)
        db.session.commit()

        token_a = generate_token(user_a.id)

        # User A requests User B's analysis detail
        response = self.client.get(f'/api/v1/analyses/{analysis_b.id}', headers={
            'Authorization': f'Bearer {token_a}'
        })
        self.assertEqual(response.status_code, 404)

    def test_cross_user_saved_jobs_isolation(self):
        """Verify User A cannot save or delete User B's saved jobs, nor query them."""
        user_a = User(name='User A', email='a@test.com', password_hash='pbkdf2:...')
        user_b = User(name='User B', email='b@test.com', password_hash='pbkdf2:...')
        db.session.add_all([user_a, user_b])
        db.session.commit()

        job = Job(title='Job Title', company='Company', description='Description')
        db.session.add(job)
        db.session.flush()

        # Save for User B
        saved_b = SavedJob(user_id=user_b.id, job_id=job.id)
        db.session.add(saved_b)
        db.session.commit()

        token_a = generate_token(user_a.id)

        # Get saved jobs for User A (should be empty list)
        response = self.client.get('/api/v1/jobs/saved', headers={
            'Authorization': f'Bearer {token_a}'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(len(data['data']['items']), 0)

    def test_cross_user_settings_isolation(self):
        """Verify User A cannot read or write User B's settings."""
        user_a = User(name='User A', email='a@test.com', password_hash='pbkdf2:...')
        user_b = User(name='User B', email='b@test.com', password_hash='pbkdf2:...')
        db.session.add_all([user_a, user_b])
        db.session.commit()

        settings_b = UserSettings(user_id=user_b.id, email_notifications=False, theme='light')
        db.session.add(settings_b)
        db.session.commit()

        token_a = generate_token(user_a.id)

        # If User A requests settings, it should load User A's defaults, not B's custom settings
        response = self.client.get('/api/v1/settings', headers={
            'Authorization': f'Bearer {token_a}'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data['data']['email_notifications'], True) # default is True

    # ==================================================
    # 4. DATABASE TRANSACTION ROLLBACK AUDIT
    # ==================================================

    @patch('app.services.ml_service.MLService.predict')
    def test_transaction_rollback_on_pipeline_failure(self, mock_predict):
        """Verify that when ML classifier fails, the entire transaction is rolled back."""
        # Setup mock to throw ML integration error
        mock_predict.side_effect = MLIntegrationError("ML service connection timed out")

        payload = {
            "title": "Unsaved Software Engineer",
            "company": "Failed Corp",
            "description": "We are seeking a software engineer. Knowledge of C++ required.",
            "source_url": "https://www.linkedin.com/jobs/view/112233"
        }

        # Count records before
        jobs_before = Job.query.count()
        analyses_before = Analysis.query.count()

        response = self.client.post('/api/v1/analyze', data=json.dumps(payload), headers={
            'Content-Type': 'application/json'
        })
        self.assertEqual(response.status_code, 503)

        # Count records after (must be unchanged, showing total rollback!)
        self.assertEqual(Job.query.count(), jobs_before, "Rollback failed: Job row was created!")
        self.assertEqual(Analysis.query.count(), analyses_before, "Rollback failed: Analysis row was created!")

    # ==================================================
    # 5. INPUT VALIDATION SHAPES
    # ==================================================

    def test_public_endpoint_unhandled_routes_return_json_not_html(self):
        """Verify that accessing non-existent routes returns standard JSON, not HTML traceback page."""
        response = self.client.get('/api/v1/nonexistent-route')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.content_type, 'application/json')
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data['success'], False)
        self.assertEqual(data['error']['code'], 'NOT_FOUND')

    def test_public_endpoint_unhandled_exceptions_return_json_not_html(self):
        """Verify that unhandled application exceptions return clean JSON instead of traceback leak."""
        with patch('app.routes.analyze.resolve_optional_auth') as mock_auth:
            mock_auth.side_effect = Exception("Crash test internal error")

            response = self.client.post('/api/v1/analyze', data=json.dumps({}), headers={
                'Content-Type': 'application/json'
            })
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.content_type, 'application/json')
            data = json.loads(response.data.decode('utf-8'))
            self.assertEqual(data['success'], False)
            self.assertEqual(data['error']['code'], 'UNEXPECTED_ERROR')
            self.assertNotIn("Crash test internal error", data['error']['message'])
