from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

# Instantiated cleanly without binding to any app.
# Initialization will happen during factory step, but DB connections remain unconfigured.
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
