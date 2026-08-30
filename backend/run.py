import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

from app import create_app

env_mode = os.getenv('FLASK_ENV', 'development').lower()
app = create_app(config_name=env_mode)

if __name__ == '__main__':
    host = os.getenv('FLASK_RUN_HOST', '127.0.0.1')
    port = int(os.getenv('FLASK_RUN_PORT', 8000))
    is_prod = env_mode == 'production'
    debug = not is_prod and (os.getenv('FLASK_DEBUG', 'True').lower() in ['true', '1', 't'])
    
    app.run(host=host, port=port, debug=debug)
