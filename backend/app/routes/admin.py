"""
Admin Routes — Phase B11.3
Every endpoint is protected by @require_auth + @require_admin.
Routes are intentionally read-only in this phase.
"""
from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth, require_admin
from app.services import admin_service

admin_bp = Blueprint('admin', __name__)


# ---------------------------------------------------------------------------
# Helper: structured success envelope
# ---------------------------------------------------------------------------
def _ok(data, status=200):
    return jsonify({'success': True, 'data': data}), status


def _err(code, message, status):
    return jsonify({
        'success': False,
        'error': {'code': code, 'message': message}
    }), status


# ---------------------------------------------------------------------------
# GET /admin/dashboard/summary
# ---------------------------------------------------------------------------
@admin_bp.route('/admin/dashboard/summary', methods=['GET'])
@require_auth
@require_admin
def admin_dashboard_summary():
    """System-wide aggregate metrics for the admin dashboard."""
    return _ok(admin_service.get_dashboard_summary())


# ---------------------------------------------------------------------------
# GET /admin/users
# ---------------------------------------------------------------------------
@admin_bp.route('/admin/users', methods=['GET'])
@require_auth
@require_admin
def admin_list_users():
    """Paginated list of all users. Supports ?page, ?limit, ?search, ?role."""
    page   = request.args.get('page',  1,  type=int)
    limit  = request.args.get('limit', 20, type=int)
    search = request.args.get('search', None)
    role   = request.args.get('role',   None)
    return _ok(admin_service.get_users(page=page, limit=limit,
                                       search=search, role=role))


# ---------------------------------------------------------------------------
# GET /admin/users/<user_id>
# ---------------------------------------------------------------------------
@admin_bp.route('/admin/users/<user_id>', methods=['GET'])
@require_auth
@require_admin
def admin_get_user(user_id):
    """Full account details + aggregate stats for a single user."""
    details = admin_service.get_user_details(user_id)
    if details is None:
        return _err('NOT_FOUND', 'User not found.', 404)
    return _ok(details)


# ---------------------------------------------------------------------------
# GET /admin/analyses
# ---------------------------------------------------------------------------
@admin_bp.route('/admin/analyses', methods=['GET'])
@require_auth
@require_admin
def admin_list_analyses():
    """Paginated list of ALL analyses across all users. Supports ?page, ?limit, ?risk_level."""
    page       = request.args.get('page',       1,  type=int)
    limit      = request.args.get('limit',      20, type=int)
    risk_level = request.args.get('risk_level', None)
    return _ok(admin_service.get_analyses(page=page, limit=limit,
                                          risk_level=risk_level))


# ---------------------------------------------------------------------------
# GET /admin/jobs/statistics
# ---------------------------------------------------------------------------
@admin_bp.route('/admin/jobs/statistics', methods=['GET'])
@require_auth
@require_admin
def admin_job_statistics():
    """Real database-driven job aggregate statistics."""
    return _ok(admin_service.get_job_statistics())


# ---------------------------------------------------------------------------
# GET /admin/system/health
# ---------------------------------------------------------------------------
@admin_bp.route('/admin/system/health', methods=['GET'])
@require_auth
@require_admin
def admin_system_health():
    """Lightweight system health check — database, ML service, API."""
    return _ok(admin_service.get_system_health())
