import logging
import sys

def setup_logging(app):
    """Sets up unified logging for the Flask application."""
    log_level = logging.INFO
    if app.debug:
        log_level = logging.DEBUG
        
    # Create standard stream handler for console outputs
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    
    # Unified log format
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    handler.setFormatter(formatter)
    
    # Configure Flask app logger
    app.logger.setLevel(log_level)
    
    # Clean previous handlers to prevent duplicate lines
    if app.logger.hasHandlers():
        app.logger.handlers.clear()
        
    app.logger.addHandler(handler)
    app.logger.info("Logging system initialized (Level: %s)", logging.getLevelName(log_level))
