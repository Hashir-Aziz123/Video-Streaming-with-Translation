import os
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Setup
load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

api_key = os.getenv("GOOGLE_API_KEY")

# 2. Configure Gemini for SPEED
genai.configure(api_key=api_key)

generation_config = {
    "temperature": 0.0,          # Zero creativity = Faster, direct answers
    "max_output_tokens": 50,     # Cuts off long explanations instantly
}

# We use 'gemini-2.0-flash' because you confirmed this exists in your list
model = genai.GenerativeModel(
    model_name='gemini-2.0-flash', 
    generation_config=generation_config
)

@app.route('/')
def index():
    return render_template('index.html')

# 3. Signaling (Video)
@socketio.on('join-room')
def handle_join(data):
    emit('user-connected', data['userId'], broadcast=True, include_self=False)

# 4. The AI Translation (Optimized)
@socketio.on('audio-chunk')
def handle_audio(data):
    text = data.get('text')
    target_lang = data.get('target_lang', 'Spanish')
    
    if not text:
        return

    print(f"🎤 Input: {text}")

    # FEW-SHOT PROMPT:
    # We give examples so it knows strictly to translate, not explain.
    prompt = f"""
    Task: Translate to {target_lang}.
    Rule: Return ONLY the translated text. No notes.

    Examples:
    Input: Hello there
    Output: Hola
    Input: How are you doing?
    Output: ¿Cómo estás?
    
    Input: {text}
    Output:"""

    try:
        response = model.generate_content(prompt)
        translated_text = response.text.strip()
        
        # Send result back
        emit('translation-result', {
            'original': text, 
            'translated': translated_text
        }, broadcast=True)
        
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        # Fallback in case of error so the UI doesn't freeze
        emit('translation-result', {
            'original': text, 
            'translated': "..."
        }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)