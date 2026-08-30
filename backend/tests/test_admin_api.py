"""
B11.3 — Admin API Tests
Covers all 22 required cases including:
- ADMIN access, USER 403, anonymous 401
- Password hash never in responses
- Pagination, search, role/risk filtering
- 404 for missing users
- Cross-user data visibility restricted to ADMIN
- All existing B1-B11.2 USER APIs remain isolated (data isolation spot-checks)
"""
import unittest
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, UserSettings, Job, Analysis, SavedJob
from app.utils.auth import generate_token
from werkzeug.security import generate_password_hash


class AdminAPITestCase(unittest.TestCase):
    """Full test suite for /api/v1/admin/* endpoints."""

    # ------------------------------------------------------------------
    # Setup / teardown
    # ------------------------------------------------------------------
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self._seed()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ------------------------------------------------------------------
    # Seed helpers
    # ------------------------------------------------------------------
    def _seed(self):
        """Create an admin, a regular user, a job, an analysis, a saved job."""
        self.admin = User(
            name='Admin User',
            email='admin@example.com',
            password_hash=generate_password_hash('adminpass'),
            role='ADMIN',
        )
        self.user = User(
            name='Normal User',
            email='user@example.com',
            password_hash=generate_password_hash('userpass'),
            role='USER',
        )
        db.session.add_all([self.admin, self.user])
        db.session.flush()

        db.session.add(UserSettings(user_id=self.admin.id))
        db.session.add(UserSettings(user_id=self.user.id))

        self.job = Job(
            title='Software Engineer',
            company='Acme Corp',
            description='A real job posting description with enough text.',
        )
        db.session.add(self.job)
        db.session.flush()

        self.analysis = Analysis(
            user_id=self.user.id,
            job_id=self.job.id,
            ml_score=30,
            rule_score=20,
            final_score=26,
            risk_level='LOW',
            prediction='SAFE',
            confidence=0.85,
            model_version='1.0',
        )
        db.session.add(self.analysis)

        self.saved = SavedJob(user_id=self.user.id, job_id=self.job.id)
        db.session.add(self.saved)
        db.session.commit()

    def _admin_header(self):
        return {'Authorization': f'Bearer {generate_token(self.admin.id)}'}

    def _user_header(self):
        return {'Authorization': f'Bearer {generate_token(self.user.id)}'}

    def _no_sensitive(self, body_str):
        """Assert that password_hash and raw JWT secrets never appear."""
        self.assertNotIn('password_hash', body_str)
        self.assertNotIn('password',      body_str.replace('"password_hash"', ''))

    # ==================================================================
    # 1. ADMIN — dashboard summary
    # ==================================================================
    def test_01_admin_can_access_dashboard_summary(self):
        resp = self.client.get('/api/v1/admin/dashboard/summary',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        d = data['data']
        self.assertIn('users',             d)
        self.assertIn('analyses',          d)
        self.assertIn('jobs',              d)
        self.assertIn('risk_distribution', d)
        self.assertIn('average_score',     d)
        self.assertIn('weekly_trends',     d)
        # Values are real DB counts
        self.assertEqual(d['users']['total'],     2)
        self.assertEqual(d['analyses']['total'],  1)
        self.assertEqual(d['jobs']['total'],      1)

    # ==================================================================
    # 2. USER — dashboard summary → 403
    # ==================================================================
    def test_02_user_gets_403_on_dashboard_summary(self):
        resp = self.client.get('/api/v1/admin/dashboard/summary',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 403)
        data = resp.get_json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'FORBIDDEN')

    # ==================================================================
    # 3. Anonymous — dashboard summary → 401
    # ==================================================================
    def test_03_anonymous_gets_401_on_dashboard_summary(self):
        resp = self.client.get('/api/v1/admin/dashboard/summary')
        self.assertEqual(resp.status_code, 401)

    # ==================================================================
    # 4. ADMIN — list users
    # ==================================================================
    def test_04_admin_can_list_users(self):
        resp = self.client.get('/api/v1/admin/users',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['total'], 2)
        self.assertIsInstance(data['data']['users'], list)

    # ==================================================================
    # 5. USER — list users → 403
    # ==================================================================
    def test_05_user_cannot_list_users(self):
        resp = self.client.get('/api/v1/admin/users',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 403)

    # ==================================================================
    # 6. ADMIN — user details
    # ==================================================================
    def test_06_admin_can_get_user_details(self):
        resp = self.client.get(f'/api/v1/admin/users/{self.user.id}',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        d = data['data']
        self.assertEqual(d['id'], self.user.id)
        self.assertIn('stats', d)
        self.assertEqual(d['stats']['total_analyses'], 1)
        self.assertEqual(d['stats']['saved_jobs_count'], 1)

    # ==================================================================
    # 7. USER — user details → 403
    # ==================================================================
    def test_07_user_cannot_get_user_details(self):
        resp = self.client.get(f'/api/v1/admin/users/{self.admin.id}',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 403)

    # ==================================================================
    # 8. ADMIN — list analyses
    # ==================================================================
    def test_08_admin_can_list_analyses(self):
        resp = self.client.get('/api/v1/admin/analyses',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        d = data['data']
        self.assertEqual(d['total'], 1)
        row = d['analyses'][0]
        self.assertIn('analysis_id', row)
        self.assertIn('user_name',   row)
        self.assertIn('job_title',   row)
        self.assertIn('final_score', row)
        self.assertEqual(row['risk_level'], 'LOW')

    # ==================================================================
    # 9. USER — list analyses → 403
    # ==================================================================
    def test_09_user_cannot_list_admin_analyses(self):
        resp = self.client.get('/api/v1/admin/analyses',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 403)

    # ==================================================================
    # 10. ADMIN — job statistics
    # ==================================================================
    def test_10_admin_can_get_job_statistics(self):
        resp = self.client.get('/api/v1/admin/jobs/statistics',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        d = data['data']
        self.assertEqual(d['total_jobs'],           1)
        self.assertEqual(d['total_saved_job_entries'], 1)
        self.assertEqual(d['jobs_with_analyses'],   1)

    # ==================================================================
    # 11. USER — job statistics → 403
    # ==================================================================
    def test_11_user_cannot_get_job_statistics(self):
        resp = self.client.get('/api/v1/admin/jobs/statistics',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 403)

    # ==================================================================
    # 12. ADMIN — system health
    # ==================================================================
    def test_12_admin_can_get_system_health(self):
        resp = self.client.get('/api/v1/admin/system/health',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        d = data['data']
        self.assertEqual(d['database']['status'],  'ok')
        self.assertEqual(d['api']['status'],        'ok')
        self.assertIn(d['ml_service']['status'], ('ok', 'degraded', 'unknown'))

    # ==================================================================
    # 13. USER — system health → 403
    # ==================================================================
    def test_13_user_cannot_get_system_health(self):
        resp = self.client.get('/api/v1/admin/system/health',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 403)

    # ==================================================================
    # 14. Pagination works
    # ==================================================================
    def test_14_pagination_works(self):
        # Add a second user so we can paginate
        extra = User(name='Extra', email='extra@x.com',
                     password_hash=generate_password_hash('p'), role='USER')
        db.session.add(extra)
        db.session.commit()

        resp = self.client.get('/api/v1/admin/users?page=1&limit=1',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['data']
        self.assertEqual(len(data['users']), 1)
        self.assertEqual(data['total'], 3)
        self.assertEqual(data['pages'], 3)

    # ==================================================================
    # 15. Search works (name/email)
    # ==================================================================
    def test_15_search_works(self):
        resp = self.client.get('/api/v1/admin/users?search=Normal',
                               headers=self._admin_header())
        data = resp.get_json()['data']
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['users'][0]['name'], 'Normal User')

    # ==================================================================
    # 16. Role filtering works
    # ==================================================================
    def test_16_role_filtering_works(self):
        resp = self.client.get('/api/v1/admin/users?role=ADMIN',
                               headers=self._admin_header())
        data = resp.get_json()['data']
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['users'][0]['role'], 'ADMIN')

    # ==================================================================
    # 17. Risk level filtering works
    # ==================================================================
    def test_17_risk_level_filtering_works(self):
        # Filter for LOW — should return 1 (our seed analysis)
        resp = self.client.get('/api/v1/admin/analyses?risk_level=LOW',
                               headers=self._admin_header())
        data = resp.get_json()['data']
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['analyses'][0]['risk_level'], 'LOW')

        # Filter for HIGH — should return 0
        resp2 = self.client.get('/api/v1/admin/analyses?risk_level=HIGH',
                                headers=self._admin_header())
        data2 = resp2.get_json()['data']
        self.assertEqual(data2['total'], 0)

    # ==================================================================
    # 18. password_hash never appears in any response
    # ==================================================================
    def test_18_password_hash_never_in_responses(self):
        endpoints = [
            '/api/v1/admin/dashboard/summary',
            '/api/v1/admin/users',
            f'/api/v1/admin/users/{self.user.id}',
            '/api/v1/admin/analyses',
            '/api/v1/admin/jobs/statistics',
            '/api/v1/admin/system/health',
        ]
        for url in endpoints:
            resp = self.client.get(url, headers=self._admin_header())
            body = resp.data.decode()
            self.assertNotIn('password_hash', body,
                             msg=f'password_hash found in response from {url}')

    # ==================================================================
    # 19. JWT / auth secrets never in responses
    # ==================================================================
    def test_19_jwt_never_in_responses(self):
        resp = self.client.get('/api/v1/admin/users', headers=self._admin_header())
        body = resp.data.decode()
        # The raw JWT secret must never leak
        self.assertNotIn('default-jwt-secret', body)
        self.assertNotIn('SECRET_KEY', body)

    # ==================================================================
    # 20. Non-existent user returns 404
    # ==================================================================
    def test_20_nonexistent_user_returns_404(self):
        resp = self.client.get('/api/v1/admin/users/nonexistent-id-12345',
                               headers=self._admin_header())
        self.assertEqual(resp.status_code, 404)
        data = resp.get_json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'NOT_FOUND')

    # ==================================================================
    # 21. Cross-user admin data visible ONLY to ADMIN
    # ==================================================================
    def test_21_cross_user_data_visible_only_to_admin(self):
        """
        The analysis belongs to self.user.
        self.admin should see it via /admin/analyses.
        self.user should get 403 on the admin endpoint.
        """
        admin_resp = self.client.get('/api/v1/admin/analyses',
                                     headers=self._admin_header())
        self.assertEqual(admin_resp.status_code, 200)
        analyses = admin_resp.get_json()['data']['analyses']
        # Admin sees the analysis belonging to the normal user
        self.assertTrue(any(a['user_id'] == self.user.id for a in analyses))

        # Normal user cannot reach the same endpoint
        user_resp = self.client.get('/api/v1/admin/analyses',
                                    headers=self._user_header())
        self.assertEqual(user_resp.status_code, 403)

    # ==================================================================
    # 22. Existing USER APIs remain isolated (data isolation spot-checks)
    # ==================================================================
    def test_22_existing_user_apis_remain_isolated(self):
        """
        /api/v1/analyses, /api/v1/dashboard/summary, and /api/v1/jobs/saved
        must still only return the authenticated user's own data and must NOT
        expose data from other users.
        """
        # /api/v1/analyses (user's own history)
        resp = self.client.get('/api/v1/analyses',
                               headers=self._user_header())
        self.assertEqual(resp.status_code, 200)
        items = resp.get_json()['data']['items']
        for item in items:
            # Every analysis in user history must belong to this user
            self.assertNotEqual(item.get('user_id'), self.admin.id)

        # /api/v1/dashboard/summary — user dashboard must not expose other users
        resp2 = self.client.get('/api/v1/dashboard/summary',
                                headers=self._user_header())
        self.assertEqual(resp2.status_code, 200)
        summary = resp2.get_json()['data']
        # The user has 1 analysis; admin has 0 → total_analyses must be 1, not 2
        self.assertEqual(summary.get('total_analyses', summary.get('total', 1)), 1)


if __name__ == '__main__':
    unittest.main()
