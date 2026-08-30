import os
import multiprocessing

# Server Socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker Processes
# Conservative worker default (2 workers) for small single-VM deployments; configurable via GUNICORN_WORKERS
default_workers = min(2, multiprocessing.cpu_count() * 2 + 1)
workers = int(os.getenv('GUNICORN_WORKERS', default_workers))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.getenv('LOG_LEVEL', 'info').lower()

# Process Naming
proc_name = 'jobshield_backend'

# Server Mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None
