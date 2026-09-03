import unittest
import sys
import os
import json
import urllib.request
from unittest.mock import patch, MagicMock
from urllib.error import URLError, HTTPError
from io import BytesIO

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.services import MLService, MLIntegrationError

class MLServiceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.app.config['NODE_ML_URL'] = 'http://127.0.0.1:5000/api/v1/analyze'

    def tearDown(self):
        self.ctx.pop()

    @patch('urllib.request.urlopen')
    def test_predict_success_mapping(self, mock_urlopen):
        """Test successful ML prediction mapping and request parameters."""
        # Mock Response
        mock_response = MagicMock()
        mock_response.status = 200
        response_body = json.dumps({
            "success": True,
            "data": {
                "job": {
                    "title": "Software Engineer",
                    "company": "JobShield Corp",
                    "description": "Develop exciting security features.",
                    "url": "http://example.com/job"
                },
                "analysis": {
                    "score": 12,
                    "verdict": "SAFE",
                    "badgeColor": "safe",
                    "summaryText": "Posting matches standard legitimate patterns.",
                    "redFlags": [],
                    "breakdown": {"financial": 0, "communication": 0, "identity": 0, "urgency": 12},
                    "analyzedAt": "2026-08-11T12:00:00.000Z"
                }
            }
        }).encode('utf-8')
        mock_response.read.return_value = response_body
        mock_urlopen.return_value.__enter__.return_value = mock_response

        # Execute
        job_data = {
            "title": "Software Engineer",
            "company": "JobShield Corp",
            "description": "Develop exciting security features.",
            "source_url": "http://example.com/job",
            "email": "recruiter@jobshield.com"
        }
        res = MLService.predict(job_data)

        # Assert output mapping
        self.assertEqual(res["prediction"], "SAFE")
        self.assertEqual(res["ml_score"], 12)
        self.assertIsNone(res["confidence"])
        self.assertIsNone(res["model_version"])

        # Verify urllib Request arguments
        self.assertTrue(mock_urlopen.called)
        req = mock_urlopen.call_args[0][0]
        self.assertIsInstance(req, urllib.request.Request)
        self.assertEqual(req.get_full_url(), 'http://127.0.0.1:5000/api/v1/analyze')
        self.assertEqual(req.method, 'POST')
        self.assertEqual(req.headers.get('Content-type'), 'application/json')
        self.assertEqual(req.headers.get('Accept'), 'application/json')
        
        # Verify body payload and key mapping
        sent_body = json.loads(req.data.decode('utf-8'))
        self.assertEqual(sent_body["title"], "Software Engineer")
        self.assertEqual(sent_body["company"], "JobShield Corp")
        self.assertEqual(sent_body["description"], "Develop exciting security features.")
        self.assertEqual(sent_body["url"], "http://example.com/job")
        self.assertEqual(sent_body["email"], "recruiter@jobshield.com")

    def test_missing_required_job_data(self):
        """Test validation raises MLIntegrationError if both title and description are missing."""
        with self.assertRaises(MLIntegrationError) as context:
            MLService.predict({
                "company": "JobShield Corp",
                "source_url": "http://example.com/job"
            })
        self.assertIn("Either 'title' or 'description' must be provided", str(context.exception))

    @patch('urllib.request.urlopen')
    def test_timeout_exception(self, mock_urlopen):
        """Test timeout gracefully falls back to Python RuleEngine."""
        mock_urlopen.side_effect = TimeoutError("Connection timed out")
        
        job_data = {"title": "Software Engineer", "description": "Job details."}
        res = MLService.predict(job_data)
        self.assertEqual(res["model_version"], "python-rule-engine-v1-fallback")
        self.assertIn("prediction", res)

    @patch('urllib.request.urlopen')
    def test_connection_refused_exception(self, mock_urlopen):
        """Test connection refused gracefully falls back to Python RuleEngine."""
        mock_urlopen.side_effect = URLError("Connection refused")
        
        job_data = {"title": "Software Engineer", "description": "Job details."}
        res = MLService.predict(job_data)
        self.assertEqual(res["model_version"], "python-rule-engine-v1-fallback")
        self.assertIn("prediction", res)

    @patch('urllib.request.urlopen')
    def test_http_error_exception(self, mock_urlopen):
        """Test HTTP error status responses gracefully fall back to Python RuleEngine."""
        fp = BytesIO(json.dumps({"error": "Bad request format parameters"}).encode('utf-8'))
        mock_urlopen.side_effect = HTTPError(
            url='http://127.0.0.1:5000/api/v1/analyze',
            code=400,
            msg='Bad Request',
            hdrs={},
            fp=fp
        )
        
        job_data = {"title": "Software Engineer", "description": "Job details."}
        res = MLService.predict(job_data)
        self.assertEqual(res["model_version"], "python-rule-engine-v1-fallback")
        self.assertIn("prediction", res)

    @patch('urllib.request.urlopen')
    def test_malformed_json_response(self, mock_urlopen):
        """Test non-JSON payloads gracefully fall back to Python RuleEngine."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = b"<html>Internal Server Error</html>"
        mock_urlopen.return_value.__enter__.return_value = mock_response

        job_data = {"title": "Software Engineer", "description": "Job details."}
        res = MLService.predict(job_data)
        self.assertEqual(res["model_version"], "python-rule-engine-v1-fallback")
        self.assertIn("prediction", res)

    @patch('urllib.request.urlopen')
    def test_missing_critical_keys_in_response(self, mock_urlopen):
        """Test missing critical analysis keys in response gracefully falls back to Python RuleEngine."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({
            "success": True,
            "data": {
                "analysis": {
                    # Missing verdict and score
                    "summaryText": "Malformed prediction response"
                }
            }
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_response

        job_data = {"title": "Software Engineer", "description": "Job details."}
        res = MLService.predict(job_data)
        self.assertEqual(res["model_version"], "python-rule-engine-v1-fallback")
        self.assertIn("prediction", res)

if __name__ == '__main__':
    unittest.main()
