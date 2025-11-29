import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface UseSpeechRecognitionProps {
  socket: Socket | null;
  targetLanguage: string;
  isEnabled: boolean;
}

export const useSpeechRecognition = ({
  socket,
  targetLanguage,
  isEnabled,
}: UseSpeechRecognitionProps) => {
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    if (!isEnabled || !socket) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;

      if (!event.results[current].isFinal) {
        setInterimTranscript(transcript);
      } else {
        setInterimTranscript('');

        // Get room and user info from URL or generate defaults
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('room') || 'demo-room';
        const userId = sessionStorage.getItem('userId') || 'default-user';

        socket.emit('audio-chunk', {
          roomId,
          userId,
          text: transcript,
          sourceLang: 'en',
          targetLang: targetLanguage,
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [socket, targetLanguage, isEnabled]);

  return { interimTranscript };
};
