from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import google.generativeai as genai
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

from dotenv import load_dotenv

load_dotenv() # This loads the .env file
api_key = os.getenv("GOOGLE_API_KEY") # This reads the key safely

# Configure Gemini
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

@app.route('/')
def index():
    return render_template('index.html')

# 1. Signaling for Video (Pass-through)
@socketio.on('join-room')
def handle_join(data):
    emit('user-connected', data['userId'], broadcast=True, include_self=False)

# 2. The AI Translation Handler
@socketio.on('audio-chunk')
def handle_audio(data):
    # In a real 3-hour hack, sending raw audio is risky. 
    # FASTER HACK: Send text from browser SpeechRecognition, translate here.
    # If you MUST do audio: You need to accumulate chunks and send to Gemini.

    # Simpler Path for < 3 hours: Text-to-Text Translation
    text = data.get('text')
    target_lang = data.get('target_lang', 'Spanish')

    response = model.generate_content(f"Translate this to {target_lang}: {text}")
    emit('translation-result', {'original': text, 'translated': response.text})

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)