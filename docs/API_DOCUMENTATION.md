# 📡 JobShield AI — REST API Documentation (v1.0)

Base URL: `http://localhost:8000/api/v1`

All responses return standard JSON format. The response status codes are standard HTTP response statuses.

---

## 1. System Health Check

### `GET /health`
Returns the status of the API service and database connectivity.

**Response `200 OK`**:
```json
{
  "success": true,
  "status": "healthy"
}
```

---

## 2. Authentication

### `POST /auth/register`
Registers a new user profile.

**Request Body**:
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah.jenkins@example.com",
  "password": "SecurePassword123!"
}
```

**Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "message": "User registered successfully."
  }
}
```

---

### `POST /auth/login`
Authenticates a user and returns a JSON Web Token (JWT).

**Request Body**:
```json
{
  "email": "sarah.jenkins@example.com",
  "password": "SecurePassword123!"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_101",
      "name": "Sarah Jenkins",
      "email": "sarah.jenkins@example.com"
    }
  }
}
```

---

## 3. Analysis Pipeline

### `POST /analyze`
Analyzes a job posting payload using the hybrid fusion scoring model (ML + heuristic rules).
- **Headers**:
  - `Authorization: Bearer <token>` (Optional. If omitted, the request is processed anonymously. If invalid or expired, returns `401 Unauthorized`).
- **Request Body**:
  ```json
  {
    "title": "Data Entry Clerk",
    "company": "Global Logistics Corp",
    "description": "Earn $50/hr from home. Deposit corporate checks to purchase home office equipment.",
    "location": "Remote",
    "source": "LinkedIn",
    "source_url": "https://www.linkedin.com/jobs/view/123456",
    "email": "hiring.globallogistics@gmail.com"
  }
  ```

**Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "analysis_id": "ef001570-3c75-49fe-b33e-d206f347bd9c",
    "job": {
      "id": "21d53c33-0038-4deb-9358-daf6157f94ae",
      "title": "Data Entry Clerk",
      "company": "Global Logistics Corp"
    },
    "analysis": {
      "final_score": 74,
      "risk_level": "HIGH",
      "prediction": "SUSPICIOUS",
      "confidence": 0.92,
      "explanation": "High score due to upfront check deposit requests and mismatched recruiter email domain.",
      "analyzed_at": "2026-08-12T07:35:45.428458",
      "flags": [
        {
          "message": "Deposit corporate check instructions detected.",
          "severity": "CRITICAL",
          "evidence": "Deposit corporate checks"
        }
      ]
    }
  }
}
```

---

## 4. Analysis History & Dashboard

### `GET /analyses`
Retrieves a paginated list of analyses completed by the authenticated user.
- **Headers**: `Authorization: Bearer <token>` (Required)
- **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Number of items per page (default: `20`)
  - `risk_level`: Filter by risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "analysis_id": "ef001570-3c75-49fe-b33e-d206f347bd9c",
        "job": {
          "id": "21d53c33-0038-4deb-9358-daf6157f94ae",
          "title": "Data Entry Clerk",
          "company": "Global Logistics Corp"
        },
        "analysis": {
          "final_score": 74,
          "risk_level": "HIGH",
          "prediction": "SUSPICIOUS",
          "analyzed_at": "2026-08-12T07:35:45.428458"
        }
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### `GET /analyses/<analysis_id>`
Retrieves the full details of a specific analysis by ID.
- **Headers**: `Authorization: Bearer <token>` (Required)

**Response `200 OK`**:
*(Same analysis body structure as `POST /analyze` data payload)*

---

### `GET /dashboard/summary`
Provides aggregate metrics derived from the authenticated user's scanning history.
- **Headers**: `Authorization: Bearer <token>` (Required)

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "total_analyses": 42,
    "average_score": 28.5,
    "risk_distribution": {
      "low": 20,
      "medium": 10,
      "high": 8,
      "critical": 4
    },
    "recent_analyses": [
      {
        "analysis_id": "ef001570-3c75-49fe-b33e-d206f347bd9c",
        "job": {
          "id": "21d53c33-0038-4deb-9358-daf6157f94ae",
          "title": "Data Entry Clerk",
          "company": "Global Logistics Corp",
          "location": "Remote"
        },
        "analysis": {
          "final_score": 74,
          "risk_level": "HIGH",
          "prediction": "SUSPICIOUS",
          "analyzed_at": "2026-08-12T07:35:45.428458"
        }
      }
    ]
  }
}
```

---

## 5. Saved Jobs

### `POST /jobs/<job_id>/save`
Bookmarks a job listing for the authenticated user.
- **Headers**: `Authorization: Bearer <token>` (Required)

**Response `201 Created`**:
```json
{
  "success": true
}
```

---

### `DELETE /jobs/<job_id>/save`
Removes a saved job bookmark.
- **Headers**: `Authorization: Bearer <token>` (Required)

**Response `200 OK`**:
```json
{
  "success": true
}
```

---

### `GET /jobs/saved`
Retrieves a paginated list of saved jobs.
- **Headers**: `Authorization: Bearer <token>` (Required)
- **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Number of items per page (default: `20`)

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "job_id": "21d53c33-0038-4deb-9358-daf6157f94ae",
        "title": "Data Entry Clerk",
        "company": "Global Logistics Corp",
        "saved_at": "2026-08-12T07:45:00.123456"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

## 6. User Settings

### `GET /settings`
Retrieves user theme, email notification, and analysis mode preferences.
- **Headers**: `Authorization: Bearer <token>` (Required)

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "email_notifications": true,
    "default_analysis_mode": "balanced",
    "theme": "DARK"
  }
}
```

---

### `PUT /settings`
Updates settings preferences.
- **Headers**: `Authorization: Bearer <token>` (Required)
- **Request Body**:
  ```json
  {
    "email_notifications": false,
    "theme": "LIGHT"
  }
  ```

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "email_notifications": false,
    "default_analysis_mode": "balanced",
    "theme": "LIGHT"
  }
}
```

---

## 7. Error Mappings

Expected failures produce a standardized error response shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation description."
  }
}
```

| HTTP Code | Error Code | Description |
| :--- | :--- | :--- |
| **400** | `BAD_REQUEST` | Validation error, malformed JSON, or input payload schema violations. |
| **401** | `UNAUTHORIZED` | Bearer token is missing, invalid, or expired. |
| **403** | `FORBIDDEN` | Access is denied for the requested resource. |
| **404** | `NOT_FOUND` | Path route, job ID, or user analysis record not found. |
| **405** | `METHOD_NOT_ALLOWED` | Invalid HTTP method request. |
| **500** | `UNEXPECTED_ERROR` | Internal server exception. Exposes no stack traces. |
| **503** | `SERVICE_UNAVAILABLE` | Downstream ML classification backend is unreachable. |
