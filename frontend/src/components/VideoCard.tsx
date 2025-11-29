import { useEffect, useRef } from 'react';

interface VideoCardProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  language?: string;
}

export const VideoCard = ({ stream, label, muted = false, language }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full aspect-[9/16] max-w-[360px] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <span className="text-xs font-medium">{label}</span>
        </div>
        {language && (
          <div className="text-xs text-zinc-400 mt-2">{language}</div>
        )}
      </div>
    </div>
  );
};
