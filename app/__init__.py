import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Initialize extensions
_db = SQLAlchemy()

def create_app() -> Flask:
    load_dotenv()

    app = Flask(__name__, instance_relative_config=True)

    # Ensure instance folder exists for SQLite db
    os.makedirs(app.instance_path, exist_ok=True)

    # Config
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    default_sqlite_path = os.path.join(app.instance_path, "app.db")
    database_url = os.getenv("DATABASE_URL", f"sqlite:///{default_sqlite_path}")
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    _db.init_app(app)

    # Register routes
    from .routes import bp as routes_bp
    app.register_blueprint(routes_bp)

    # Create DB tables on first run
    with app.app_context():
        from . import models  # noqa: F401
        _db.create_all()

    return app

# Expose db for models
DbSession = _db