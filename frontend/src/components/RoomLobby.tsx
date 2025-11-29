import { useState } from 'react';
import { Button } from './ui/button';
import { Users, Plus, ArrowRight } from 'lucide-react';

interface RoomLobbyProps {
  onJoinRoom: (roomId: string) => void;
}

export const RoomLobby = ({ onJoinRoom }: RoomLobbyProps) => {
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 8).toUpperCase();
    onJoinRoom(newRoomId);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent mb-4">
            LiveTranslate
          </h1>
          <p className="text-zinc-400 text-lg">
            Real-time video translation in 12 languages
          </p>
        </div>

        {/* Join Room Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Join a Room
            </h2>
            <p className="text-sm text-zinc-400">
              Enter a room code to join an existing session
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter room code (e.g., ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={20}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!roomCode.trim()}
              className="w-full"
              size="lg"
            >
              Join Room
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-zinc-950 text-zinc-500">or</span>
          </div>
        </div>

        {/* Create Room Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Room
            </h2>
            <p className="text-sm text-zinc-400">
              Start a new session and invite others
            </p>
          </div>

          <Button
            onClick={handleCreateRoom}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            Create Room
            <Plus className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="text-center text-sm text-zinc-500 space-y-2">
          <p>✓ Up to 4 participants per room</p>
          <p>✓ Screen sharing & voice recordings</p>
          <p>✓ Real-time AI translation</p>
        </div>
      </div>
    </div>
  );
};
