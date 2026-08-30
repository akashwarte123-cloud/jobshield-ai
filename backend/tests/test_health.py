import unittest
import sys
import os

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app

class HealthCheckTestCase(unittest.TestCase):
    def setUp(self):
        # Create app configured for testing
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_health_check_endpoint(self):
        """Test GET /api/v1/health returns HTTP 200 and success status."""
        response = self.client.get('/api/v1/health')
        self.assertEqual(response.status_code, 200)
        
        json_data = response.get_json()
        self.assertTrue(json_data.get('success'))
        self.assertEqual(json_data.get('status'), 'healthy')

    def test_invalid_endpoint_returns_404(self):
        """Test invalid route returns HTTP 404 and structured JSON error."""
        response = self.client.get('/api/v1/invalid-route')
        self.assertEqual(response.status_code, 404)
        
        json_data = response.get_json()
        self.assertFalse(json_data.get('success'))
        self.assertIn('error', json_data)
        self.assertEqual(json_data['error'].get('code'), 'NOT_FOUND')
        self.assertIn('message', json_data['error'])

if __name__ == '__main__':
    unittest.main()
