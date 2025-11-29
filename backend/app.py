from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from config import Config
from routes import register_socketio_handlers
import os

def create_app():
    """Application factory pattern for Flask app"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend
    cors_origins = Config.CORS_ALLOWED_ORIGINS
    if cors_origins == '*':
        CORS(app, resources={r"/*": {"origins": "*"}})
    else:
        # Production: specific origins only
        allowed_origins = cors_origins.split(',')
        CORS(app, resources={r"/*": {"origins": allowed_origins}})

    # Initialize Socket.IO with proper CORS
    socketio = SocketIO(
        app,
        cors_allowed_origins=cors_origins,
        async_mode='threading',
        logger=Config.DEBUG,
        engineio_logger=Config.DEBUG
    )

    # Register Socket.IO event handlers
    register_socketio_handlers(socketio)

    @app.route('/')
    def index():
        return {
            "message": "LiveTranslate API",
            "version": "2.0",
            "status": "running"
        }

    @app.route('/health')
    def health():
        return {"status": "healthy"}

    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    print("🚀 LiveTranslate server starting...")
    print(f"📡 Backend running on http://{Config.SERVER_HOST}:{Config.SERVER_PORT}")
    print(f"🌐 Frontend should connect to: http://localhost:{Config.SERVER_PORT}")
    socketio.run(
        app,
        host=Config.SERVER_HOST,
        port=Config.SERVER_PORT,
        debug=Config.DEBUG
    )
