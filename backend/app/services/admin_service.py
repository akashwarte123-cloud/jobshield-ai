"""
Admin Service — Phase B11.3
All methods operate on system-wide (global) data.
Authorization is enforced at the route boundary via @require_admin.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, case, distinct
from app.extensions import db
from app.models import User, Analysis, Job, SavedJob
from app.models.analysis import AnalysisFlag


# ---------------------------------------------------------------------------
# 1. Dashboard Summary
# ---------------------------------------------------------------------------

def get_dashboard_summary():
    """
    Return system-wide aggregate metrics for the admin dashboard.
    All counts come from SQL aggregation — no Python-side loops.
    """
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # ── User stats ──────────────────────────────────────────────────────────
    total_users = db.session.query(func.count(User.id)).scalar() or 0

    # ── Analysis stats ───────────────────────────────────────────────────────
    total_analyses = db.session.query(func.count(Analysis.id)).scalar() or 0

    analyses_today = (
        db.session.query(func.count(Analysis.id))
        .filter(Analysis.analyzed_at >= today_start)
        .scalar()
        or 0
    )

    avg_score = (
        db.session.query(func.avg(Analysis.final_score)).scalar()
    )
    average_score = round(float(avg_score), 1) if avg_score is not None else 0.0

    # ── Risk distribution (single SQL pass) ─────────────────────────────────
    risk_rows = (
        db.session.query(
            Analysis.risk_level,
            func.count(Analysis.id).label('cnt')
        )
        .group_by(Analysis.risk_level)
        .all()
    )
    risk_distribution = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0, 'CRITICAL': 0}
    for level, cnt in risk_rows:
        if level in risk_distribution:
            risk_distribution[level] = cnt

    # ── Job stats ────────────────────────────────────────────────────────────
    total_jobs = db.session.query(func.count(Job.id)).scalar() or 0

    # ── Weekly trends (last 7 days, database agnostic) ───────────────────────
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_dates = (
        db.session.query(Analysis.analyzed_at)
        .filter(Analysis.analyzed_at >= seven_days_ago)
        .all()
    )
    counts_by_day = {}
    for i in range(7):
        day_str = (datetime.now(timezone.utc) - timedelta(days=6 - i)).strftime('%Y-%m-%d')
        counts_by_day[day_str] = 0

    for (analyzed_at,) in recent_dates:
        if analyzed_at:
            day_str = analyzed_at.strftime('%Y-%m-%d')
            if day_str in counts_by_day:
                counts_by_day[day_str] += 1
            else:
                counts_by_day[day_str] = 1

    weekly_trends = [{'date': d, 'count': c} for d, c in sorted(counts_by_day.items())]

    dialect_name = getattr(getattr(db, 'engine', None), 'dialect', None)
    driver_name = dialect_name.name.lower() if dialect_name and hasattr(dialect_name, 'name') else 'postgresql'
    if 'postgres' in driver_name:
        database_type = 'PostgreSQL'
    elif 'sqlite' in driver_name:
        database_type = 'SQLite'
    else:
        database_type = driver_name.capitalize()

    return {
        'database_type': database_type,
        'users': {
            'total': total_users,
        },
        'analyses': {
            'total': total_analyses,
            'today': analyses_today,
        },
        'jobs': {
            'total': total_jobs,
        },
        'risk_distribution': risk_distribution,
        'average_score': average_score,
        'weekly_trends': weekly_trends,
    }


# ---------------------------------------------------------------------------
# 2. User List
# ---------------------------------------------------------------------------

def get_users(page=1, limit=20, search=None, role=None):
    """
    Paginated list of all users.
    Never exposes password_hash or any authentication secret.
    """
    limit = min(int(limit), 100)   # hard cap
    page  = max(int(page), 1)

    query = db.session.query(User)

    if search:
        pattern = f'%{search}%'
        query = query.filter(
            (User.name.ilike(pattern)) | (User.email.ilike(pattern))
        )

    if role and role in ('USER', 'ADMIN'):
        query = query.filter(User.role == role)

    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
             .offset((page - 1) * limit)
             .limit(limit)
             .all()
    )

    return {
        'page': page,
        'limit': limit,
        'total': total,
        'pages': max(1, -(-total // limit)),   # ceiling division
        'users': [_safe_user(u) for u in users],
    }


def _safe_user(user):
    """Return only safe public account fields — never password_hash."""
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    }


# ---------------------------------------------------------------------------
# 3. User Details
# ---------------------------------------------------------------------------

def get_user_details(user_id):
    """
    Full account details for one user including aggregate stats.
    Returns None if the user does not exist.
    """
    user = db.session.get(User, user_id)
    if not user:
        return None

    total_analyses = (
        db.session.query(func.count(Analysis.id))
        .filter(Analysis.user_id == user_id)
        .scalar()
        or 0
    )
    saved_jobs_count = (
        db.session.query(func.count(SavedJob.id))
        .filter(SavedJob.user_id == user_id)
        .scalar()
        or 0
    )

    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'updated_at': user.updated_at.isoformat() if user.updated_at else None,
        'stats': {
            'total_analyses': total_analyses,
            'saved_jobs_count': saved_jobs_count,
        },
    }


# ---------------------------------------------------------------------------
# 4. All Analyses (global)
# ---------------------------------------------------------------------------

def get_analyses(page=1, limit=20, risk_level=None):
    """
    Paginated list of all analyses across every user.
    Uses a JOIN to avoid N+1 queries when fetching user/job names.
    """
    VALID_RISK = {'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'}
    limit = min(int(limit), 100)
    page  = max(int(page), 1)

    query = (
        db.session.query(Analysis, User.name.label('user_name'), Job.title.label('job_title'), Job.company)
        .outerjoin(User, Analysis.user_id == User.id)
        .join(Job, Analysis.job_id == Job.id)
    )

    if risk_level and risk_level.upper() in VALID_RISK:
        query = query.filter(Analysis.risk_level == risk_level.upper())

    total = query.count()
    rows = (
        query.order_by(Analysis.analyzed_at.desc())
             .offset((page - 1) * limit)
             .limit(limit)
             .all()
    )

    analyses = []
    for analysis, user_name, job_title, company in rows:
        analyses.append({
            'analysis_id': analysis.id,
            'user_id': analysis.user_id,
            'user_name': user_name,
            'job_id': analysis.job_id,
            'job_title': job_title,
            'company': company,
            'ml_score': analysis.ml_score,
            'rule_score': analysis.rule_score,
            'final_score': analysis.final_score,
            'risk_level': analysis.risk_level,
            'prediction': analysis.prediction,
            'analyzed_at': analysis.analyzed_at.isoformat() if analysis.analyzed_at else None,
        })

    return {
        'page': page,
        'limit': limit,
        'total': total,
        'pages': max(1, -(-total // limit)),
        'analyses': analyses,
    }


# ---------------------------------------------------------------------------
# 5. Job Statistics
# ---------------------------------------------------------------------------

def get_job_statistics():
    """
    Real database-driven job aggregates.
    Only metrics that are meaningful from the current schema are included.
    """
    total_jobs = db.session.query(func.count(Job.id)).scalar() or 0

    total_saved = db.session.query(func.count(SavedJob.id)).scalar() or 0

    # Jobs that have at least one analysis record
    jobs_with_analyses = (
        db.session.query(func.count(distinct(Analysis.job_id))).scalar() or 0
    )

    return {
        'total_jobs': total_jobs,
        'total_saved_job_entries': total_saved,
        'jobs_with_analyses': jobs_with_analyses,
    }


# ---------------------------------------------------------------------------
# 6. System Health
# ---------------------------------------------------------------------------

def get_system_health():
    """
    Lightweight system health check.
    - Database: execute a cheap scalar query.
    - ML service: try a TCP-level connect to NODE_ML_URL; no analysis run.
    - API: always OK if this function executes.
    Does NOT expose internal URLs, credentials, or stack traces.
    """
    from flask import current_app
    from sqlalchemy import text as sql_text

    # ── Database ─────────────────────────────────────────────────────────────
    db_status = 'ok'
    db_detail = None
    try:
        db.session.execute(sql_text('SELECT 1'))
    except Exception as exc:
        db_status = 'error'
        db_detail = 'Database connection failed.'
        current_app.logger.error("Admin health: DB error: %s", exc)

    # ── ML service (GET check to /health endpoint) ───────────────────────────
    ml_status = 'unknown'
    try:
        import urllib.request
        from urllib.parse import urlparse
        ml_url = current_app.config.get('NODE_ML_URL', '')
        # Construct the health check URL (/health) from the ML URL's origin
        parsed_url = urlparse(ml_url)
        health_url = f"{parsed_url.scheme}://{parsed_url.netloc}/health"
        
        req = urllib.request.Request(health_url, method='GET')
        with urllib.request.urlopen(req, timeout=2) as resp:
            ml_status = 'ok' if resp.status < 400 else 'degraded'
    except Exception:
        # Connection refused / timeout / error → report as degraded.
        ml_status = 'degraded'

    result = {
        'database': {'status': db_status},
        'ml_service': {'status': ml_status},
        'api': {'status': 'ok'},
    }
    if db_detail:
        result['database']['detail'] = db_detail

    return result
