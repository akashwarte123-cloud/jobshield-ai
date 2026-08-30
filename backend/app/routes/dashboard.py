from flask import Blueprint, jsonify, g
from app.services.dashboard_service import DashboardService
from app.utils.auth import require_auth

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/summary', methods=['GET'])
@require_auth
def get_dashboard_summary():
    """
    Retrieves SQL-aggregated statistics for the authenticated user's dashboard.
    """
    try:
        result = DashboardService.get_summary(user_id=g.current_user.id)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while loading the dashboard statistics."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": result
    }), 200
