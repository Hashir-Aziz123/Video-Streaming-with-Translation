import { useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';

interface UseVoiceRecordingProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
  targetLanguage: string;
}

export const useVoiceRecording = ({ socket, roomId, userId, targetLanguage }: UseVoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordedText('');
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Start speech recognition
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        let fullTranscript = '';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              fullTranscript += event.results[i][0].transcript + ' ';
              setRecordedText(fullTranscript.trim());
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve();
        return;
      }

      const currentText = recordedText; // Capture current text before async operations

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = (Date.now() - startTimeRef.current) / 1000;

        // Stop tracks first
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        // Check if we have text to translate
        if (!currentText || currentText.trim() === '') {
          console.error('No text recorded - speak something first!');
          alert('Please speak something before stopping the recording');
          resolve();
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];

          if (!socket) {
            console.error('No socket connection');
            resolve();
            return;
          }

          console.log('Saving recording:', {
            text: currentText,
            targetLanguage,
            duration
          });

          socket.emit('save-recording', {
            roomId,
            userId,
            audioBlob: base64Audio,
            originalText: currentText.trim(),
            targetLanguage,
            duration
          });

          resolve();
        };

        reader.onerror = () => {
          console.error('Failed to read audio blob');
          resolve();
        };
      };

      recognitionRef.current?.stop();
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  return {
    isRecording,
    recordedText,
    startRecording,
    stopRecording
  };
};
