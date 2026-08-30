import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_user_registration_and_login():
    # Test User Registration
    reg_payload = {
        "email": "test.candidate@jobshield.ai",
        "password": "SecurePassword123!",
        "fullName": "Test Candidate"
    }
    response = client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "test.candidate@jobshield.ai"
    assert "accessToken" in data["tokens"]

    # Test User Login
    login_payload = {
        "email": "test.candidate@jobshield.ai",
        "password": "SecurePassword123!",
        "provider": "LOCAL"
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    assert "accessToken" in login_resp.json()["tokens"]
