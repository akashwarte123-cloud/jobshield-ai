from flask import Blueprint, request, jsonify, abort
from app.services.analysis_service import AnalysisService
from app.services.verification_service import VerificationService
from app.services.ml_service import MLIntegrationError
from app.utils.auth import resolve_optional_auth

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_job():
    """
    Main job listing risk analysis endpoint.
    Supports both anonymous and JWT-authenticated analysis requests.
    """
    # 1. Handle optional authentication (if Authorization header is present)
    try:
        user = resolve_optional_auth()
    except Exception as e:
        # If token exists but fails resolution, propagate the 401 error directly
        # abort(401) will trigger custom 401 handler returning standard error format
        raise e

    # 2. Get JSON body
    if not request.is_json:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Request body must be a valid JSON payload."
            }
        }), 400

    job_data = request.get_json() or {}

    # 3. Call analysis orchestrator
    try:
        result = AnalysisService.analyze(job_data, user=user)
    except ValueError as e:
        # Request validation failed
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": str(e)
            }
        }), 400
    except MLIntegrationError as e:
        # ML Service connectivity or format mismatch failure
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVICE_UNAVAILABLE",
                "message": "The backend classification service is currently unavailable. Please try again later."
            }
        }), 503
    except Exception as e:
        # Unexpected internal server failure
        # Never expose raw stack traces or internal exception strings to clients
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while analyzing the job posting."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": result
    }), 201


@analyze_bp.route('/company/verify', methods=['GET'])
def verify_company():
    """
    Public company verification endpoint proxying checks to Node/Express verifier.
    """
    company_name = request.args.get('companyName', '')
    domain = request.args.get('domain', '')
    email = request.args.get('email', '')

    if not domain and not email:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Domain or email parameter is required."
            }
        }), 400

    result = VerificationService.verify(company_name, email, domain)
    return jsonify({
        "success": True,
        "data": result
    }), 200
