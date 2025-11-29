import { useState, useEffect, useMemo } from 'react';
import { RoomLobby } from './components/RoomLobby';
import { VideoCard } from './components/VideoCard';
import { RemoteVideo } from './components/RemoteVideo';
import { CaptionDisplay } from './components/CaptionDisplay';
import { RecordingPanel } from './components/RecordingPanel';
import { Select } from './components/ui/select';
import { Button } from './components/ui/button';
import { useRoom } from './hooks/useRoom';
import { useServerVideo } from './hooks/useServerVideo';
import { useScreenShare } from './hooks/useScreenShare';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { SUPPORTED_LANGUAGES, type TranslationResult } from './types';
import { Languages, Mic, MicOff, MonitorUp, MonitorX, Users, LogOut, Copy } from 'lucide-react';

function App() {
  // Room state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [userName] = useState(() => `User ${Math.floor(Math.random() * 1000)}`);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isListening, setIsListening] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

  // Only initialize room hooks if roomId exists
  const { socket, users, isConnected, videoFrames, screenFrames } = useRoom(
    roomId || '',
    userId,
    userName,
    targetLanguage
  );

  const { myStream } = useServerVideo({
    socket,
    roomId: roomId || '',
    userId,
    enabled: isConnected && roomId !== null
  });

  const { isSharing, startScreenShare, stopScreenShare } = useScreenShare({
    socket,
    roomId: roomId || '',
    userId
  });

  const { interimTranscript } = useSpeechRecognition({
    socket,
    targetLanguage,
    isEnabled: isListening && roomId !== null
  });

  const {
    isRecording,
    recordedText,
    startRecording,
    stopRecording
  } = useVoiceRecording({
    socket,
    roomId: roomId || '',
    userId,
    targetLanguage
  });

  const handleJoinRoom = (newRoomId: string) => {
    setRoomId(newRoomId);
    // Update URL without reload
    window.history.pushState({}, '', `?room=${newRoomId}`);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    window.history.pushState({}, '', '/');
  };

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('update-language', {
        roomId,
        userId,
        language: targetLanguage
      });
    }
  }, [targetLanguage, socket, isConnected, roomId, userId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('translation-result', (data: TranslationResult) => {
      setTranslation(data);
    });

    return () => {
      socket.off('translation-result');
    };
  }, [socket]);

  const otherUsers = useMemo(() => {
    return Array.from(users.values()).filter(u => u.id !== userId);
  }, [users, userId]);

  const activeScreenShare = useMemo(() => {
    for (const [uid, frame] of screenFrames.entries()) {
      if (frame) {
        const user = users.get(uid);
        return { userId: uid, frame, userName: user?.name || 'Unknown' };
      }
    }
    return null;
  }, [screenFrames, users]);

  // Show lobby if no room selected
  if (!roomId) {
    return <RoomLobby onJoinRoom={handleJoinRoom} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            LiveTranslate
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-zinc-400">
              {isConnected ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Room: <code className="bg-zinc-800 px-2 py-0.5 rounded">{roomId}</code>
                </span>
              ) : (
                'Connecting...'
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomCode}
              className="h-6 px-2 text-xs"
            >
              <Copy className="w-3 h-3" />
              {showCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-2 rounded-lg">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">{users.size}</span>
          </div>

          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-zinc-400" />
            <Select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-48"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>

          <Button
            variant={isSharing ? "default" : "outline"}
            size="icon"
            onClick={isSharing ? stopScreenShare : startScreenShare}
          >
            {isSharing ? <MonitorX className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLeaveRoom}
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center w-full mt-20 mb-24">
        {activeScreenShare ? (
          <div className="max-w-6xl w-full">
            <div className="mb-4 text-center text-sm text-zinc-400">
              {activeScreenShare.userName} is sharing their screen
            </div>
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <img
                src={activeScreenShare.frame}
                alt="Screen share"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-4 mt-4 justify-center">
              {myStream && (
                <div className="w-32 h-24 rounded-lg overflow-hidden border border-zinc-800">
                  <VideoCard stream={myStream} label="You" muted />
                </div>
              )}
              {otherUsers.map(user => {
                const frame = videoFrames.get(user.id);
                if (!frame) return null;
                return (
                  <div key={user.id} className="w-32 h-24 rounded-lg overflow-hidden border border-zinc-800">
                    <img src={frame} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex gap-8 flex-wrap items-center justify-center">
            {myStream && (
              <VideoCard
                stream={myStream}
                label={`You (${userName})`}
                language={targetLanguage}
                muted
              />
            )}

            {otherUsers.map(user => (
              <RemoteVideo
                key={user.id}
                userId={user.id}
                userName={user.name}
                frameData={videoFrames.get(user.id)}
                language={user.language}
              />
            ))}

            {otherUsers.length === 0 && myStream && (
              <div className="text-center text-zinc-500 max-w-md">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">You're the only one here</p>
                <p className="text-sm text-zinc-600 mb-4">
                  You can use all features solo, or invite others to join
                </p>
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <p className="text-xs text-zinc-400 mb-2">Share this room code:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-lg bg-zinc-800 px-4 py-2 rounded font-mono">
                      {roomId}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyRoomCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recording Panel */}
      {socket && (
        <RecordingPanel
          socket={socket}
          roomId={roomId}
          isRecording={isRecording}
          recordedText={recordedText}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      )}

      {/* Caption Display */}
      <CaptionDisplay
        translation={translation}
        interimTranscript={interimTranscript}
      />

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-xs text-zinc-600">
          Powered by Gemini AI • Server-routed video • {SUPPORTED_LANGUAGES.length} languages
        </p>
      </div>
    </div>
  );
}

export default App;
