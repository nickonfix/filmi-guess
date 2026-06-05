'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { getSavedName, saveName } from '@/lib/playerName';
import type { RoomPublic, Player } from '@/types';

export default function LandingPage() {
  const router = useRouter();
  const store = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const saved = getSavedName();
    if (saved) setPlayerName(saved);
  }, []);
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleCreate() {
    const name = playerName.trim();
    if (!name) { setError('Enter your name first'); return; }
    setLoading(true);
    setError('');
    saveName(name);
    store.reset();
    const socket = connectSocket();
    socket.emit('room:create', name, (data: { code: string; room: RoomPublic; player: Player }) => {
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      router.push(`/room/${data.code}`);
    });
  }

  function handleJoin() {
    const name = playerName.trim();
    if (!name) { setError('Enter your name first'); return; }
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true);
    setError('');
    saveName(name);
    store.reset();
    const socket = connectSocket();
    socket.emit('room:join', { code: roomCode.toUpperCase().trim(), playerName: name }, (err: string | null, data?: { room: RoomPublic; player: Player }) => {
      if (err || !data) { setError(err || 'Failed to join'); setLoading(false); return; }
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      router.push(`/room/${roomCode.toUpperCase().trim()}`);
    });
  }

  const categories = [
    { icon: '🎬', label: 'Bollywood Actors' },
    { icon: '🎥', label: 'Hindi Movies' },
    { icon: '🌟', label: 'South Stars' },
    { icon: '🏆', label: 'Classic Films' },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-orange opacity-5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-pink opacity-5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold opacity-3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black mb-2">
            <span className="text-brand-orange">Filmi</span>
            <span className="text-brand-gold">Guess</span>
          </h1>
          <p className="text-gray-400 text-lg">Guess the Indian Cinema Star</p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            {categories.map(c => (
              <span key={c.label} className="text-xs bg-brand-card border border-brand-border rounded-full px-3 py-1 text-gray-300">
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl">
          {mode === 'home' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setMode('create')}
                  maxLength={20}
                  placeholder="Enter your name..."
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={() => { if (!playerName.trim()) { setError('Enter your name'); return; } setMode('create'); setError(''); }}
                className="w-full bg-brand-orange hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Room
              </button>
              <button
                onClick={() => { if (!playerName.trim()) { setError('Enter your name'); return; } setMode('join'); setError(''); }}
                className="w-full bg-brand-card hover:bg-brand-border border border-brand-border text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <button onClick={() => setMode('home')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                ← Back
              </button>
              <div className="text-center py-4">
                <p className="text-gray-300 mb-1">Playing as</p>
                <p className="text-2xl font-bold text-brand-gold">{playerName}</p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-brand-orange hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Creating...' : 'Create & Start Room'}
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <button onClick={() => setMode('home')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                ← Back
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={4}
                  placeholder="ABCD"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors text-center text-2xl font-mono tracking-[0.5em] uppercase"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-brand-pink hover:bg-pink-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          No signup needed · Up to 50 players · Free forever
        </p>
      </div>
    </main>
  );
}
