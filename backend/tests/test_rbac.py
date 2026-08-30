"""
B11.2.1 — RBAC Unit Tests
Covers:
  - Registration always assigns USER role regardless of client payload
  - /auth/me returns role field
  - /auth/login returns role field
  - require_admin permits ADMIN, denies USER, denies anonymous
"""
import unittest
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, UserSettings
from app.utils.auth import generate_token
from werkzeug.security import generate_password_hash
from flask import g


# ---------------------------------------------------------------------------
# Helper: minimal admin route to test require_admin decorator
# ---------------------------------------------------------------------------
def _register_test_admin_route(app):
    from app.utils.auth import require_auth, require_admin
    from flask import jsonify

    @app.route('/test/admin-only', methods=['GET'])
    @require_auth
    @require_admin
    def admin_only_view():
        return jsonify({"success": True, "message": "admin ok"}), 200


class RBACTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        _register_test_admin_route(self.app)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ------------------------------------------------------------------
    # Helper factories
    # ------------------------------------------------------------------
    def _create_user(self, email='user@example.com', role='USER'):
        u = User(
            name='Test User',
            email=email,
            password_hash=generate_password_hash('pass1234'),
            role=role
        )
        db.session.add(u)
        db.session.flush()
        db.session.add(UserSettings(user_id=u.id))
        db.session.commit()
        return u

    def _auth_header(self, user_id):
        token = generate_token(user_id)
        return {'Authorization': f'Bearer {token}'}

    # ------------------------------------------------------------------
    # 1. Registration always defaults to USER role
    # ------------------------------------------------------------------
    def test_registration_defaults_to_user_role(self):
        """A freshly registered account always gets the USER role."""
        resp = self.client.post('/api/v1/auth/register', json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "securepass1"
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertEqual(data['data']['user']['role'], 'USER')

        # Verify in DB
        user = User.query.filter_by(email='alice@example.com').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.role, 'USER')

    def test_registration_ignores_client_role_field(self):
        """Client cannot elevate their own role by sending role='ADMIN' during registration."""
        resp = self.client.post('/api/v1/auth/register', json={
            "name": "Evil Bob",
            "email": "evil@example.com",
            "password": "securepass2",
            "role": "ADMIN"        # <-- should be silently ignored
        })
        self.assertEqual(resp.status_code, 201)
        user = User.query.filter_by(email='evil@example.com').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.role, 'USER',
                         "Client-supplied role='ADMIN' must not be persisted.")

    # ------------------------------------------------------------------
    # 2. /auth/me returns role
    # ------------------------------------------------------------------
    def test_me_returns_role_for_user(self):
        """/auth/me must include role: USER for a normal account."""
        user = self._create_user()
        resp = self.client.get('/api/v1/auth/me',
                               headers=self._auth_header(user.id))
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('role', data['data'])
        self.assertEqual(data['data']['role'], 'USER')

    def test_me_returns_role_for_admin(self):
        """/auth/me must include role: ADMIN for an admin account."""
        admin = self._create_user(email='admin@example.com', role='ADMIN')
        resp = self.client.get('/api/v1/auth/me',
                               headers=self._auth_header(admin.id))
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data['data']['role'], 'ADMIN')

    # ------------------------------------------------------------------
    # 3. /auth/login returns role
    # ------------------------------------------------------------------
    def test_login_response_includes_role(self):
        """/auth/login must include role in the user envelope."""
        self._create_user(email='logintest@example.com', role='USER')
        resp = self.client.post('/api/v1/auth/login', json={
            "email": "logintest@example.com",
            "password": "pass1234"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn('role', data['data']['user'])
        self.assertEqual(data['data']['user']['role'], 'USER')

    # ------------------------------------------------------------------
    # 4. require_admin decorator
    # ------------------------------------------------------------------
    def test_admin_route_allows_admin_user(self):
        """An ADMIN user can access admin-only endpoints."""
        admin = self._create_user(email='admin2@example.com', role='ADMIN')
        resp = self.client.get('/test/admin-only',
                               headers=self._auth_header(admin.id))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.get_json()['success'])

    def test_admin_route_blocks_regular_user(self):
        """A USER-role account receives 403 on admin-only endpoints."""
        user = self._create_user(email='user2@example.com', role='USER')
        resp = self.client.get('/test/admin-only',
                               headers=self._auth_header(user.id))
        self.assertEqual(resp.status_code, 403)
        data = resp.get_json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'FORBIDDEN')

    def test_admin_route_blocks_anonymous(self):
        """Unauthenticated requests receive 401 on admin-only endpoints."""
        resp = self.client.get('/test/admin-only')
        self.assertEqual(resp.status_code, 401)

    # ------------------------------------------------------------------
    # 5. DB migration default: existing rows get USER role
    # ------------------------------------------------------------------
    def test_existing_rows_default_to_user(self):
        """Users created without explicit role get 'USER' as the column default."""
        # Insert without specifying role (relying on model default)
        u = User(
            name='Implicit Role',
            email='implicit@example.com',
            password_hash=generate_password_hash('pass5678')
            # role is intentionally omitted — should fall back to model default
        )
        db.session.add(u)
        db.session.commit()
        db.session.refresh(u)
        self.assertEqual(u.role, 'USER')


if __name__ == '__main__':
    unittest.main()
