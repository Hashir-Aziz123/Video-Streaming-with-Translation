import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'recordings.db')

def init_db():
    """Initialize database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recordings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            audio_data BLOB NOT NULL,
            original_text TEXT,
            translated_text TEXT,
            source_language TEXT DEFAULT 'en',
            target_language TEXT NOT NULL,
            duration REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active BOOLEAN DEFAULT 1
        )
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_room_recordings
        ON recordings(room_id, created_at DESC)
    ''')

    conn.commit()
    conn.close()

class Recording:
    @staticmethod
    def save(room_id: str, user_id: str, audio_data: bytes,
             original_text: str, translated_text: str,
             target_language: str, duration: float = 0.0) -> int:
        """Save a voice recording with translation"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO recordings
            (room_id, user_id, audio_data, original_text, translated_text, target_language, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (room_id, user_id, audio_data, original_text, translated_text, target_language, duration))

        recording_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return recording_id

    @staticmethod
    def get_by_room(room_id: str, limit: int = 50) -> List[Dict]:
        """Get all recordings for a room"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, room_id, user_id, original_text, translated_text,
                   target_language, duration, created_at
            FROM recordings
            WHERE room_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (room_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    @staticmethod
    def get_audio(recording_id: int) -> Optional[bytes]:
        """Get audio data for a recording"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('SELECT audio_data FROM recordings WHERE id = ?', (recording_id,))
        row = cursor.fetchone()
        conn.close()

        return row[0] if row else None

    @staticmethod
    def delete(recording_id: int) -> bool:
        """Delete a recording"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM recordings WHERE id = ?', (recording_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

class Room:
    @staticmethod
    def create(room_id: str, name: str = None) -> bool:
        """Create a new room"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        try:
            cursor.execute('''
                INSERT INTO rooms (id, name) VALUES (?, ?)
            ''', (room_id, name or f"Room {room_id}"))
            conn.commit()
            success = True
        except sqlite3.IntegrityError:
            success = False

        conn.close()
        return success

    @staticmethod
    def get(room_id: str) -> Optional[Dict]:
        """Get room details"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else None

    @staticmethod
    def deactivate(room_id: str):
        """Mark room as inactive"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('UPDATE rooms SET active = 0 WHERE id = ?', (room_id,))
        conn.commit()
        conn.close()

# Initialize database on import
init_db()
