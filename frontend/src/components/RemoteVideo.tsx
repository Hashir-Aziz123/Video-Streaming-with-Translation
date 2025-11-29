import { useEffect, useRef } from 'react';

interface RemoteVideoProps {
  userId: string;
  userName: string;
  frameData: string | undefined;
  language: string;
}

export const RemoteVideo = ({ userName, frameData, language }: RemoteVideoProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    if (!frameData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    imgRef.current.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    };

    imgRef.current.src = frameData;
  }, [frameData]);

  return (
    <div className="relative w-full aspect-[9/16] max-w-[360px] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <span className="text-xs font-medium">{userName}</span>
        </div>
        <div className="text-xs text-zinc-400 mt-2">{language}</div>
      </div>
    </div>
  );
};
