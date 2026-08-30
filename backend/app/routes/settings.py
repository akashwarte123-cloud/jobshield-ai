from flask import Blueprint, request, jsonify, g
from app.services.settings_service import SettingsService
from app.utils.auth import require_auth

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings', methods=['GET'])
@require_auth
def get_user_settings():
    """
    Retrieves authenticated user's current settings profile.
    """
    try:
        data = SettingsService.get_settings(user_id=g.current_user.id)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while fetching user settings."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": data
    }), 200

@settings_bp.route('/settings', methods=['PUT'])
@require_auth
def update_user_settings():
    """
    Updates the authenticated user's settings profile.
    Accepts partial updates.
    """
    if not request.is_json:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request body must be a valid JSON payload."
            }
        }), 400

    updates = request.get_json() or {}

    try:
        data = SettingsService.update_settings(user_id=g.current_user.id, updates=updates)
    except ValueError as e:
        # Catch validation errors and map to standard response
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while updating settings."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": data
    }), 200
