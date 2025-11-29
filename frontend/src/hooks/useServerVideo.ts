import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface UseServerVideoProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
  enabled: boolean;
}

export const useServerVideo = ({ socket, roomId, userId, enabled }: UseServerVideoProps) => {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const videoSenderRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !socket) return;

    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 15 },
          audio: false // Audio handled separately
        });
        setMyStream(stream);

        // Send video frames to server
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(videoTrack);

        const sendFrame = async () => {
          if (!socket.connected) return;

          try {
            const bitmap = await imageCapture.grabFrame();
            const canvas = document.createElement('canvas');
            canvas.width = 320; // Reduced for performance
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(bitmap, 0, 0, 320, 240);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

            socket.emit('video-frame', {
              roomId,
              userId,
              frame: dataUrl
            });
          } catch (err) {
            // Frame grab failed, skip
          }
        };

        // Send frames at ~10 fps for performance
        videoSenderRef.current = window.setInterval(sendFrame, 100);

      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initVideo();

    return () => {
      if (videoSenderRef.current) {
        clearInterval(videoSenderRef.current);
      }
      myStream?.getTracks().forEach(track => track.stop());
    };
  }, [socket, roomId, userId, enabled]);

  return { myStream };
};
