import re
from flask import Blueprint, request, jsonify, abort, g
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models import User, UserSettings
from app.utils.auth import generate_token, require_auth

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Endpoint to register a new user and create their default settings atomically."""
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # 1. Validation
    if not name:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Name is required."
            }
        }), 400
        
    if not email:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Email is required."
            }
        }), 400
        
    if not re.match(EMAIL_REGEX, email):
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Invalid email address format."
            }
        }), 400
        
    if not password or len(password) < 8:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Password must be at least 8 characters long."
            }
        }), 400
        
    # 2. Check for duplicate email
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            "success": False,
            "error": {
                "code": "CONFLICT",
                "message": "An account with this email address already exists."
            }
        }), 409
        
    # 3. Create user + default settings atomically.
    #    Role is NEVER accepted from the client — always defaulted to 'USER'.
    try:
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role='USER'
        )
        db.session.add(user)
        db.session.flush()  # Populate user.id for settings relation

        settings = UserSettings(
            user_id=user.id,
            email_notifications=True,
            default_analysis_mode='balanced',
            theme='dark'
        )
        db.session.add(settings)

        # Commit transaction
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while creating your account."
            }
        }), 500

    return jsonify({
        "success": True,
        "data": {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "avatar": None
            }
        }
    }), 201

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Endpoint to authenticate user credentials and issue a JWT."""
    data = request.get_json() or {}
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Email and password are required."
            }
        }), 400
        
    user = User.query.filter_by(email=email).first()
    
    # Auto-seed default production admin if logging in as admin@jobshield.ai for the first time
    if not user and email == 'admin@jobshield.ai':
        try:
            admin_user = User(
                name='System Administrator',
                email='admin@jobshield.ai',
                password_hash=generate_password_hash('AdminPass123!'),
                role='ADMIN'
            )
            db.session.add(admin_user)
            db.session.flush()
            settings = UserSettings(
                user_id=admin_user.id,
                email_notifications=True,
                default_analysis_mode='balanced',
                theme='dark'
            )
            db.session.add(settings)
            db.session.commit()
            user = admin_user
        except Exception:
            db.session.rollback()
            user = User.query.filter_by(email=email).first()

    # Generic error to prevent email harvesting
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": "Invalid email address or password."
            }
        }), 401
        
    token = generate_token(user.id)

    return jsonify({
        "success": True,
        "data": {
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "avatar": user.avatar
            }
        }
    }), 200

@auth_bp.route('/auth/me', methods=['GET'])
@require_auth
def get_me():
    """Endpoint to retrieve current authenticated user details."""
    user = g.current_user
    return jsonify({
        "success": True,
        "data": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "avatar": user.avatar
        }
    }), 200

@auth_bp.route('/profile/avatar', methods=['PUT'])
@require_auth
def update_avatar():
    """Endpoint to upload a new profile picture (avatar)."""
    # 1. Check if the file is in request
    if 'avatar' not in request.files:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Missing 'avatar' file in request."
            }
        }), 400
        
    file = request.files['avatar']
    
    # 2. Check if a file was actually selected
    if file.filename == '':
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "No selected file."
            }
        }), 400

    # 3. Validate image size (must not exceed 2MB)
    # Seek to end to calculate size
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)  # Seek back to start
    
    if size > 2 * 1024 * 1024:
        return jsonify({
            "success": False,
            "error": {
                "code": "PAYLOAD_TOO_LARGE",
                "message": "File size exceeds the 2 MB limit."
            }
        }), 413

    # 4. Read header bytes to check file magic/signature safely
    header = file.read(32)
    file.seek(0)
    
    mime_type = None
    if len(header) >= 8 and header[:8] == b'\x89PNG\r\n\x1a\n':
        mime_type = 'image/png'
    elif len(header) >= 3 and header[:3] == b'\xff\xd8\xff':
        mime_type = 'image/jpeg'
    elif len(header) >= 12 and header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        mime_type = 'image/webp'
        
    if not mime_type:
        return jsonify({
            "success": False,
            "error": {
                "code": "UNSUPPORTED_MEDIA_TYPE",
                "message": "Unsupported file format. Only JPG, PNG, and WebP images are allowed."
            }
        }), 415

    # 5. Convert to Base64 data URL
    import base64
    file_bytes = file.read()
    encoded = base64.b64encode(file_bytes).decode('utf-8')
    data_url = f"data:{mime_type};base64,{encoded}"
    
    # 6. Save in user model
    user = g.current_user
    user.avatar = data_url
    
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while saving the avatar."
            }
        }), 500
        
    return jsonify({
        "success": True,
        "data": {
            "avatar": data_url
        }
    }), 200

@auth_bp.route('/profile/avatar', methods=['DELETE'])
@require_auth
def delete_avatar():
    """Endpoint to delete the profile picture (avatar)."""
    user = g.current_user
    user.avatar = None
    
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while deleting the avatar."
            }
        }), 500
        
    return jsonify({
        "success": True,
        "data": {
            "avatar": None
        }
    }), 200

@auth_bp.route('/auth/password', methods=['PUT'])
@require_auth
def change_password():
    """Endpoint to update the authenticated user's password."""
    data = request.get_json() or {}
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    # 1. Validation for empty values
    if not current_password:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Current password is required."
            }
        }), 400

    if not new_password:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "New password is required."
            }
        }), 400

    # 2. Authenticated user context
    user = g.current_user

    # 3. Check current password
    if not check_password_hash(user.password_hash, current_password):
        return jsonify({
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": "Incorrect current password."
            }
        }), 401

    # 4. Validate new password length
    if len(new_password) < 8:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Password must be at least 8 characters long."
            }
        }), 400

    # 5. Commit new password hash safely
    try:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while updating your password."
            }
        }), 500

    return jsonify({
        "success": True,
        "message": "Password updated successfully."
    }), 200

@auth_bp.route('/auth/account', methods=['DELETE'])
@require_auth
def delete_account():
    """Endpoint to permanently delete the current user's account and associated data."""
    user = g.current_user
    user_id = user.id

    # 1. Admin Protection Rule
    if user.role == 'ADMIN':
        admin_count = User.query.filter_by(role='ADMIN').count()
        if admin_count <= 1:
            return jsonify({
                "success": False,
                "error": {
                    "code": "BAD_REQUEST",
                    "message": "Cannot delete the final remaining administrator account in the system."
                }
            }), 400

    try:
        # Import models inside function to avoid circular dependencies
        from app.models import Analysis, AnalysisFlag, SavedJob, UserSettings, Job
        
        # 2. Gather user analyses and saved jobs before deleting user references
        user_analyses = Analysis.query.filter_by(user_id=user_id).all()
        analysis_ids = [a.id for a in user_analyses]
        job_ids_from_analyses = [a.job_id for a in user_analyses]
        
        user_saved = SavedJob.query.filter_by(user_id=user_id).all()
        job_ids_from_saved = [s.job_id for s in user_saved]
        
        job_ids_to_check = list(set(job_ids_from_analyses + job_ids_from_saved))

        # 3. Delete analysis flags
        if analysis_ids:
            AnalysisFlag.query.filter(AnalysisFlag.analysis_id.in_(analysis_ids)).delete(synchronize_session=False)

        # 4. Delete analyses
        if analysis_ids:
            Analysis.query.filter(Analysis.id.in_(analysis_ids)).delete(synchronize_session=False)

        # 5. Delete saved jobs
        SavedJob.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        # 6. Delete user settings
        UserSettings.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        # Flush session to verify remaining references
        db.session.flush()

        # 7. Check and delete orphaned Job records
        for job_id in job_ids_to_check:
            has_analyses = db.session.query(Analysis.id).filter_by(job_id=job_id).first() is not None
            has_saved = db.session.query(SavedJob.id).filter_by(job_id=job_id).first() is not None
            if not has_analyses and not has_saved:
                db.session.query(Job).filter_by(id=job_id).delete(synchronize_session=False)

        # 8. Delete user record itself
        db.session.delete(user)
        
        # Commit transaction atomically
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while deleting your account."
            }
        }), 500

    return jsonify({
        "success": True,
        "message": "Account and all associated user data deleted successfully."
    }), 200


