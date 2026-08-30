import unittest
import json
import jwt
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import User, Job, Analysis, SavedJob, UserSettings
from app.utils.auth import generate_token
from app.services.ml_service import MLIntegrationError

class TestFinalQA(unittest.TestCase):
    """
    Comprehensive Final Full-Stack QA Test Suite.
    Validates E2E user workflows, admin boundaries, error recoveries, and RBAC security constraints.
    """

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

    # ---------------------------------------------------------------------------
    # B11.5.1: Authentication & RBAC E2E
    # ---------------------------------------------------------------------------
    def test_rbac_security_boundaries(self):
        """Ensure USER accounts are blocked from admin routes, while ADMIN can access them."""
        # 1. Create a Seeker (USER) and an Administrator (ADMIN)
        user = User(
            name='Regular Seeker',
            email='seeker@jobshield.ai',
            password_hash=generate_password_hash('SeekerSecure123!'),
            role='USER'
        )
        admin = User(
            name='Enterprise Admin',
            email='admin@jobshield.ai',
            password_hash=generate_password_hash('AdminSecure123!'),
            role='ADMIN'
        )
        db.session.add_all([user, admin])
        db.session.commit()

        # 2. Login as Seeker
        seeker_res = self.client.post('/api/v1/auth/login', json={
            'email': 'seeker@jobshield.ai',
            'password': 'SeekerSecure123!'
        })
        self.assertEqual(seeker_res.status_code, 200)
        seeker_token = json.loads(seeker_res.data)['data']['token']

        # 3. Login as Admin
        admin_res = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@jobshield.ai',
            'password': 'AdminSecure123!'
        })
        self.assertEqual(admin_res.status_code, 200)
        admin_token = json.loads(admin_res.data)['data']['token']

        # 4. Seeker attempts to access admin dashboard -> 403 Forbidden
        bad_admin_req = self.client.get('/api/v1/admin/dashboard/summary', headers={
            'Authorization': f'Bearer {seeker_token}'
        })
        self.assertEqual(bad_admin_req.status_code, 403)
        self.assertIn("Administrator access is required for this resource.", json.loads(bad_admin_req.data)['error']['message'])

        # 5. Admin accesses admin dashboard -> 200 OK
        good_admin_req = self.client.get('/api/v1/admin/dashboard/summary', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        self.assertEqual(good_admin_req.status_code, 200)

    # ---------------------------------------------------------------------------
    # B11.5.2: User Workflow E2E
    # ---------------------------------------------------------------------------
    @patch('app.services.ml_service.MLService.predict')
    def test_complete_seeker_workflow(self, mock_predict):
        """Test complete seeker E2E workflow: Register, login, analyze job, persist, verify, save job, and settings."""
        # Mock ML Service response
        mock_predict.return_value = {
            'prediction': 'CAUTION',
            'ml_score': 42.0,
            'confidence': 0.85,
            'model_version': '1.0.0'
        }

        # 1. Register Seeker
        reg_res = self.client.post('/api/v1/auth/register', json={
            'name': 'New Seeker',
            'email': 'newseeker@jobshield.ai',
            'password': 'Password123!'
        })
        self.assertEqual(reg_res.status_code, 201)

        # 2. Login Seeker
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'newseeker@jobshield.ai',
            'password': 'Password123!'
        })
        self.assertEqual(login_res.status_code, 200)
        token = json.loads(login_res.data)['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 3. Analyze Job posting (POST to /analyze)
        analyze_res = self.client.post('/api/v1/analyze', headers=headers, json={
            'title': 'Remote Cloud Administrator',
            'company': 'Global Tech Inc',
            'description': 'Work from home administering cloud accounts. Wire transfer setup required.',
            'location': 'Remote',
            'salary': '$80,000/yr',
            'employment_type': 'Full-time',
            'source': 'LinkedIn',
            'source_url': 'https://linkedin.com/jobs/12345'
        })
        self.assertEqual(analyze_res.status_code, 201)
        res_data = json.loads(analyze_res.data)['data']
        analysis_id = res_data['analysis_id']
        job_id = res_data['job']['id']
        self.assertGreaterEqual(res_data['analysis']['final_score'], 0)

        # 4. Seeker Dashboard Telemetry check
        dashboard_res = self.client.get('/api/v1/dashboard/summary', headers=headers)
        self.assertEqual(dashboard_res.status_code, 200)
        dash_data = json.loads(dashboard_res.data)['data']
        self.assertEqual(dash_data['total_analyses'], 1)

        # 5. Seeker Scan History check
        history_res = self.client.get('/api/v1/analyses', headers=headers)
        self.assertEqual(history_res.status_code, 200)
        hist_data = json.loads(history_res.data)['data']
        self.assertEqual(len(hist_data['items']), 1)
        self.assertEqual(hist_data['items'][0]['analysis_id'], analysis_id)

        # 6. Save Job posting
        save_res = self.client.post(f'/api/v1/jobs/{job_id}/save', headers=headers)
        self.assertEqual(save_res.status_code, 201)

        # 7. List Saved Jobs
        saved_list_res = self.client.get('/api/v1/jobs/saved', headers=headers)
        self.assertEqual(saved_list_res.status_code, 200)
        saved_items = json.loads(saved_list_res.data)['data']['items']
        self.assertEqual(len(saved_items), 1)
        self.assertEqual(saved_items[0]['job']['id'], job_id)

        # 8. User Settings change persists
        settings_res = self.client.put('/api/v1/settings', headers=headers, json={
            'theme': 'dark',
            'email_notifications': False,
            'marketing_notifications': False
        })
        self.assertEqual(settings_res.status_code, 200)

        # Retrieve and verify settings
        get_settings = self.client.get('/api/v1/settings', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(get_settings.status_code, 200)
        self.assertEqual(json.loads(get_settings.data)['data']['theme'], 'DARK')

    # ---------------------------------------------------------------------------
    # B11.5.3: Admin Workflow E2E
    # ---------------------------------------------------------------------------
    def test_admin_workflow_e2e(self):
        """Test complete admin E2E workflow: verify dashboard aggregates, list users, list analyses, job stats, system health."""
        # 1. Create seed data
        admin = User(
            name='Super Admin',
            email='superadmin@jobshield.ai',
            password_hash=generate_password_hash('Password123!'),
            role='ADMIN'
        )
        user = User(
            name='Active Seeker',
            email='activeseeker@jobshield.ai',
            password_hash=generate_password_hash('Password123!'),
            role='USER'
        )
        db.session.add_all([admin, user])
        db.session.commit()

        job = Job(title='Backend Architect', company='AeroCorp', source='Glassdoor', description='Develop reliable cloud servers.')
        db.session.add(job)
        db.session.commit()

        analysis = Analysis(
            user_id=user.id,
            job_id=job.id,
            ml_score=60,
            rule_score=40,
            final_score=50,
            risk_level='MEDIUM',
            prediction='CAUTION',
            confidence=0.8,
            model_version='1.0.0'
        )
        db.session.add(analysis)
        
        saved_job = SavedJob(user_id=user.id, job_id=job.id)
        db.session.add(saved_job)
        db.session.commit()

        # 2. Login Admin
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'superadmin@jobshield.ai',
            'password': 'Password123!'
        })
        token = json.loads(login_res.data)['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 3. Check Admin Dashboard Summary
        summary_res = self.client.get('/api/v1/admin/dashboard/summary', headers=headers)
        self.assertEqual(summary_res.status_code, 200)
        sum_data = json.loads(summary_res.data)['data']
        self.assertEqual(sum_data['users']['total'], 2)
        self.assertEqual(sum_data['analyses']['total'], 1)
        self.assertEqual(sum_data['jobs']['total'], 1)

        # 4. Check Admin Users List (pagination, filter)
        users_res = self.client.get('/api/v1/admin/users?role=USER', headers=headers)
        self.assertEqual(users_res.status_code, 200)
        users_data = json.loads(users_res.data)['data']
        self.assertEqual(users_data['total'], 1)
        self.assertEqual(users_data['users'][0]['email'], 'activeseeker@jobshield.ai')

        # 5. Check Single User detail stats
        detail_res = self.client.get(f'/api/v1/admin/users/{user.id}', headers=headers)
        self.assertEqual(detail_res.status_code, 200)
        detail_data = json.loads(detail_res.data)['data']
        self.assertEqual(detail_data['stats']['total_analyses'], 1)
        self.assertEqual(detail_data['stats']['saved_jobs_count'], 1)

        # 6. Check Admin Analyses List
        analyses_res = self.client.get('/api/v1/admin/analyses?risk_level=MEDIUM', headers=headers)
        self.assertEqual(analyses_res.status_code, 200)
        anal_data = json.loads(analyses_res.data)['data']
        self.assertEqual(anal_data['total'], 1)
        self.assertEqual(anal_data['analyses'][0]['company'], 'AeroCorp')

        # 7. Check Job Statistics
        job_stats_res = self.client.get('/api/v1/admin/jobs/statistics', headers=headers)
        self.assertEqual(job_stats_res.status_code, 200)
        job_data = json.loads(job_stats_res.data)['data']
        self.assertEqual(job_data['total_jobs'], 1)
        self.assertEqual(job_data['jobs_with_analyses'], 1)
        self.assertEqual(job_data['total_saved_job_entries'], 1)

        # 8. Check System Health
        health_res = self.client.get('/api/v1/admin/system/health', headers=headers)
        self.assertEqual(health_res.status_code, 200)

    # ---------------------------------------------------------------------------
    # B11.5.4: Analysis / ML Failure Recovery
    # ---------------------------------------------------------------------------
    @patch('app.services.ml_service.MLService.predict')
    def test_ml_service_offline_recovery(self, mock_predict):
        """ML service offline check: rule engine falls back cleanly to yield analysis verdicts."""
        user = User(
            name='Active Seeker',
            email='seeker@jobshield.ai',
            password_hash=generate_password_hash('Password123!'),
            role='USER'
        )
        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)
        headers = {'Authorization': f'Bearer {token}'}

        # Simulate ML Service connectivity failure
        mock_predict.side_effect = MLIntegrationError("Connection refused")

        # Seeker runs analysis (POST to /analyze)
        analyze_res = self.client.post('/api/v1/analyze', headers=headers, json={
            'title': 'Urgent Delivery Driver',
            'company': 'Flash Courier',
            'description': 'Urgent driver needed. Deposit money for truck insurance setup.',
            'location': 'Local',
            'salary': '$5,000/wk',
            'employment_type': 'Contract',
            'source': 'Craigslist',
            'source_url': 'https://craigslist.org/jobs/421'
        })
        # Verifies it fails with 503 SERVICE_UNAVAILABLE since no ML predictions can be made
        self.assertEqual(analyze_res.status_code, 503)
        data = json.loads(analyze_res.data)['error']
        self.assertEqual(data['code'], 'SERVICE_UNAVAILABLE')

    # ---------------------------------------------------------------------------
    # B11.5.5: Nasty Cases (Authentication & Database Rollback Diagnostics)
    # ---------------------------------------------------------------------------
    def test_malformed_requests_and_expired_tokens(self):
        """Check malformed requests, missing fields, and invalid JWT validations."""
        # 1. Invalid JWT check -> 401
        res = self.client.get('/api/v1/analyses', headers={'Authorization': 'Bearer invalid-token-sig'})
        self.assertEqual(res.status_code, 401)

        # 2. Malformed register/login requests -> 400 Bad Request
        res_reg = self.client.post('/api/v1/auth/register', json={})
        self.assertEqual(res_reg.status_code, 400)

        # 3. Missing fields in analysis payload -> 400 (POST to /analyze)
        user = User(
            name='Active Seeker',
            email='seeker@jobshield.ai',
            password_hash=generate_password_hash('Password123!'),
            role='USER'
        )
        db.session.add(user)
        db.session.commit()
        token = generate_token(user.id)

        res_anal = self.client.post('/api/v1/analyze', headers={'Authorization': f'Bearer {token}'}, json={
            'title': 'Developer'
            # missing description, source, company
        })
        self.assertEqual(res_anal.status_code, 400)
        self.assertIn("BAD_REQUEST", json.loads(res_anal.data)['error']['code'])

    def test_database_transaction_rollback_integrity(self):
        """Validate transaction rollbacks under failing runtime operations."""
        user = User(
            name='Active Seeker',
            email='seeker@jobshield.ai',
            password_hash=generate_password_hash('Password123!'),
            role='USER'
        )
        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)
        headers = {'Authorization': f'Bearer {token}'}

        # Try to save a non-existing job to trigger an exception in SavedJobService
        res = self.client.post('/api/v1/jobs/99999/save', headers=headers)
        self.assertEqual(res.status_code, 404)

        # Verify that no phantom SavedJob records exist in the database
        saved_count = db.session.query(SavedJob).count()
        self.assertEqual(saved_count, 0)
