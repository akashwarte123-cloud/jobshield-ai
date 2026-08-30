import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import current_app, request, jsonify, g, abort
from app.models import User

def generate_token(user_id):
    """Generates a JWT for the specified user_id."""
    try:
        secret = current_app.config['JWT_SECRET_KEY']
        duration = current_app.config['JWT_EXPIRATION_MINUTES']
        
        payload = {
            'exp': datetime.now(timezone.utc) + timedelta(minutes=duration),
            'iat': datetime.now(timezone.utc),
            'sub': str(user_id)
        }
        
        return jwt.encode(payload, secret, algorithm='HS256')
    except Exception as e:
        current_app.logger.error("Error generating token: %s", str(e))
        raise e

def decode_token(token):
    """Decodes a JWT and returns the subject (user_id)."""
    secret = current_app.config['JWT_SECRET_KEY']
    try:
        payload = jwt.decode(token, secret, options={"require": ["exp", "iat"]}, algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Expired token signature presented.")
        raise jwt.ExpiredSignatureError("Token has expired.")
    except jwt.InvalidTokenError as e:
        current_app.logger.warning("Invalid token presented: %s", str(e))
        raise jwt.InvalidTokenError("Invalid token.")

def require_auth(f):
    """Decorator to require JWT authentication on endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            abort(401, description="Missing Authorization header.")
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            abort(401, description="Authorization header must be in 'Bearer <token>' format.")
            
        token = parts[1]
        
        try:
            user_id = decode_token(token)
        except jwt.ExpiredSignatureError:
            abort(401, description="Your session has expired. Please log in again.")
        except jwt.InvalidTokenError:
            abort(401, description="Access token is invalid or signature verification failed.")
            
        # Resolve user from database
        user = User.query.get(user_id)
        if not user:
            abort(401, description="The user account associated with this token no longer exists.")
            
        # Attach user to context local global 'g'
        g.current_user = user
        return f(*args, **kwargs)
        
    return decorated

def resolve_optional_auth():
    """
    Attempts to resolve user identity from an optional Authorization header.
    If the header is entirely missing, returns None.
    If the header is present but invalid/expired/malformed, aborts with 401.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
        
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        abort(401, description="Authorization header must be in 'Bearer <token>' format.")
        
    token = parts[1]
    
    try:
        user_id = decode_token(token)
    except jwt.ExpiredSignatureError:
        abort(401, description="Your session has expired. Please log in again.")
    except jwt.InvalidTokenError:
        abort(401, description="Access token is invalid or signature verification failed.")
        
    user = User.query.get(user_id)
    if not user:
        abort(401, description="The user account associated with this token no longer exists.")
        
    return user


def require_admin(f):
    """Decorator to require ADMIN role on endpoints.
    Must be applied AFTER (i.e. listed BEFORE) @require_auth so that
    g.current_user is already populated when this check runs.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # require_auth will already have set g.current_user
        user = getattr(g, 'current_user', None)
        if user is None or user.role != 'ADMIN':
            return jsonify({
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Administrator access is required for this resource."
                }
            }), 403
        return f(*args, **kwargs)
    return decorated
