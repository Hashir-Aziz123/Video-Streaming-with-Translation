# Translation Workflow Explained

## How LiveTranslate Works - Complete Flow

### 1. **Live Speech Translation** (Real-time mode)

#### Frontend Flow:
1. **User speaks** → Browser's Web Speech API captures audio
2. **Speech Recognition** (`useSpeechRecognition.ts`)
   - Continuous listening enabled
   - Interim results show "..." in UI
   - Final transcript sent when user pauses

3. **Socket.IO Emit** (`audio-chunk` event)
   ```javascript
   socket.emit('audio-chunk', {
     roomId: 'ABC123',
     userId: 'user-xyz',
     text: 'Hello how are you',
     sourceLang: 'en',
     targetLang: 'Spanish'  // From dropdown
   });
   ```

#### Backend Flow:
1. **Server receives** (`socketio_handlers.py:128`)
   - Gets room_id, user_id, text, target_lang

2. **Translation Service** (`translation_service.py`)
   ```python
   translated = translation_service.translate(
       text='Hello how are you',
       target_language='Spanish'
   )
   # Returns: "Hola, ¿cómo estás?"
   ```

3. **Gemini API Call**
   - Uses optimized few-shot prompt
   - Temperature: 0.0 (fast, deterministic)
   - Max tokens: 50 (short responses)
   - Model: gemini-2.0-flash (fastest)

4. **Broadcast to Room**
   ```python
   emit('translation-result', {
       userId: 'user-xyz',
       original: 'Hello how are you',
       translated: 'Hola, ¿cómo estás?',
       sourceLang: 'en',
       targetLang: 'Spanish'
   }, room=room_id)
   ```

#### Display in UI:
- All users in room receive translation
- Shows in `CaptionDisplay` component
- Original text (gray) + Translation (blue)

---

### 2. **Voice Recording Translation** (On-demand mode)

#### Recording Process:
1. **User clicks "Start Recording"**
2. **MediaRecorder API** captures audio
3. **Speech Recognition** transcribes in parallel
4. **Shows live transcript** in recording panel

#### Saving Process:
1. **User clicks "Stop & Save"**
2. **Audio converted to base64**
   ```javascript
   const audioBlob = new Blob(chunks, { type: 'audio/webm' });
   const base64Audio = btoa(audioBlob);
   ```

3. **Socket.IO Emit** (`save-recording` event)
   ```javascript
   socket.emit('save-recording', {
     roomId: 'ABC123',
     userId: 'user-xyz',
     audioBlob: 'base64_encoded_audio...',
     originalText: 'This is my recorded message',
     targetLanguage: 'French',
     duration: 5.2
   });
   ```

#### Backend Processing:
1. **Decode audio** (base64 → binary)
2. **Translate text** via Gemini
3. **Save to SQLite**
   ```sql
   INSERT INTO recordings (
     room_id, user_id, audio_data,
     original_text, translated_text,
     target_language, duration
   ) VALUES (...)
   ```

4. **Emit success**
   ```python
   emit('recording-saved', {
       recordingId: 42,
       original: 'This is my recorded message',
       translated: 'Ceci est mon message enregistré',
       targetLanguage: 'French'
   })
   ```

#### Retrieval:
- Load recordings: `socket.emit('get-recordings', { roomId })`
- Get list from database
- Display in RecordingPanel sidebar

---

### 3. **Bidirectional Translation**

#### What it means:
- **Primary**: English → Selected Language (e.g., Spanish)
- **Reverse** (optional): Spanish → English

#### When used:
If someone speaks in target language (detected by `sourceLang`):
```python
if source_lang != 'en':
    reverse_translation = translate(text, 'English')
```

This allows:
- English speaker sees: "Hola" → "Hello"
- Spanish speaker sees: "Hello" → "Hola"

---

### 4. **Translation Prompt Engineering**

#### The Prompt (optimized for speed):
```python
f"""Task: Translate to {target_language}.
Rule: Return ONLY the translated text. No notes.

Examples:
Input: Hello there
Output: Hola
Input: How are you doing?
Output: ¿Cómo estás?

Input: {text}
Output:"""
```

#### Why this works:
- **Few-shot learning**: Examples teach format
- **No explanations**: Model won't add "This means..."
- **Temperature 0**: No creativity, just translation
- **Max 50 tokens**: Cuts off long responses

---

### 5. **Per-User Language Preferences**

#### How it works:
1. Each user picks language from dropdown
2. **Stored in RoomService**:
   ```python
   rooms[room_id][user_id]['language'] = 'Spanish'
   ```

3. **When user changes language**:
   ```javascript
   socket.emit('update-language', {
     roomId, userId, language: 'French'
   });
   ```

4. **All users see updated preference**
   - VideoCard shows user's chosen language
   - Translations still broadcast to everyone

---

### 6. **Complete Example Flow**

**Scenario**: User A (English) and User B (Spanish) in same room

1. **User A speaks**: "How are you today?"
   - Web Speech API → "How are you today?"
   - Emit to server with `targetLang: 'Spanish'`

2. **Server translates**:
   - Gemini API → "¿Cómo estás hoy?"
   - Broadcasts to room

3. **User A sees**:
   - Original: "How are you today?"
   - Translated: "¿Cómo estás hoy?"

4. **User B sees** (same caption):
   - Original: "How are you today?"
   - Translated: "¿Cómo estás hoy?"

5. **User B responds** (in Spanish): "Muy bien, gracias"
   - If bidirectional enabled:
     - Gemini → "Very well, thank you"
     - Both see both versions

---

### 7. **Performance Metrics**

- **Speech recognition**: ~100ms latency
- **Socket.IO emit**: ~10-50ms
- **Gemini translation**: 300-800ms
- **Socket.IO broadcast**: ~10-50ms
- **Total latency**: ~500ms-1s

**Why it's fast**:
- No chunking (send complete sentences)
- Optimized Gemini config
- WebSocket (no HTTP overhead)
- Direct broadcast (no queuing)

---

### 8. **Database Schema**

```sql
CREATE TABLE recordings (
    id INTEGER PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    audio_data BLOB NOT NULL,        -- WebM audio file
    original_text TEXT,               -- English transcript
    translated_text TEXT,             -- Translated version
    target_language TEXT NOT NULL,    -- "Spanish", etc.
    duration REAL,                    -- Seconds
    created_at TIMESTAMP DEFAULT NOW
);
```

---

### 9. **Key Files**

**Frontend**:
- `useSpeechRecognition.ts` - Web Speech API wrapper
- `useVoiceRecording.ts` - MediaRecorder + save logic
- `CaptionDisplay.tsx` - Shows translations
- `RecordingPanel.tsx` - Recording UI

**Backend**:
- `socketio_handlers.py:128` - Live translation handler
- `socketio_handlers.py:168` - Recording save handler
- `translation_service.py` - Gemini API wrapper
- `database/models.py` - SQLite operations

---

### 10. **Testing the Translation**

1. **Start app**: `python run_backend.py` + `npm run dev`
2. **Open browser**: Go to lobby
3. **Create room**: Click "Create Room"
4. **Select language**: Choose from dropdown (e.g., Spanish)
5. **Speak**: Say "Hello everyone"
6. **See translation**: "Hola a todos" appears in caption

**Multi-user test**:
1. Open 2 tabs with same room code
2. Select different languages per tab
3. Speak in one tab
4. Both tabs see the translation

**Recording test**:
1. Click "Start Recording" (right panel)
2. Speak a sentence
3. Click "Stop & Save"
4. See it appear in recording history with translation
