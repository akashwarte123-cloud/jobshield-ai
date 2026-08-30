import os
from flask import Flask, jsonify
from .config import config_by_name
from .extensions import db, migrate, cors
from .utils import setup_logging
from .routes import api_v1_bp

# Import models to register their metadata with SQLAlchemy/Alembic
from . import models

# SQLite foreign key constraint enforcement listener
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if dbapi_connection.__class__.__name__ == 'Connection' or 'sqlite' in str(type(dbapi_connection)).lower():
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception:
            pass


def create_app(config_name=None):
    """Application factory for the Flask backend."""
    app = Flask(__name__)
    
    # Determine configuration class
    if not config_name:
        config_name = os.getenv('FLASK_ENV', 'development').lower()
    
    config_class = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(config_class)

    # Hardening: Enforce production security check constraints
    if config_name == 'production' or app.config.get('ENV') == 'production':
        jwt_secret = app.config.get('JWT_SECRET_KEY')
        if not jwt_secret or jwt_secret == 'default-jwt-secret-jobshield-2026':
            raise ValueError("Production configuration error: JWT_SECRET_KEY must be set to a secure custom value and cannot use the development fallback key.")
        origins = app.config.get('CORS_ALLOWED_ORIGINS', [])
        if not origins:
            raise ValueError("Production configuration error: CORS_ALLOWED_ORIGINS must be explicitly configured and cannot be empty.")
        if "*" in origins:
            raise ValueError("Production configuration error: Wildcard CORS (*) origin is strictly prohibited in production config.")
        secret_key = app.config.get('SECRET_KEY')
        if not secret_key or secret_key in ['default-key-jobshield-fallback', 'dev-secret-key-jobshield-2026']:
            raise ValueError("Production configuration error: SECRET_KEY must be set to a secure custom value and cannot use the development fallback key.")
    
    # Initialize Logging
    setup_logging(app)
    
    # Initialize Extensions (Do NOT call db.create_all())
    db.init_app(app)
    migrate.init_app(app, db)
    app.logger.info("Database and Migrate extensions initialized.")
    
    # CORS Configuration
    # Safe fallback if CORS_ALLOWED_ORIGINS is not set or empty
    origins = app.config.get('CORS_ALLOWED_ORIGINS', [])
    if not origins and app.config.get('ENV') != 'production':
        origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    app.logger.info("CORS initialized with allowed origins: %s", origins)
    
    # Register blueprints with api version prefix
    api_prefix = app.config.get('API_PREFIX', '/api/v1')
    app.register_blueprint(api_v1_bp, url_prefix=api_prefix)
    app.logger.info("API blueprints registered under prefix: %s", api_prefix)

    # Speed up tests: replace bcrypt/PBKDF2 with a near-instant hash in test mode.
    # werkzeug.security.generate_password_hash defaults to 260,000 PBKDF2 iterations
    # which adds ~0.1-0.2s per call. In tests we only care that hashes round-trip,
    # not that they are slow — so override to 1 round.
    if app.config.get('TESTING'):
        import werkzeug.security as _ws
        _ws.PBKDF2_ROUNDS = 1  # type: ignore[attr-defined]

    # Centralized Error Handlers
    register_error_handlers(app)

    return app

def register_error_handlers(app):
    """Registers standard HTTP error handlers returning structured JSON."""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": error.description or "Invalid request parameters."
            }
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": error.description or "Authentication credentials missing or invalid."
            }
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "FORBIDDEN",
                "message": error.description or "Access to the requested resource is denied."
            }
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": error.description or "The requested URL was not found on the server."
            }
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": error.description or "The method is not allowed for the requested URL."
            }
        }), 405

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error("Internal Server Error: %s", str(error))
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred while processing the request."
            }
        }), 500
        
    @app.errorhandler(Exception)
    def handle_unhandled_exception(e):
        app.logger.error("Unhandled Exception: %s", str(e), exc_info=True)
        return jsonify({
            "success": False,
            "error": {
                "code": "UNEXPECTED_ERROR",
                "message": "An unexpected error occurred."
            }
        }), 500
