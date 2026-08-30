from flask import Blueprint
from .health import health_bp
from .auth import auth_bp
from .analyze import analyze_bp
from .analyses import analyses_bp
from .jobs import jobs_bp
from .dashboard import dashboard_bp
from .settings import settings_bp
from .admin import admin_bp
from .support import support_bp

# Parent API Blueprint for v1 routing
api_v1_bp = Blueprint('api_v1', __name__)

# Register versioned endpoint blueprints
api_v1_bp.register_blueprint(health_bp)
api_v1_bp.register_blueprint(auth_bp)
api_v1_bp.register_blueprint(analyze_bp)
api_v1_bp.register_blueprint(analyses_bp)
api_v1_bp.register_blueprint(jobs_bp)
api_v1_bp.register_blueprint(dashboard_bp)
api_v1_bp.register_blueprint(settings_bp)
api_v1_bp.register_blueprint(admin_bp)
api_v1_bp.register_blueprint(support_bp)




