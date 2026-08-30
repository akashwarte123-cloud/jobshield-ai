import unittest
import sys
import os
import json
import jwt
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from werkzeug.security import check_password_hash

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, UserSettings
from app.utils.auth import generate_token

class AuthenticationTestCase(unittest.TestCase):
    def setUp(self):
        # Create app configured for testing (uses sqlite:///:memory:)
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Create all tables in testing context
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_valid_registration(self):
        """Test valid user registration creates both User and default UserSettings."""
        response = self.client.post('/api/v1/auth/register', json={
            "name": "Test User",
            "email": "register_test@example.com",
            "password": "securepassword123"
        })
        self.assertEqual(response.status_code, 201)
        
        json_data = response.get_json()
        self.assertTrue(json_data.get('success'))
        self.assertIn('data', json_data)
        self.assertIn('user', json_data['data'])
        self.assertEqual(json_data['data']['user']['name'], "Test User")
        self.assertEqual(json_data['data']['user']['email'], "register_test@example.com")
        self.assertNotIn('password_hash', json_data['data']['user'])
        
        # Verify in database
        user = User.query.filter_by(email="register_test@example.com").first()
        self.assertIsNotNone(user)
        self.assertTrue(check_password_hash(user.password_hash, "securepassword123"))
        
        # Verify default settings created
        self.assertIsNotNone(user.settings)
        self.assertTrue(user.settings.email_notifications)
        self.assertEqual(user.settings.theme, "dark")

    def test_registration_validation_errors(self):
        """Test registration validation for name, email, and password."""
        # Missing name
        r = self.client.post('/api/v1/auth/register', json={
            "email": "test@example.com", "password": "password123"
        })
        self.assertEqual(r.status_code, 400)
        self.assertFalse(r.get_json()['success'])
        
        # Invalid email format
        r = self.client.post('/api/v1/auth/register', json={
            "name": "Test", "email": "bademail", "password": "password123"
        })
        self.assertEqual(r.status_code, 400)
        self.assertIn("format", r.get_json()['error']['message'])
        
        # Short password
        r = self.client.post('/api/v1/auth/register', json={
            "name": "Test", "email": "test@example.com", "password": "short"
        })
        self.assertEqual(r.status_code, 400)
        self.assertIn("at least 8 characters", r.get_json()['error']['message'])

    def test_registration_duplicate_email(self):
        """Test registration prevents duplicate emails."""
        self.client.post('/api/v1/auth/register', json={
            "name": "User One", "email": "duplicate@example.com", "password": "password123"
        })
        
        r = self.client.post('/api/v1/auth/register', json={
            "name": "User Two", "email": "duplicate@example.com", "password": "password123"
        })
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.get_json()['error']['code'], "CONFLICT")

    def test_registration_transaction_rollback_on_settings_failure(self):
        """Test that if UserSettings creation fails, User is not saved."""
        # Mock database session commit or trigger failure during UserSettings flush/commit
        # We can simulate this by forcing settings save to fail (e.g. user_id=None constraint violation)
        # We will patch UserSettings class instantiation or db.session.add for settings to throw an exception
        with patch('app.routes.auth.UserSettings', side_effect=Exception("Simulated Settings Error")):
            r = self.client.post('/api/v1/auth/register', json={
                "name": "Rollback User", "email": "rollback@example.com", "password": "password123"
            })
            self.assertEqual(r.status_code, 500)
            
            # Verify user was NOT created in DB due to rollback
            user = User.query.filter_by(email="rollback@example.com").first()
            self.assertIsNone(user)

    def test_valid_login(self):
        """Test valid user login generates a valid JWT."""
        # Register user
        self.client.post('/api/v1/auth/register', json={
            "name": "Login User", "email": "login_test@example.com", "password": "securepassword123"
        })
        
        # Login
        response = self.client.post('/api/v1/auth/login', json={
            "email": "login_test@example.com", "password": "securepassword123"
        })
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data.get('success'))
        self.assertIn('token', json_data['data'])
        self.assertEqual(json_data['data']['user']['email'], "login_test@example.com")

    def test_invalid_login_credentials(self):
        """Test login fails with generic error for incorrect password or non-existent email."""
        # Incorrect password
        self.client.post('/api/v1/auth/register', json={
            "name": "Login User", "email": "login_test@example.com", "password": "securepassword123"
        })
        
        r = self.client.post('/api/v1/auth/login', json={
            "email": "login_test@example.com", "password": "wrongpassword"
        })
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.get_json()['error']['message'], "Invalid email address or password.")
        
        # Non-existent account
        r = self.client.post('/api/v1/auth/login', json={
            "email": "nonexistent@example.com", "password": "password123"
        })
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.get_json()['error']['message'], "Invalid email address or password.")

    def test_me_endpoint_access(self):
        """Test GET /api/v1/auth/me access control."""
        # 1. Unauthenticated request
        response = self.client.get('/api/v1/auth/me')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()['error']['code'], "UNAUTHORIZED")
        
        # 2. Authenticated request
        self.client.post('/api/v1/auth/register', json={
            "name": "Me User", "email": "me_test@example.com", "password": "securepassword123"
        })
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "me_test@example.com", "password": "securepassword123"
        })
        token = login_res.get_json()['data']['token']
        
        headers = {'Authorization': f'Bearer {token}'}
        response = self.client.get('/api/v1/auth/me', headers=headers)
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data.get('success'))
        self.assertEqual(json_data['data']['email'], "me_test@example.com")
        self.assertEqual(json_data['data']['name'], "Me User")
        self.assertIn('created_at', json_data['data'])

    def test_jwt_validation_errors(self):
        """Test token validation handles malformed, invalid, and expired tokens."""
        # Malformed format (no Bearer)
        headers = {'Authorization': 'BadToken12345'}
        r = self.client.get('/api/v1/auth/me', headers=headers)
        self.assertEqual(r.status_code, 401)
        self.assertIn("format", r.get_json()['error']['message'])
        
        # Invalid signature / token
        headers = {'Authorization': 'Bearer invalid.token.signature'}
        r = self.client.get('/api/v1/auth/me', headers=headers)
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.get_json()['error']['code'], "UNAUTHORIZED")

    def test_jwt_expiration(self):
        """Test that expired tokens are correctly rejected with custom message."""
        # Create expired token manually
        secret = self.app.config['JWT_SECRET_KEY']
        payload = {
            'exp': datetime.now(timezone.utc) - timedelta(minutes=5),
            'iat': datetime.now(timezone.utc) - timedelta(minutes=10),
            'sub': 'some-user-id'
        }
        expired_token = jwt.encode(payload, secret, algorithm='HS256')
        
        headers = {'Authorization': f'Bearer {expired_token}'}
        r = self.client.get('/api/v1/auth/me', headers=headers)
        self.assertEqual(r.status_code, 401)
        self.assertIn("expired", r.get_json()['error']['message'].lower())

    def test_change_password_success(self):
        """Test correct current password + valid new password works."""
        # 1. Register User
        self.client.post('/api/v1/auth/register', json={
            "name": "Change Pw User", "email": "pw_change@example.com", "password": "oldpassword123"
        })
        # 2. Login to get token
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "pw_change@example.com", "password": "oldpassword123"
        })
        token = login_res.get_json()['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 3. Change password
        r = self.client.put('/api/v1/auth/password', json={
            "current_password": "oldpassword123",
            "new_password": "newsecurepassword123"
        }, headers=headers)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()['success'])

        # 4. Verify login with old password fails
        r_old = self.client.post('/api/v1/auth/login', json={
            "email": "pw_change@example.com", "password": "oldpassword123"
        })
        self.assertEqual(r_old.status_code, 401)

        # 5. Verify login with new password succeeds
        r_new = self.client.post('/api/v1/auth/login', json={
            "email": "pw_change@example.com", "password": "newsecurepassword123"
        })
        self.assertEqual(r_new.status_code, 200)
        self.assertTrue(r_new.get_json()['success'])

    def test_change_password_wrong_current(self):
        """Test wrong current password is rejected."""
        self.client.post('/api/v1/auth/register', json={
            "name": "Change Pw User 2", "email": "pw_change2@example.com", "password": "oldpassword123"
        })
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "pw_change2@example.com", "password": "oldpassword123"
        })
        token = login_res.get_json()['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        r = self.client.put('/api/v1/auth/password', json={
            "current_password": "wrongoldpassword",
            "new_password": "newsecurepassword123"
        }, headers=headers)
        self.assertEqual(r.status_code, 401)
        self.assertFalse(r.get_json()['success'])

    def test_change_password_invalid_new(self):
        """Test invalid new password (too short) is rejected."""
        self.client.post('/api/v1/auth/register', json={
            "name": "Change Pw User 3", "email": "pw_change3@example.com", "password": "oldpassword123"
        })
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "pw_change3@example.com", "password": "oldpassword123"
        })
        token = login_res.get_json()['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        r = self.client.put('/api/v1/auth/password', json={
            "current_password": "oldpassword123",
            "new_password": "short"
        }, headers=headers)
        self.assertEqual(r.status_code, 400)
        self.assertIn("at least 8 characters", r.get_json()['error']['message'])

    def test_change_password_empty(self):
        """Test empty password inputs are rejected."""
        self.client.post('/api/v1/auth/register', json={
            "name": "Change Pw User 4", "email": "pw_change4@example.com", "password": "oldpassword123"
        })
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "pw_change4@example.com", "password": "oldpassword123"
        })
        token = login_res.get_json()['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        # Empty current_password
        r1 = self.client.put('/api/v1/auth/password', json={
            "current_password": "",
            "new_password": "newsecurepassword123"
        }, headers=headers)
        self.assertEqual(r1.status_code, 400)

        # Empty new_password
        r2 = self.client.put('/api/v1/auth/password', json={
            "current_password": "oldpassword123",
            "new_password": ""
        }, headers=headers)
        self.assertEqual(r2.status_code, 400)

    def test_change_password_unauthenticated(self):
        """Test unauthenticated request is rejected with 401."""
        r = self.client.put('/api/v1/auth/password', json={
            "current_password": "oldpassword123",
            "new_password": "newsecurepassword123"
        })
        self.assertEqual(r.status_code, 401)

    def test_change_password_isolation(self):
        """Test user cannot change another user's password (isolation check)."""
        # Register User A
        self.client.post('/api/v1/auth/register', json={
            "name": "User A", "email": "usera@example.com", "password": "usera_oldpassword"
        })
        # Register User B
        self.client.post('/api/v1/auth/register', json={
            "name": "User B", "email": "userb@example.com", "password": "userb_oldpassword"
        })

        # Login User A to get token A
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "usera@example.com", "password": "usera_oldpassword"
        })
        token_a = login_res.get_json()['data']['token']
        headers_a = {'Authorization': f'Bearer {token_a}'}

        # User A changes password (affects only User A)
        r = self.client.put('/api/v1/auth/password', json={
            "current_password": "usera_oldpassword",
            "new_password": "usera_newpassword"
        }, headers=headers_a)
        self.assertEqual(r.status_code, 200)

        # Verify User B's password has not been updated (User B can still login with old password)
        r_login_b = self.client.post('/api/v1/auth/login', json={
            "email": "userb@example.com", "password": "userb_oldpassword"
        })
        self.assertEqual(r_login_b.status_code, 200)

    def test_delete_account_success_and_cleanup(self):
        """Test normal USER account deletion triggers deletion of all user data and orphaned jobs."""
        from app.models import User, UserSettings, Job, Analysis, AnalysisFlag, SavedJob
        
        # 1. Register User A
        self.client.post('/api/v1/auth/register', json={
            "name": "User A", "email": "usera@example.com", "password": "password123"
        })
        # 2. Login User A
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "usera@example.com", "password": "password123"
        })
        token_a = login_res.get_json()['data']['token']
        user_a_id = login_res.get_json()['data']['user']['id']
        headers_a = {'Authorization': f'Bearer {token_a}'}

        # 3. Create job and analysis for User A
        job_1 = Job(title="Orphan Job", company="Co 1", description="Description 1")
        db.session.add(job_1)
        db.session.commit()
        job_1_id = job_1.id

        analysis_1 = Analysis(
            job_id=job_1.id, user_id=user_a_id,
            ml_score=10, rule_score=10, final_score=10,
            risk_level="LOW", prediction="SAFE", confidence=0.0,
            model_version="1.0", explanation="Exp"
        )
        db.session.add(analysis_1)
        db.session.commit()
        analysis_1_id = analysis_1.id

        flag_1 = AnalysisFlag(
            analysis_id=analysis_1.id, category="payment",
            severity="low", message="Alert"
        )
        db.session.add(flag_1)
        db.session.commit()
        flag_1_id = flag_1.id

        # 4. Save a job for User A
        saved_job = SavedJob(user_id=user_a_id, job_id=job_1_id)
        db.session.add(saved_job)
        db.session.commit()
        saved_job_id = saved_job.id

        # Register User B to have a separate active user context
        self.client.post('/api/v1/auth/register', json={
            "name": "User B", "email": "userb@example.com", "password": "password123"
        })
        login_res_b = self.client.post('/api/v1/auth/login', json={
            "email": "userb@example.com", "password": "password123"
        })
        user_b_id = login_res_b.get_json()['data']['user']['id']

        # Verify User A data exists
        self.assertIsNotNone(User.query.get(user_a_id))
        self.assertIsNotNone(UserSettings.query.filter_by(user_id=user_a_id).first())
        self.assertIsNotNone(Analysis.query.get(analysis_1_id))
        self.assertIsNotNone(AnalysisFlag.query.get(flag_1_id))
        self.assertIsNotNone(SavedJob.query.get(saved_job_id))
        self.assertIsNotNone(Job.query.get(job_1_id))

        # 5. Delete User A account
        r = self.client.delete('/api/v1/auth/account', headers=headers_a)
        self.assertEqual(r.status_code, 200)

        # 6. Verify User A data is wiped
        self.assertIsNone(User.query.get(user_a_id))
        self.assertIsNone(UserSettings.query.filter_by(user_id=user_a_id).first())
        self.assertIsNone(Analysis.query.get(analysis_1_id))
        self.assertIsNone(AnalysisFlag.query.get(flag_1_id))
        self.assertIsNone(SavedJob.query.get(saved_job_id))
        # Verify orphaned Job is also cleaned safely
        self.assertIsNone(Job.query.get(job_1_id))

        # Verify User B (and settings) remains untouched
        self.assertIsNotNone(User.query.get(user_b_id))
        self.assertIsNotNone(UserSettings.query.filter_by(user_id=user_b_id).first())

        # Verify login fails with deleted credentials
        login_fail = self.client.post('/api/v1/auth/login', json={
            "email": "usera@example.com", "password": "password123"
        })
        self.assertEqual(login_fail.status_code, 401)

    def test_delete_account_shared_job_preserved(self):
        """Test that shared jobs are preserved when one user is deleted."""
        from app.models import User, Job, Analysis, SavedJob
        
        # Register User A and User B
        self.client.post('/api/v1/auth/register', json={
            "name": "User A", "email": "usera@example.com", "password": "password123"
        })
        login_res_a = self.client.post('/api/v1/auth/login', json={
            "email": "usera@example.com", "password": "password123"
        })
        token_a = login_res_a.get_json()['data']['token']
        user_a_id = login_res_a.get_json()['data']['user']['id']
        headers_a = {'Authorization': f'Bearer {token_a}'}

        self.client.post('/api/v1/auth/register', json={
            "name": "User B", "email": "userb@example.com", "password": "password123"
        })
        login_res_b = self.client.post('/api/v1/auth/login', json={
            "email": "userb@example.com", "password": "password123"
        })
        user_b_id = login_res_b.get_json()['data']['user']['id']

        # Create a shared job URL analyzed by A, saved by B
        shared_job = Job(title="Shared Job", company="Co", description="Shared description", source_url="http://shared.com")
        db.session.add(shared_job)
        db.session.commit()
        shared_job_id = shared_job.id

        analysis_a = Analysis(
            job_id=shared_job_id, user_id=user_a_id,
            ml_score=10, rule_score=10, final_score=10,
            risk_level="LOW", prediction="SAFE", confidence=0.0,
            model_version="1.0", explanation="Exp"
        )
        db.session.add(analysis_a)
        
        saved_b = SavedJob(user_id=user_b_id, job_id=shared_job_id)
        db.session.add(saved_b)
        db.session.commit()

        # Delete User A
        r = self.client.delete('/api/v1/auth/account', headers=headers_a)
        self.assertEqual(r.status_code, 200)

        # Verify User A is gone, but shared Job remains because User B saves it
        self.assertIsNone(User.query.get(user_a_id))
        self.assertIsNotNone(Job.query.get(shared_job_id))
        self.assertIsNotNone(SavedJob.query.get(saved_b.id))

    def test_delete_account_final_admin_protection(self):
        """Test system prevents deleting the last remaining admin."""
        # 1. Create a user and make them ADMIN in the database
        self.client.post('/api/v1/auth/register', json={
            "name": "Admin User 1", "email": "admin1@example.com", "password": "password123"
        })
        admin_user = User.query.filter_by(email="admin1@example.com").first()
        admin_user.role = 'ADMIN'
        db.session.commit()

        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "admin1@example.com", "password": "password123"
        })
        token = login_res.get_json()['data']['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Try to delete the only admin
        r = self.client.delete('/api/v1/auth/account', headers=headers)
        self.assertEqual(r.status_code, 400)
        self.assertIn("final remaining administrator", r.get_json()['error']['message'])

        # 3. Create another admin
        self.client.post('/api/v1/auth/register', json={
            "name": "Admin User 2", "email": "admin2@example.com", "password": "password123"
        })
        admin_user2 = User.query.filter_by(email="admin2@example.com").first()
        admin_user2.role = 'ADMIN'
        db.session.commit()

        # 4. Now deletion of Admin 1 should succeed
        r2 = self.client.delete('/api/v1/auth/account', headers=headers)
        self.assertEqual(r2.status_code, 200)
        self.assertIsNone(User.query.get(admin_user.id))

    def test_delete_account_unauthenticated(self):
        """Test unauthenticated account deletion is rejected."""
        r = self.client.delete('/api/v1/auth/account')
        self.assertEqual(r.status_code, 401)

    def test_delete_account_rollback_on_failure(self):
        """Test database rollback occurs on deletion failures."""
        from unittest.mock import patch
        
        self.client.post('/api/v1/auth/register', json={
            "name": "User", "email": "usera@example.com", "password": "password123"
        })
        login_res = self.client.post('/api/v1/auth/login', json={
            "email": "usera@example.com", "password": "password123"
        })
        token = login_res.get_json()['data']['token']
        user_id = login_res.get_json()['data']['user']['id']
        headers = {'Authorization': f'Bearer {token}'}

        # Mock database commit to raise an exception
        with patch('app.extensions.db.Session.commit', side_effect=Exception("Database Failure")):
            r = self.client.delete('/api/v1/auth/account', headers=headers)
            self.assertEqual(r.status_code, 500)
            
            # Verify user record still exists due to rollback
            self.assertIsNotNone(User.query.get(user_id))

if __name__ == '__main__':
    unittest.main()

