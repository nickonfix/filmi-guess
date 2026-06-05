'use client';
import { useState, useEffect } from 'react';
import { useGameSocket } from '@/hooks/useGameSocket';
import { connectSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { getSavedName, saveName } from '@/lib/playerName';
import type { RoomPublic, QuestionPublic } from '@/types';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import FinalLeaderboard from './FinalLeaderboard';

function JoinViaLink({ code }: { code: string }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const store = useGameStore();

  useEffect(() => {
    const saved = getSavedName();
    if (saved) setName(saved);
  }, []);

  function watch() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your name'); return; }
    setLoading(true);
    setError('');
    saveName(trimmed);
    store.reset();
    const socket = connectSocket();
    socket.emit('room:watch', { code }, (err: string | null, data?: { room: RoomPublic; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
      if (err || !data) { setError(err || 'Room not found'); setLoading(false); return; }
      store.setRoom(data.room);
      store.setSpectating(true);
      if (data.question && data.room.state === 'playing') {
        store.setQuestion(data.question, data.roundNumber, data.room.totalQuestions, data.timeLimit);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎬</div>
          <h2 className="text-xl font-black">
            <span className="text-brand-orange">Room </span>
            <span className="text-brand-gold font-mono">{code}</span>
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && watch()}
              maxLength={20}
              placeholder="Enter your name..."
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={watch}
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Loading...' : 'Enter Room'}
          </button>
          <a href="/" className="block text-center text-gray-600 hover:text-gray-400 text-sm">← Back home</a>
        </div>
      </div>
    </div>
  );
}

export default function GameRoom({ code }: { code: string }) {
  const { room, myPlayer, finalScores } = useGameSocket();

  // Arrived via direct link — no name entered yet
  if (!room && !myPlayer) {
    return <JoinViaLink code={code} />;
  }

  // Has player identity but socket hasn't confirmed room yet (brief reconnect window)
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-gray-400">Connecting to <span className="text-brand-gold font-mono font-bold">{code}</span>…</p>
        </div>
      </div>
    );
  }

  if (finalScores) {
    return <FinalLeaderboard scores={finalScores} myId={myPlayer?.id || ''} />;
  }

  if (room.state === 'waiting') {
    return <Lobby room={room} myPlayer={myPlayer} />;
  }

  return <GameBoard />;
}
