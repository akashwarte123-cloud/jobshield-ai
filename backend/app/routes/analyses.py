from flask import Blueprint, request, jsonify, g
from app.services.analysis_history_service import AnalysisHistoryService
from app.utils.auth import require_auth

analyses_bp = Blueprint('analyses', __name__)

@analyses_bp.route('/analyses', methods=['GET'])
@require_auth
def get_analyses_history():
    """
    Retrieves authenticated user's past job analyses history list.
    Supports filtering by risk_level and pagination.
    """
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    risk_level = request.args.get('risk_level')

    try:
        result = AnalysisHistoryService.get_history(
            user_id=g.current_user.id,
            page=page,
            limit=limit,
            risk_level=risk_level
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
                "message": "An unexpected error occurred while fetching history."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": result
    }), 200

@analyses_bp.route('/analyses/<analysis_id>', methods=['GET'])
@require_auth
def get_single_analysis(analysis_id):
    """
    Retrieves full details of a single analysis owned by the authenticated user.
    Nonexistent or inaccessible records return a clean 404 response.
    """
    try:
        result = AnalysisHistoryService.get_analysis_detail(
            user_id=g.current_user.id,
            analysis_id=analysis_id
        )
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while fetching analysis details."
            }
        }), 500

    if not result:
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested analysis does not exist or you do not have permission to access it."
            }
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200

@analyses_bp.route('/analyses/history', methods=['DELETE'])
@require_auth
def delete_analyses_history():
    """
    Deletes all job analysis history records for the current authenticated user.
    Associated AnalysisFlags and genuinely orphaned Job records are deleted safely.
    """
    from app.extensions import db
    from app.models import Analysis, AnalysisFlag, Job, SavedJob
    
    user_id = g.current_user.id
    
    try:
        # 1. Retrieve all analyses for this user
        user_analyses = Analysis.query.filter_by(user_id=user_id).all()
        analysis_ids = [a.id for a in user_analyses]
        job_ids_to_check = list(set([a.job_id for a in user_analyses]))
        
        analyses_deleted = 0
        flags_deleted = 0
        orphaned_jobs_deleted = 0
        
        if analysis_ids:
            # 2. Delete associated flags
            flags_deleted = AnalysisFlag.query.filter(AnalysisFlag.analysis_id.in_(analysis_ids)).delete(synchronize_session=False)
            
            # 3. Delete analysis records
            analyses_deleted = Analysis.query.filter(Analysis.id.in_(analysis_ids)).delete(synchronize_session=False)
            
            # Flush changes to DB so checking job references is accurate
            db.session.flush()
            
            # 4. Check and delete orphaned Job records
            for job_id in job_ids_to_check:
                has_analyses = db.session.query(Analysis.id).filter_by(job_id=job_id).first() is not None
                has_saved = db.session.query(SavedJob.id).filter_by(job_id=job_id).first() is not None
                if not has_analyses and not has_saved:
                    db.session.query(Job).filter_by(id=job_id).delete(synchronize_session=False)
                    orphaned_jobs_deleted += 1
                    
        # Commit transaction atomically
        db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while deleting your scan history."
            }
        }), 500
        
    return jsonify({
        "success": True,
        "data": {
            "analyses_deleted": analyses_deleted,
            "flags_deleted": flags_deleted,
            "orphaned_jobs_deleted": orphaned_jobs_deleted
        }
    }), 200


@analyses_bp.route('/analyses/export/csv', methods=['GET'])
@require_auth
def export_analyses_csv():
    """
    Exports the authenticated user's scan history as an RFC 4180 CSV file.
    Includes proper UTF-8 BOM, character escaping, and security metadata.
    """
    from datetime import datetime, timezone
    from app.extensions import db
    from app.models import Analysis
    from app.services.export_service import ExportService
    from sqlalchemy.orm import joinedload, selectinload
    from flask import Response

    user_id = g.current_user.id
    try:
        analyses = db.session.query(Analysis)\
            .options(joinedload(Analysis.job), selectinload(Analysis.flags))\
            .filter_by(user_id=user_id)\
            .order_by(Analysis.analyzed_at.desc())\
            .all()

        csv_bytes = ExportService.generate_csv(analyses)
        filename = f"jobshield_scan_history_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"

        response = Response(csv_bytes, mimetype="text/csv; charset=utf-8")
        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        return response

    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"Failed to generate CSV export: {str(e)}"
            }
        }), 500


@analyses_bp.route('/analyses/export/pdf', methods=['GET'])
@require_auth
def export_analyses_pdf():
    """
    Exports the authenticated user's scan history as a publication-ready PDF document.
    Includes visual badges, confidence scores, WHOIS domain data, and forensic findings.
    """
    from datetime import datetime, timezone
    from app.extensions import db
    from app.models import Analysis
    from app.services.export_service import ExportService
    from sqlalchemy.orm import joinedload, selectinload
    from flask import Response

    user_id = g.current_user.id
    user_name = getattr(g.current_user, 'name', 'User')

    try:
        analyses = db.session.query(Analysis)\
            .options(joinedload(Analysis.job), selectinload(Analysis.flags))\
            .filter_by(user_id=user_id)\
            .order_by(Analysis.analyzed_at.desc())\
            .all()

        pdf_bytes = ExportService.generate_pdf(analyses, user_name=user_name)
        filename = f"jobshield_scan_history_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"

        response = Response(pdf_bytes, mimetype="application/pdf")
        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        response.headers["Content-Type"] = "application/pdf"
        return response

    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"Failed to generate PDF export: {str(e)}"
            }
        }), 500


@analyses_bp.route('/analyses/export', methods=['GET'])
@require_auth
def export_analyses():
    """Unified query parameter dispatcher supporting ?format=csv and ?format=pdf."""
    fmt = request.args.get('format', 'csv').lower()
    if fmt == 'pdf':
        return export_analyses_pdf()
    return export_analyses_csv()


