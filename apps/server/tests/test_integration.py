import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_auth_and_job_scan_integration_flow():
    # 1. Register User
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "integration.user@jobshield.ai",
        "password": "Password123!",
        "fullName": "Integration User"
    })
    assert reg_res.status_code == 201
    access_token = reg_res.json()["tokens"]["accessToken"]

    # 2. Authenticated Job Scan API Request
    scan_res = client.post(
        "/api/v1/jobs/scan",
        json={
            "title": "Remote Data Entry Assistant",
            "company": "Apex Global Logistics",
            "email": "recruiter.apexlogistics@gmail.com",
            "description": "Earn $65/hr. Deposit check and wire funds to vendor. Interview on Telegram @ApexHR."
        },
        headers={"Authorization": f"Bearer {access_token}"}
    )

    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["score"] >= 50
    assert scan_data["verdict"] == "DANGER"
