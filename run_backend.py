"""
Convenience script to run the backend server
Usage: python run_backend.py
"""

if __name__ == '__main__':
    import sys
    import os

    # Add parent directory to path so backend module can be imported
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    from backend.app import create_app
    from backend.config import Config

    app, socketio = create_app()
    print("🚀 LiveTranslate server starting...")
    print(f"📡 Backend running on http://{Config.SERVER_HOST}:{Config.SERVER_PORT}")
    print(f"🌐 Frontend should connect to: http://localhost:{Config.SERVER_PORT}")

    if Config.DEBUG:
        print("\n✨ Available languages:")
        from backend.config import get_all_languages
        for lang in get_all_languages():
            print(f"  - {lang['name']} ({lang['native_name']})")

    print("\nPress Ctrl+C to stop the server\n")

    socketio.run(
        app,
        host=Config.SERVER_HOST,
        port=Config.SERVER_PORT,
        debug=Config.DEBUG,
        allow_unsafe_werkzeug=True
    )
