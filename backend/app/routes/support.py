from flask import Blueprint, request, jsonify, g
from app.utils.auth import require_auth, require_admin
from app.models import SupportTicket, User
from app.extensions import db

support_bp = Blueprint('support', __name__)

@support_bp.route('/support/tickets', methods=['POST'])
@require_auth
def create_ticket():
    """Allows authenticated USER/ADMIN accounts to submit a support ticket."""
    data = request.get_json() or {}
    
    subject = data.get('subject')
    message = data.get('message')
    
    # 1. Validation
    if subject is None or message is None:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Subject and message are required."
            }
        }), 400
        
    subject = str(subject).strip()
    message = str(message).strip()
    
    if not subject or not message:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Subject and message cannot be empty."
            }
        }), 400
        
    if len(subject) > 255:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Subject must be under 255 characters."
            }
        }), 400

    # 2. Store ticket with user_id from JWT
    user_id = g.current_user.id
    
    try:
        ticket = SupportTicket(
            user_id=user_id,
            subject=subject,
            message=message,
            status='OPEN'
        )
        db.session.add(ticket)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while creating your ticket."
            }
        }), 500
        
    return jsonify({
        "success": True,
        "data": {
            "id": ticket.id,
            "user_id": ticket.user_id,
            "subject": ticket.subject,
            "message": ticket.message,
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
    }), 201


@support_bp.route('/support/tickets', methods=['GET'])
@require_auth
def get_user_tickets():
    """Returns only the authenticated user's support tickets."""
    user_id = g.current_user.id
    tickets = SupportTicket.query.filter_by(user_id=user_id).order_by(SupportTicket.created_at.desc()).all()
    
    data = []
    for t in tickets:
        data.append({
            "id": t.id,
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        })
        
    return jsonify({
        "success": True,
        "data": data
    }), 200


@support_bp.route('/admin/support/tickets', methods=['GET'])
@require_auth
@require_admin
def admin_get_tickets():
    """Allows administrators to retrieve and paginate support tickets."""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    
    if page < 1 or limit < 1 or limit > 100:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Invalid page or limit parameters."
            }
        }), 400
        
    query = SupportTicket.query
    if status:
        status = status.upper().strip()
        if status not in ['OPEN', 'IN_PROGRESS', 'RESOLVED']:
            return jsonify({
                "success": False,
                "error": {
                    "code": "BAD_REQUEST",
                    "message": "Invalid status filter."
                }
            }), 400
        query = query.filter_by(status=status)
        
    pagination = query.order_by(SupportTicket.created_at.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )
    
    items = []
    for t in pagination.items:
        # Fetch user information
        u = User.query.get(t.user_id)
        user_name = u.name if u else "Unknown"
        user_email = u.email if u else "Unknown"
        
        items.append({
            "id": t.id,
            "user_name": user_name,
            "user_email": user_email,
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        })
        
    return jsonify({
        "success": True,
        "data": {
            "items": items,
            "pagination": {
                "page": pagination.page,
                "limit": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages
            }
        }
    }), 200


@support_bp.route('/admin/support/tickets/<ticket_id>', methods=['PUT'])
@require_auth
@require_admin
def admin_update_ticket(ticket_id):
    """Allows administrators to update support ticket status."""
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested support ticket does not exist."
            }
        }), 404
        
    data = request.get_json() or {}
    status = data.get('status')
    
    if not status:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Status parameter is required."
            }
        }), 400
        
    status = str(status).upper().strip()
    if status not in ['OPEN', 'IN_PROGRESS', 'RESOLVED']:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Invalid status value. Must be OPEN, IN_PROGRESS, or RESOLVED."
            }
        }), 400
        
    try:
        ticket.status = status
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while updating the ticket."
            }
        }), 500
        
    return jsonify({
        "success": True,
        "message": "Ticket status updated successfully.",
        "data": {
            "id": ticket.id,
            "status": ticket.status,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
    }), 200
