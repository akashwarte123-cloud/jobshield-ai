import unittest
import sys
import os
import io
from werkzeug.security import generate_password_hash

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User

class AvatarTestCase(unittest.TestCase):
    def setUp(self):
        # Create app configured for testing (uses sqlite:///:memory:)
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Create all tables in testing context
        db.create_all()

        # Set up a test user
        self.user = User(
            name="Rahul Ingle",
            email="rahul@example.com",
            password_hash=generate_password_hash("password123"),
            role="USER"
        )
        db.session.add(self.user)
        db.session.commit()
        
        # Acquire token for authentication
        response = self.client.post('/api/v1/auth/login', json={
            "email": "rahul@example.com",
            "password": "password123"
        })
        self.token = response.get_json()['data']['token']
        self.headers = {
            'Authorization': f'Bearer {self.token}'
        }

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_avatar_default_null(self):
        """Test that user avatar defaults to None."""
        user = User.query.filter_by(email="rahul@example.com").first()
        self.assertIsNone(user.avatar)

    def test_unauthenticated_upload_returns_401(self):
        """Test uploading without authentication headers returns 401."""
        data = {
            'avatar': (io.BytesIO(b'\x89PNG\r\n\x1a\nFake PNG Data'), 'test.png')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 401)

    def test_upload_missing_file_rejected(self):
        """Test uploading with missing 'avatar' field returns 400."""
        data = {}
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
        
        json_data = response.get_json()
        self.assertFalse(json_data['success'])
        self.assertEqual(json_data['error']['code'], 'BAD_REQUEST')

    def test_upload_empty_file_rejected(self):
        """Test uploading empty file returns 400."""
        data = {
            'avatar': (io.BytesIO(b''), '')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)

    def test_valid_png_upload(self):
        """Test successful PNG image upload."""
        png_data = b'\x89PNG\r\n\x1a\nSome PNG file payload'
        data = {
            'avatar': (io.BytesIO(png_data), 'avatar.png')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data['success'])
        self.assertIn('data', json_data)
        self.assertTrue(json_data['data']['avatar'].startswith('data:image/png;base64,'))
        
        # Verify in DB
        db.session.refresh(self.user)
        self.assertIsNotNone(self.user.avatar)
        self.assertTrue(self.user.avatar.startswith('data:image/png;base64,'))

    def test_valid_jpg_upload(self):
        """Test successful JPG image upload."""
        jpg_data = b'\xff\xd8\xffSome JPEG file payload'
        data = {
            'avatar': (io.BytesIO(jpg_data), 'avatar.jpg')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data['success'])
        self.assertTrue(json_data['data']['avatar'].startswith('data:image/jpeg;base64,'))

    def test_valid_webp_upload(self):
        """Test successful WebP image upload."""
        webp_data = b'RIFF\x00\x00\x00\x00WEBPSome WebP file payload'
        data = {
            'avatar': (io.BytesIO(webp_data), 'avatar.webp')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data['success'])
        self.assertTrue(json_data['data']['avatar'].startswith('data:image/webp;base64,'))

    def test_unsupported_file_type_rejected(self):
        """Test uploading PDF / TXT / non-image returns 415."""
        txt_data = b'Hello, world! This is a plain text file.'
        data = {
            'avatar': (io.BytesIO(txt_data), 'avatar.txt')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 415)
        
        json_data = response.get_json()
        self.assertFalse(json_data['success'])
        self.assertEqual(json_data['error']['code'], 'UNSUPPORTED_MEDIA_TYPE')

    def test_oversized_file_rejected(self):
        """Test uploading file exceeding 2MB limit returns 413."""
        # 2.1 MB
        oversized_data = b'\x89PNG\r\n\x1a\n' + b'x' * (2 * 1024 * 1024 + 1000)
        data = {
            'avatar': (io.BytesIO(oversized_data), 'avatar.png')
        }
        response = self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 413)
        
        json_data = response.get_json()
        self.assertFalse(json_data['success'])
        self.assertEqual(json_data['error']['code'], 'PAYLOAD_TOO_LARGE')

    def test_delete_avatar_works(self):
        """Test deleting profile avatar sets User.avatar to None."""
        # Setup pre-existing avatar
        self.user.avatar = "data:image/png;base64,PreExistingData"
        db.session.commit()
        
        response = self.client.delete('/api/v1/profile/avatar', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data['success'])
        self.assertIsNone(json_data['data']['avatar'])
        
        # Verify in DB
        db.session.refresh(self.user)
        self.assertIsNone(self.user.avatar)

    def test_deleting_empty_avatar_is_safe(self):
        """Test that deleting an avatar when user doesn't have one is safe and returns success."""
        response = self.client.delete('/api/v1/profile/avatar', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.get_json()['data']['avatar'])

    def test_avatar_appears_in_get_me(self):
        """Test that GET /auth/me returns the avatar payload and never exposes password_hash."""
        self.user.avatar = "data:image/png;base64,TestMe"
        db.session.commit()
        
        response = self.client.get('/api/v1/auth/me', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data['success'])
        self.assertEqual(json_data['data']['avatar'], "data:image/png;base64,TestMe")
        self.assertNotIn('password_hash', json_data['data'])

    def test_cross_user_isolation(self):
        """Test that user A cannot modify user B's avatar (implicit via token extraction)."""
        # User 2
        user2 = User(
            name="John Doe",
            email="john@example.com",
            password_hash=generate_password_hash("password123"),
            role="USER"
        )
        db.session.add(user2)
        db.session.commit()
        
        # Set user2 avatar in database
        user2.avatar = "data:image/png;base64,JohnsAvatar"
        db.session.commit()
        
        # Uploading with User 1's headers must only modify User 1's DB row
        png_data = b'\x89PNG\r\n\x1a\nUser1Avatar'
        data = {
            'avatar': (io.BytesIO(png_data), 'avatar.png')
        }
        self.client.put('/api/v1/profile/avatar', data=data, headers=self.headers, content_type='multipart/form-data')
        
        # Verify John's avatar was NOT modified
        db.session.refresh(user2)
        self.assertEqual(user2.avatar, "data:image/png;base64,JohnsAvatar")

if __name__ == '__main__':
    unittest.main()
