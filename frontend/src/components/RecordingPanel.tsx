import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import type { Socket } from 'socket.io-client';
import type { Recording } from '../types';

interface RecordingPanelProps {
  socket: Socket | null;
  roomId: string;
  isRecording: boolean;
  recordedText: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const RecordingPanel = ({
  socket,
  roomId,
  isRecording,
  recordedText,
  onStartRecording,
  onStopRecording
}: RecordingPanelProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('recording-saved', (data) => {
      setIsSaving(false);
      setRecordings(prev => [{
        id: data.recordingId,
        roomId,
        userId: '',
        originalText: data.original,
        translatedText: data.translated,
        targetLanguage: data.targetLanguage,
        duration: 0,
        createdAt: new Date().toISOString()
      }, ...prev]);
    });

    socket.on('recordings-list', (data) => {
      setRecordings(data.recordings);
    });

    socket.on('recording-error', (data) => {
      setIsSaving(false);
      alert(data.message);
    });

    // Load existing recordings
    socket.emit('get-recordings', { roomId });

    return () => {
      socket.off('recording-saved');
      socket.off('recordings-list');
      socket.off('recording-error');
    };
  }, [socket, roomId]);

  const handleStopRecording = async () => {
    setIsSaving(true);
    try {
      await onStopRecording();
      // Give it 5 seconds max, then stop showing "saving"
      setTimeout(() => {
        setIsSaving(false);
      }, 5000);
    } catch (error) {
      setIsSaving(false);
      alert('Failed to save recording');
    }
  };

  return (
    <div className="fixed right-4 top-20 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl">
      <h3 className="text-sm font-semibold mb-3">Voice Recordings</h3>

      <div className="flex gap-2 mb-4">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            className="flex-1"
            size="sm"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={handleStopRecording}
            variant="secondary"
            className="flex-1"
            size="sm"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Stop & Save'}
          </Button>
        )}
      </div>

      {isRecording && recordedText && (
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg text-sm">
          <div className="text-zinc-400 text-xs mb-1">Recording...</div>
          <div className="text-white">{recordedText}</div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            className="p-3 bg-zinc-800/50 rounded-lg text-xs space-y-1"
          >
            <div className="text-zinc-400">{rec.originalText}</div>
            <div className="text-primary font-medium">{rec.translatedText}</div>
            <div className="text-zinc-600 text-[10px]">
              {rec.targetLanguage} • {new Date(rec.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
