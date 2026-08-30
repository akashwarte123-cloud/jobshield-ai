import unittest
import sys
import os
import json

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User, UserSettings
from app.utils.auth import generate_token

class SettingsAPITestCase(unittest.TestCase):
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

        # Create settings record for User A
        self.settings_a = UserSettings(
            user_id=self.user_a.id,
            email_notifications=True,
            default_analysis_mode='balanced',
            theme='dark'
        )
        db.session.add(self.settings_a)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_anonymous_requests_rejected(self):
        """Test anonymous calls return HTTP 401."""
        response = self.client.get('/api/v1/settings')
        self.assertEqual(response.status_code, 401)

        response = self.client.put('/api/v1/settings', json={"theme": "LIGHT"})
        self.assertEqual(response.status_code, 401)

    def test_authenticated_get_settings(self):
        """Test user A can retrieve their own settings correctly."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/settings', headers=headers)
        self.assertEqual(response.status_code, 200)

        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        
        settings = json_data["data"]
        self.assertEqual(settings["email_notifications"], True)
        self.assertEqual(settings["default_analysis_mode"], "balanced")
        # Returns uppercase representation of theme per B8 requirement
        self.assertEqual(settings["theme"], "DARK")

    def test_authenticated_put_single_field(self):
        """Test partial single field update (PUT)."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        
        response = self.client.put('/api/v1/settings', json={"theme": "LIGHT"}, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Verify response structure
        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["theme"], "LIGHT")
        self.assertEqual(json_data["data"]["email_notifications"], True) # Remains unchanged

        # Verify values persisted in database
        db.session.commit()
        db_settings = UserSettings.query.filter_by(user_id=self.user_a.id).first()
        self.assertEqual(db_settings.theme, 'light')

    def test_authenticated_put_multiple_fields(self):
        """Test updating multiple permitted settings fields."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        payload = {
            "email_notifications": False,
            "default_analysis_mode": "strict",
            "theme": "SYSTEM"
        }
        
        response = self.client.put('/api/v1/settings', json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)

        json_data = response.get_json()
        settings = json_data["data"]
        self.assertEqual(settings["email_notifications"], False)
        self.assertEqual(settings["default_analysis_mode"], "strict")
        self.assertEqual(settings["theme"], "SYSTEM")

    def test_invalid_email_notifications_value(self):
        """Test that non-boolean values for email_notifications are rejected."""
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # String representation of boolean
        response = self.client.put('/api/v1/settings', json={"email_notifications": "false"}, headers=headers)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")

        # Number representation
        response = self.client.put('/api/v1/settings', json={"email_notifications": 0}, headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_invalid_theme_value(self):
        """Test that invalid values for theme are rejected with HTTP 400."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.put('/api/v1/settings', json={"theme": "INVALID_THEME"}, headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_invalid_analysis_mode_value(self):
        """Test that unsupported analysis modes are rejected with HTTP 400."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.put('/api/v1/settings', json={"default_analysis_mode": "aggressive"}, headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_unknown_fields_safely_ignored(self):
        """Test that unsupported payload parameters are ignored without affecting settings."""
        headers = {'Authorization': f'Bearer {self.token_a}'}
        payload = {
            "theme": "DARK",
            "nonexistent_setting": "malicious-value",
            "user_id": "attempt-to-overwrite"
        }
        
        response = self.client.put('/api/v1/settings', json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)

        # Check DB remains unpolluted
        db_settings = UserSettings.query.filter_by(user_id=self.user_a.id).first()
        self.assertEqual(db_settings.theme, 'dark')
        self.assertFalse(hasattr(db_settings, "nonexistent_setting"))

    def test_user_isolation(self):
        """Test User A cannot modify or query User B's settings."""
        # Authenticated User A tries to modify settings on their route
        # (Since client cannot supply user_id, we verify User B's settings are untouched)
        
        # Verify User B has no settings record yet
        settings_b = UserSettings.query.filter_by(user_id=self.user_b.id).first()
        self.assertIsNone(settings_b)

        # Retrieve User B's settings with User B's token (creates them on request)
        headers_b = {'Authorization': f'Bearer {self.token_b}'}
        response_b = self.client.get('/api/v1/settings', headers=headers_b)
        self.assertEqual(response_b.status_code, 200)
        
        # Verify User B's settings are default dark
        self.assertEqual(response_b.get_json()["data"]["theme"], "DARK")

        # User A makes updates
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        response_a = self.client.put('/api/v1/settings', json={"theme": "LIGHT"}, headers=headers_a)
        self.assertEqual(response_a.status_code, 200)

        # Reload and check User B settings remain DARK
        response_b_refreshed = self.client.get('/api/v1/settings', headers=headers_b)
        self.assertEqual(response_b_refreshed.get_json()["data"]["theme"], "DARK")

    def test_missing_settings_record_safely_generated(self):
        """Test that a missing settings record is generated on-demand with correct defaults."""
        # Delete User A's settings
        db.session.delete(self.settings_a)
        db.session.commit()

        # Query User A settings (which should trigger auto-generation)
        headers = {'Authorization': f'Bearer {self.token_a}'}
        response = self.client.get('/api/v1/settings', headers=headers)
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()["data"]
        self.assertEqual(json_data["email_notifications"], True)
        self.assertEqual(json_data["default_analysis_mode"], "balanced")
        self.assertEqual(json_data["theme"], "DARK")

if __name__ == '__main__':
    unittest.main()
