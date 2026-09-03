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
            node_ml_url = current_app.config.get("NODE_ML_URL", "")
        except RuntimeError:
            node_ml_url = ""

        # Attempt Node ML service call if NODE_ML_URL is configured and active
        if node_ml_url and str(node_ml_url).lower() not in ('none', 'disabled', 'false'):
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
                with urllib.request.urlopen(req, timeout=5) as response:
                    body = response.read().decode("utf-8")
                response_json = json.loads(body)
                if response_json.get("success"):
                    data = response_json.get("data") or {}
                    analysis = data.get("analysis") or {}
                    if "verdict" in analysis and "score" in analysis:
                        return {
                            "prediction": analysis["verdict"],
                            "ml_score": analysis["score"],
                            "confidence": None,
                            "model_version": None
                        }
                    elif "riskScore" in data:
                        verdict = "DANGER" if data.get("riskScore", 0) >= 60 else ("CAUTION" if data.get("riskScore", 0) >= 30 else "SAFE")
                        return {
                            "prediction": data.get("verdict") or verdict,
                            "ml_score": data.get("riskScore", 0),
                            "confidence": data.get("confidence", 95) / 100.0,
                            "model_version": "node-ml-v1"
                        }
            except Exception as e:
                try:
                    current_app.logger.warning("Node ML unavailable, using Python RuleEngine fallback: %s", str(e))
                except Exception:
                    pass

        # Python RuleEngine fallback when Node ML is unavailable, times out, or disabled
        from app.services.rule_engine import RuleEngine

        rule_eval = RuleEngine.analyze(job_data)
        r_score = rule_eval.get("rule_score", 0)
        verdict = "DANGER" if r_score >= 60 else ("CAUTION" if r_score >= 30 else "SAFE")

        return {
            "prediction": verdict,
            "ml_score": r_score,
            "confidence": 0.90,
            "model_version": "python-rule-engine-v1-fallback"
        }
