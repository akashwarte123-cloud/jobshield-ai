import os

class Config:
    """Base Configuration class."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-key-jobshield-fallback')
    API_PREFIX = '/api/v1'
    
    # SQLAlchemy & Database configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    _db_url = os.getenv('DATABASE_URL', 'sqlite:///jobshield.db')
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    
    # JWT Configurations
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-jobshield-2026')
    JWT_EXPIRATION_MINUTES = int(os.getenv('JWT_EXPIRATION_MINUTES', 60))
    
    # Node.js ML Service integration endpoint
    NODE_ML_URL = os.getenv('NODE_ML_URL', 'none')
    
    # CORS (Parsed as list from comma-separated string)
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in os.getenv('CORS_ORIGINS', '').split(',') if origin.strip()
    ]

class DevelopmentConfig(Config):
    """Development Configuration."""
    DEBUG = True
    ENV = 'development'

class TestingConfig(Config):
    """Testing Configuration."""
    TESTING = True
    DEBUG = True
    ENV = 'testing'
    NODE_ML_URL = 'http://127.0.0.1:5000/api/v1/analyze'
    # Use memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # Use minimal PBKDF2 rounds so generate_password_hash is near-instant in tests.
    # This does NOT affect production security — it only applies when TESTING=True.
    WERKZEUG_PBKDF2_ROUNDS = 1

class ProductionConfig(Config):
    """Production Configuration."""
    DEBUG = False
    TESTING = False
    ENV = 'production'
    # Ensure production configurations enforce security constraints if required
    # CORS allowed origins must be explicitly set, no wildcard defaults.

# Mapping config names to classes
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
