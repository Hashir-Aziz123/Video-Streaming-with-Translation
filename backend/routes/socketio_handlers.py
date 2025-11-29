from flask_socketio import emit, join_room, leave_room
from flask import request
from services import TranslationService
from services.room_service import room_service
from database import Recording, Room
import base64

translation_service = TranslationService()

def register_socketio_handlers(socketio):
    """Register all Socket.IO event handlers"""

    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        print(f"🔌 Client connected: {request.sid}")
        emit('connected', {'sid': request.sid})

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        room_id, user_id = room_service.get_user_by_sid(request.sid)
        if room_id and user_id:
            room_service.leave_room(room_id, user_id)
            emit('user-left', {'userId': user_id}, room=room_id, skip_sid=request.sid)
            print(f"🔌 User {user_id} left room {room_id}")

    @socketio.on('create-room')
    def handle_create_room(data):
        """Create a new room"""
        room_id = room_service.create_room(data.get('roomId'))
        Room.create(room_id)
        emit('room-created', {'roomId': room_id})
        print(f"🏠 Room created: {room_id}")

    @socketio.on('join-room')
    def handle_join_room(data):
        """Handle user joining a room"""
        room_id = data.get('roomId', '').strip()
        user_id = data.get('userId', '').strip()
        name = data.get('name', 'Anonymous')
        language = data.get('language', 'Spanish')

        # Validate inputs
        if not room_id or not user_id:
            emit('error', {'message': 'Invalid room or user ID'})
            return

        success = room_service.join_room(room_id, user_id, request.sid, name, language)

        if not success:
            emit('room-full', {'roomId': room_id})
            return

        join_room(room_id)

        # Notify user of successful join
        emit('joined-room', {
            'roomId': room_id,
            'userId': user_id,
            'users': [{
                'id': uid,
                'name': udata['name'],
                'language': udata['language'],
                'streamActive': udata['stream_active'],
                'screenShareActive': udata['screen_share_active']
            } for uid, udata in room_service.get_room_users(room_id).items()]
        })

        # Notify others in room
        emit('user-joined', {
            'userId': user_id,
            'name': name,
            'language': language
        }, room=room_id, skip_sid=request.sid)

        print(f"👤 User {user_id} joined room {room_id}")

    @socketio.on('leave-room')
    def handle_leave_room(data):
        """Handle user leaving room"""
        room_id = data.get('roomId')
        user_id = data.get('userId')

        room_service.leave_room(room_id, user_id)
        leave_room(room_id)

        emit('user-left', {'userId': user_id}, room=room_id)
        print(f"👋 User {user_id} left room {room_id}")

    @socketio.on('video-frame')
    def handle_video_frame(data):
        """Relay video frames to all users in room"""
        room_id = data.get('roomId')
        user_id = data.get('userId')
        frame_data = data.get('frame')

        room_service.set_stream_status(room_id, user_id, True)

        # Broadcast to all others in room
        emit('video-frame', {
            'userId': user_id,
            'frame': frame_data
        }, room=room_id, skip_sid=request.sid)

    @socketio.on('screen-frame')
    def handle_screen_frame(data):
        """Relay screen share frames to all users in room"""
        room_id = data.get('roomId')
        user_id = data.get('userId')
        frame_data = data.get('frame')

        room_service.set_screen_share_status(room_id, user_id, True)

        # Broadcast to all others in room
        emit('screen-frame', {
            'userId': user_id,
            'frame': frame_data
        }, room=room_id, skip_sid=request.sid)

    @socketio.on('stop-screen-share')
    def handle_stop_screen_share(data):
        """Handle stopping screen share"""
        room_id = data.get('roomId')
        user_id = data.get('userId')

        room_service.set_screen_share_status(room_id, user_id, False)

        emit('screen-share-stopped', {
            'userId': user_id
        }, room=room_id, include_self=True)

    @socketio.on('audio-chunk')
    def handle_audio(data):
        """Handle audio transcription and translation (live mode)"""
        room_id = data.get('roomId')
        user_id = data.get('userId')
        text = data.get('text')
        source_lang = data.get('sourceLang', 'en')
        target_lang = data.get('targetLang', 'Spanish')

        if not text:
            return

        print(f"🎤 Room {room_id} - {user_id}: {text} | Target: {target_lang}")

        # Translate to target language
        translated_text = translation_service.translate(text, target_lang)

        if translated_text:
            # Bidirectional: also translate back to English if source was target lang
            reverse_translation = None
            if source_lang != 'en':
                reverse_translation = translation_service.translate(text, 'English')

            emit('translation-result', {
                'userId': user_id,
                'original': text,
                'translated': translated_text,
                'sourceLang': source_lang,
                'targetLang': target_lang,
                'reverseTranslation': reverse_translation
            }, room=room_id)
        else:
            emit('translation-result', {
                'userId': user_id,
                'original': text,
                'translated': "...",
                'sourceLang': source_lang,
                'targetLang': target_lang
            }, room=room_id)

    @socketio.on('save-recording')
    def handle_save_recording(data):
        """Save audio recording with translation"""
        room_id = data.get('roomId')
        user_id = data.get('userId')
        audio_blob = data.get('audioBlob')  # base64 encoded
        original_text = data.get('originalText', '').strip()
        target_language = data.get('targetLanguage', 'Spanish')
        duration = data.get('duration', 0.0)

        print(f"📝 Save recording request - Room: {room_id}, Text: '{original_text}', Lang: {target_language}")

        # Validate inputs
        if not original_text:
            print("❌ No original text provided")
            emit('recording-error', {'message': 'No text to translate'})
            return

        if not audio_blob:
            print("❌ No audio data provided")
            emit('recording-error', {'message': 'No audio data'})
            return

        # Decode base64 audio
        try:
            audio_data = base64.b64decode(audio_blob)
            print(f"✓ Audio decoded: {len(audio_data)} bytes")
        except Exception as e:
            print(f"❌ Audio decode error: {e}")
            emit('recording-error', {'message': 'Invalid audio data'})
            return

        # Translate
        print(f"🔄 Translating to {target_language}...")
        translated_text = translation_service.translate(original_text, target_language)

        if not translated_text:
            print("❌ Translation failed")
            emit('recording-error', {'message': 'Translation failed'})
            return

        print(f"✓ Translated: '{translated_text}'")

        # Save to database
        try:
            recording_id = Recording.save(
                room_id=room_id,
                user_id=user_id,
                audio_data=audio_data,
                original_text=original_text,
                translated_text=translated_text,
                target_language=target_language,
                duration=duration
            )

            emit('recording-saved', {
                'recordingId': recording_id,
                'original': original_text,
                'translated': translated_text,
                'targetLanguage': target_language
            })

            print(f"💾 Recording saved: {recording_id}")
        except Exception as e:
            print(f"❌ Database error: {e}")
            emit('recording-error', {'message': f'Failed to save: {str(e)}'})

    @socketio.on('get-recordings')
    def handle_get_recordings(data):
        """Get all recordings for a room"""
        room_id = data.get('roomId')
        recordings = Recording.get_by_room(room_id)

        emit('recordings-list', {'recordings': recordings})

    @socketio.on('translate-recording')
    def handle_translate_recording(data):
        """Translate an existing recording to a new language"""
        recording_id = data.get('recordingId')
        new_target_lang = data.get('targetLanguage')
        original_text = data.get('originalText')

        translated_text = translation_service.translate(original_text, new_target_lang)

        emit('recording-translated', {
            'recordingId': recording_id,
            'targetLanguage': new_target_lang,
            'translated': translated_text
        })

    @socketio.on('update-language')
    def handle_update_language(data):
        """Update user's preferred language"""
        room_id = data.get('roomId')
        user_id = data.get('userId')
        language = data.get('language')

        room_service.update_user_language(room_id, user_id, language)

        emit('language-updated', {
            'userId': user_id,
            'language': language
        }, room=room_id, include_self=True)

    @socketio.on('signal')
    def handle_signal(data):
        """Handle WebRTC signaling for initial connection setup"""
        room_id = data.get('roomId')
        target_user = data.get('targetUser')
        signal_data = data.get('signal')

        emit('signal', {
            'fromUser': data.get('fromUser'),
            'signal': signal_data
        }, room=room_id, skip_sid=request.sid)
