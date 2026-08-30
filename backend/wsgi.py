import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app

env_mode = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name=env_mode)

if __name__ == '__main__':
    host = os.getenv('FLASK_RUN_HOST', '127.0.0.1')
    port = int(os.getenv('FLASK_RUN_PORT', 8000))
    app.run(host=host, port=port, debug=False)
