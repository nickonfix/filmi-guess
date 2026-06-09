'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { getSavedName, saveName, saveToken } from '@/lib/playerName';
import { CATEGORY_META } from '@/types';
import type { RoomPublic, Player, PublicRoomSummary } from '@/types';

export default function LandingPage() {
  const router = useRouter();
  const store = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const [kicked, setKicked] = useState(false);

  useEffect(() => {
    const saved = getSavedName();
    if (saved) setPlayerName(saved);
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('kicked')) {
      setKicked(true);
      window.history.replaceState(null, '', '/');
    }
  }, []);
  const [mode, setMode] = useState<'home' | 'create' | 'join' | 'browse'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  function fetchRooms() {
    setBrowseLoading(true);
    const socket = connectSocket();
    socket.emit('rooms:list', (rooms: PublicRoomSummary[]) => {
      setPublicRooms(rooms || []);
      setBrowseLoading(false);
    });
  }

  function openBrowse() {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    setError('');
    setMode('browse');
    fetchRooms();
  }

  function handleCreate() {
    const name = playerName.trim();
    if (!name) { setError('Enter your name first'); return; }
    setLoading(true);
    setError('');
    saveName(name);
    store.reset();
    const socket = connectSocket();
    socket.emit('room:create', name, (data: { code: string; room: RoomPublic; player: Player; token: string }) => {
      saveToken(data.token);
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      router.push(`/room/${data.code}`);
    });
  }

  function handleJoin(code?: string) {
    const name = playerName.trim();
    const targetCode = (code ?? roomCode).toUpperCase().trim();
    if (!name) { setError('Enter your name first'); return; }
    if (!targetCode) { setError('Enter a room code'); return; }
    setLoading(true);
    setError('');
    saveName(name);
    store.reset();
    const socket = connectSocket();
    socket.emit('room:join', { code: targetCode, playerName: name }, (err: string | null, data?: { room: RoomPublic; player: Player; token: string }) => {
      if (err || !data) { setError(err || 'Failed to join'); setLoading(false); return; }
      saveToken(data.token);
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      router.push(`/room/${targetCode}`);
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

        {kicked && (
          <div className="mb-4 bg-red-500 bg-opacity-15 border border-red-500 border-opacity-40 text-red-300 text-sm rounded-xl px-4 py-3 text-center">
            You were removed from the room by the host.
          </div>
        )}

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
              <button
                onClick={openBrowse}
                className="w-full text-gray-400 hover:text-white font-medium py-2 rounded-xl text-sm transition-colors"
              >
                🌐 Browse public rooms
              </button>
            </div>
          )}

          {mode === 'browse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setMode('home')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                  ← Back
                </button>
                <button onClick={fetchRooms} className="text-gray-400 hover:text-white text-sm">
                  ↻ Refresh
                </button>
              </div>
              <h2 className="text-center text-lg font-bold text-white">Public Rooms</h2>
              {browseLoading ? (
                <p className="text-center text-gray-500 py-8 text-sm">Loading rooms...</p>
              ) : publicRooms.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No public rooms right now.<br />Create one and make it public!</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {publicRooms.map(r => (
                    <button
                      key={r.code}
                      onClick={() => handleJoin(r.code)}
                      disabled={loading}
                      className="w-full text-left bg-brand-dark hover:bg-brand-border border border-brand-border hover:border-brand-orange rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-gold tracking-widest">{r.code}</span>
                        <span className="text-xs text-gray-400">{r.playerCount}/50 players</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Host: {r.hostName}</span>
                        <span className="text-xs text-gray-500">{r.totalRounds} rounds · {r.roundTime}s</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {r.categories.map(c => {
                          const meta = CATEGORY_META.find(m => m.id === c);
                          return meta ? <span key={c} title={meta.label}>{meta.icon}</span> : null;
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
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
                onClick={() => handleJoin()}
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

      {/* SEO content — visible to crawlers, subtle to users */}
      <section className="relative z-10 w-full max-w-2xl mt-16 px-4 pb-12 text-center">
        <h2 className="text-gray-600 text-sm font-semibold uppercase tracking-widest mb-6">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <div className="text-2xl mb-2">🎮</div>
            <h3 className="text-white font-bold text-sm mb-1">Create a Room</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Enter your name and create a private room. Share the link with friends on WhatsApp or anywhere.</p>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <div className="text-2xl mb-2">🖼️</div>
            <h3 className="text-white font-bold text-sm mb-1">Guess the Star</h3>
            <p className="text-gray-500 text-xs leading-relaxed">A photo appears — type the Bollywood actor, Hindi movie title, or South Indian star as fast as you can.</p>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="text-white font-bold text-sm mb-1">Win Points</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Faster answers earn more points. Build streaks for bonus multipliers. The top scorer at the end wins!</p>
          </div>
        </div>

        <p className="text-gray-700 text-xs mt-8 leading-relaxed max-w-lg mx-auto">
          FilmiGuess is the best free online multiplayer Bollywood quiz game. Test your knowledge of Indian cinema —
          from classic Hindi films to modern Bollywood blockbusters, South Indian superstars, and everything in between.
          Play with up to 50 friends, no account needed.
        </p>
      </section>
    </main>
  );
}
