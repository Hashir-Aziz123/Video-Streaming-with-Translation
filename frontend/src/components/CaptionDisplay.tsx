import type { TranslationResult } from '../types';

interface CaptionDisplayProps {
  translation: TranslationResult | null;
  interimTranscript: string;
}

export const CaptionDisplay = ({
  translation,
  interimTranscript,
}: CaptionDisplayProps) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-full px-8 py-4 shadow-2xl">
        {interimTranscript ? (
          <>
            <div className="text-zinc-400 text-sm text-center mb-1">
              {interimTranscript}...
            </div>
            <div className="text-white text-lg font-medium text-center opacity-50">
              ...
            </div>
          </>
        ) : translation ? (
          <>
            <div className="text-zinc-400 text-sm text-center mb-1">
              {translation.original}
            </div>
            <div className="text-primary text-lg font-semibold text-center">
              {translation.translated}
            </div>
          </>
        ) : (
          <>
            <div className="text-zinc-400 text-sm text-center mb-1">
              Listening for speech...
            </div>
            <div className="text-white text-lg font-medium text-center">
              Ready to translate
            </div>
          </>
        )}
      </div>
    </div>
  );
};
