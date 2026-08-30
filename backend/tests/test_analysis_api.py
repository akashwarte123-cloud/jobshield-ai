import unittest
import sys
import os
import json
import jwt
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import User
from app.services.ml_service import MLIntegrationError
from app.utils.auth import generate_token

class AnalysisAPITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Create test user and token
        self.user = User(name="John Doe", email="johndoe@example.com", password_hash="hashed")
        db.session.add(self.user)
        db.session.commit()
        self.token = generate_token(self.user.id)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    @patch('app.services.ml_service.MLService.predict')
    def test_api_valid_anonymous_request(self, mock_predict):
        """Test POST /analyze returns 201 and correct structure anonymously."""
        mock_predict.return_value = {
            "prediction": "SAFE", "ml_score": 5, "confidence": None, "model_version": None
        }

        job_payload = {
            "title": "Software Engineer",
            "description": "Write code and tests. Qualifications: degree. Duties: backend development.",
            "company": "Vite Corp",
            "location": "Remote"
        }

        response = self.client.post('/api/v1/analyze', json=job_payload)
        self.assertEqual(response.status_code, 201)
        
        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertIn("data", json_data)
        self.assertEqual(json_data["data"]["job"]["title"], "Software Engineer")
        self.assertEqual(json_data["data"]["analysis"]["risk_level"], "LOW")
        self.assertEqual(json_data["data"]["analysis"]["flags"], [])

    @patch('app.services.ml_service.MLService.predict')
    def test_api_valid_authenticated_request(self, mock_predict):
        """Test POST /analyze resolves user and returns analysis linked to user."""
        mock_predict.return_value = {
            "prediction": "SAFE", "ml_score": 15, "confidence": None, "model_version": None
        }

        job_payload = {
            "title": "React Frontend Developer",
            "description": "Design component architectures. Qualifications: HTML, React. Duties: code pages."
        }

        headers = {'Authorization': f'Bearer {self.token}'}
        response = self.client.post('/api/v1/analyze', json=job_payload, headers=headers)
        self.assertEqual(response.status_code, 201)

        json_data = response.get_json()
        self.assertTrue(json_data["success"])

    def test_api_missing_required_fields(self):
        """Test API returns 400 when required fields are missing."""
        # Missing description
        response = self.client.post('/api/v1/analyze', json={"title": "Hacker Developer"})
        self.assertEqual(response.status_code, 400)
        json_data = response.get_json()
        self.assertFalse(json_data["success"])
        self.assertEqual(json_data["error"]["code"], "BAD_REQUEST")
        self.assertIn("description", json_data["error"]["message"])

        # Missing title
        response = self.client.post('/api/v1/analyze', json={"description": "Details"})
        self.assertEqual(response.status_code, 400)

    def test_api_invalid_json(self):
        """Test API returns 400 for malformed non-JSON body payload."""
        response = self.client.post('/api/v1/analyze', data="string-payload", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.get_json()["success"])

    def test_api_invalid_field_types(self):
        """Test API rejects non-string types for string fields."""
        job_payload = {
            "title": 12345,  # Invalid type (integer)
            "description": "Details"
        }
        response = self.client.post('/api/v1/analyze', json=job_payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("string type", response.get_json()["error"]["message"])

    def test_api_invalid_formats(self):
        """Test API rejects invalid email or URL formats."""
        # Invalid URL
        job_payload = {
            "title": "Developer",
            "description": "Job details.",
            "source_url": "bad-url-string"
        }
        response = self.client.post('/api/v1/analyze', json=job_payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid URL format", response.get_json()["error"]["message"])

        # Invalid Email
        job_payload = {
            "title": "Developer",
            "description": "Job details.",
            "email": "bad-email-format"
        }
        response = self.client.post('/api/v1/analyze', json=job_payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid email address format", response.get_json()["error"]["message"])

    def test_api_invalid_and_expired_tokens(self):
        """Test that invalid and expired Authorization tokens return 401."""
        job_payload = {"title": "Developer", "description": "Write code. Duties: coding. Qualifications: degree."}

        # 1. Invalid signature
        headers = {'Authorization': 'Bearer bad.token.signature'}
        response = self.client.post('/api/v1/analyze', json=job_payload, headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.get_json()["success"])

        # 2. Expired token
        secret = self.app.config['JWT_SECRET_KEY']
        expired_payload = {
            'exp': datetime.now(timezone.utc) - timedelta(minutes=5),
            'iat': datetime.now(timezone.utc) - timedelta(minutes=10),
            'sub': str(self.user.id)
        }
        expired_token = jwt.encode(expired_payload, secret, algorithm='HS256')
        
        headers = {'Authorization': f'Bearer {expired_token}'}
        response = self.client.post('/api/v1/analyze', json=job_payload, headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertIn("expired", response.get_json()["error"]["message"].lower())

    @patch('app.services.ml_service.MLService.predict')
    def test_api_ml_service_unavailable(self, mock_predict):
        """Test API returns 503 if ML Service fails with MLIntegrationError."""
        mock_predict.side_effect = MLIntegrationError("ML Server timed out")

        job_payload = {
            "title": "DevOps Architect",
            "description": "Manage servers. Duties: maintenance. Qualifications: degree."
        }

        response = self.client.post('/api/v1/analyze', json=job_payload)
        self.assertEqual(response.status_code, 503)
        json_data = response.get_json()
        self.assertFalse(json_data["success"])
        self.assertEqual(json_data["error"]["code"], "SERVICE_UNAVAILABLE")
        self.assertIn("currently unavailable", json_data["error"]["message"])

if __name__ == '__main__':
    unittest.main()
