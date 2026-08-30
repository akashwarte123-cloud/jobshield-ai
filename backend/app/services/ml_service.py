import json
import urllib.request
from urllib.error import URLError, HTTPError
from flask import current_app

class MLIntegrationError(Exception):
    """Custom exception for ML service adapter integration failures."""
    pass

class MLService:
    """Adapter service connecting the Flask backend to the Node/Express ML ensemble classifier."""

    @staticmethod
    def predict(job_data):
        """
        Sends job posting data to the Node/Express ML service for ensemble classification.

        Expects job_data format:
        {
            "title": "...",
            "company": "...",
            "description": "...",
            "source_url": "...",
            "email": "..." (optional)
        }

        Returns normalized dictionary:
        {
            "prediction": "SAFE" | "CAUTION" | "DANGER",
            "ml_score": 0 - 100,
            "confidence": None,
            "model_version": None
        }
        """
        if not job_data:
            raise MLIntegrationError("Input job data is missing.")

        # Extract parameters and construct payload matching JobPostingInput schema
        title = job_data.get("title", "").strip() if job_data.get("title") else ""
        company = job_data.get("company", "").strip() if job_data.get("company") else ""
        description = job_data.get("description", "").strip() if job_data.get("description") else ""
        url = job_data.get("source_url", "").strip() if job_data.get("source_url") else ""

        # Validate that at least description or title is present
        if not title and not description:
            raise MLIntegrationError("Validation failed: Either 'title' or 'description' must be provided.")

        payload = {
            "title": title,
            "company": company,
            "description": description,
            "url": url
        }

        if "email" in job_data:
            # Propagate email only if provided, normalizing None or strip whitespaces
            email_val = job_data["email"]
            payload["email"] = email_val.strip() if isinstance(email_val, str) else email_val

        # Load target endpoint from current configuration
        try:
            node_ml_url = current_app.config["NODE_ML_URL"]
        except RuntimeError:
            # Fallback for testing/contexts without application runtime active
            node_ml_url = "http://127.0.0.1:5000/api/v1/analyze"

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        req = urllib.request.Request(
            node_ml_url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            # Make the HTTP post request with a 5 second timeout limit
            with urllib.request.urlopen(req, timeout=5) as response:
                body = response.read().decode("utf-8")
        except HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                err_data = json.loads(err_body)
                error_msg = err_data.get("error") or err_data.get("message") or str(e)
            except Exception:
                error_msg = str(e)
            
            current_app.logger.error("ML service HTTPError: %s", error_msg)
            raise MLIntegrationError(f"ML Service HTTP error {e.code}: {error_msg}")
        except URLError as e:
            current_app.logger.error("ML service URLError: %s", str(e.reason))
            raise MLIntegrationError(f"Connection refused or address resolution failure at {node_ml_url}.")
        except TimeoutError:
            current_app.logger.error("ML service request timed out.")
            raise MLIntegrationError("The connection to the ML classification service timed out.")
        except Exception as e:
            current_app.logger.error("Unexpected error in MLService request: %s", str(e))
            raise MLIntegrationError(f"Unexpected connection failure: {str(e)}")

        # Parse JSON response body
        try:
            response_json = json.loads(body)
        except json.JSONDecodeError:
            raise MLIntegrationError("ML service response could not be parsed as valid JSON.")

        # Ensure prediction call was reported as successful
        if not response_json.get("success"):
            error_details = response_json.get("error", "Unknown ML service error.")
            raise MLIntegrationError(f"ML service reported classification failure: {error_details}")

        data = response_json.get("data") or {}
        analysis = data.get("analysis") or {}

        if "verdict" not in analysis or "score" not in analysis:
            raise MLIntegrationError("ML service response body was missing critical classification parameters.")

        return {
            "prediction": analysis["verdict"],
            "ml_score": analysis["score"],
            "confidence": None,
            "model_version": None
        }
