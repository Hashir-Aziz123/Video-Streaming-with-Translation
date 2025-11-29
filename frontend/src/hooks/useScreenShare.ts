import { useState, useRef, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

interface UseScreenShareProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
}

export const useScreenShare = ({ socket, roomId, userId }: UseScreenShareProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenSenderRef = useRef<number | null>(null);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 10 },
        audio: false
      });

      setScreenStream(stream);
      setIsSharing(true);

      // Send screen frames
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(videoTrack);

      const sendFrame = async () => {
        if (!socket?.connected) return;

        try {
          const bitmap = await imageCapture.grabFrame();
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0, 640, 480);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

          socket.emit('screen-frame', {
            roomId,
            userId,
            frame: dataUrl
          });
        } catch (err) {
          // Skip frame on error
        }
      };

      screenSenderRef.current = window.setInterval(sendFrame, 100);

      // Handle user stopping via browser UI
      videoTrack.addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenSenderRef.current) {
      clearInterval(screenSenderRef.current);
      screenSenderRef.current = null;
    }

    screenStream?.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    setIsSharing(false);

    socket?.emit('stop-screen-share', { roomId, userId });
  };

  useEffect(() => {
    return () => {
      if (screenSenderRef.current) {
        clearInterval(screenSenderRef.current);
      }
      screenStream?.getTracks().forEach(track => track.stop());
    };
  }, [screenStream]);

  return { isSharing, startScreenShare, stopScreenShare };
};
