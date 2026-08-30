from flask import Blueprint, request, jsonify, g
from app.services.saved_job_service import SavedJobService
from app.utils.auth import require_auth

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/jobs/<job_id>/save', methods=['POST'])
@require_auth
def save_job(job_id):
    """
    Saves a job posting for the authenticated user.
    Returns 404 if the targeted job posting does not exist.
    """
    try:
        SavedJobService.save_job(user_id=g.current_user.id, job_id=job_id)
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": str(e)
            }
        }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while saving the job."
            }
        }), 500

    return jsonify({
        "success": True
    }), 201

@jobs_bp.route('/jobs/<job_id>/save', methods=['DELETE'])
@require_auth
def unsave_job(job_id):
    """
    Idempotently removes a saved job posting for the authenticated user.
    """
    try:
        SavedJobService.unsave_job(user_id=g.current_user.id, job_id=job_id)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while unsaving the job."
            }
        }), 500

    return jsonify({
        "success": True
    }), 200

@jobs_bp.route('/jobs/saved', methods=['GET'])
@require_auth
def get_saved_jobs():
    """
    Retrieves the authenticated user's saved jobs list with pagination support.
    """
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)

    try:
        result = SavedJobService.get_saved_jobs(
            user_id=g.current_user.id,
            page=page,
            limit=limit
        )
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while fetching saved jobs."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": result
    }), 200
