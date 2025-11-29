# LiveTranslate - Multi-User Video Translation

Real-time video conferencing with AI-powered translation. Server-routed video, screen sharing, voice recordings, and 12 languages.

## Features

- 🎥 **Server-based video routing** (no P2P, all through Flask-SocketIO)
- 👥 **Multi-user rooms** (2-4 participants)
- 📺 **Screen sharing** with automatic layout switching
- 🎤 **Voice recording** with on-demand translation saved to SQLite
- 🌍 **12 languages**: Spanish, French, German, Hindi, Chinese, Japanese, Korean, Arabic, Portuguese, Russian, Italian, Turkish
- ⚡ **Bidirectional translation** (English ↔ target language)
- 🎨 **Modern React UI** with Tailwind CSS + shadcn/ui

## Quick Start

```bash
# Backend
pip install -r backend/requirements.txt
python run_backend.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

For multi-user: Open `http://localhost:5173?room=test` in multiple tabs/browsers.

## Architecture

- **Backend**: Flask + Socket.IO for video/screen frame relay, SQLite for recordings
- **Frontend**: React + TypeScript, server-routed video via binary streams
- **Translation**: Gemini 2.0 Flash with optimized prompts
- **Database**: SQLite for voice recording storage

## Room System

- Create/join rooms via URL: `?room=your-room-id`
- Max 4 users per room
- Real-time user presence tracking
- Per-user language preferences

## Voice Recordings

- Record audio with live transcription
- Save with translation to database
- View recording history per room
- Re-translate recordings to different languages on-demand
