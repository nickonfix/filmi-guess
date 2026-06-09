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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="mesh mesh-drift absolute inset-0 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas-soft" />
      </div>
      <div className="card-lg w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl">🎬</div>
          <h2 className="display-sm">
            <span className="text-ink">Room </span>
            <span className="font-mono tracking-[0.15em] text-gradient">{code}</span>
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-body">Your name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && watch()}
              maxLength={20}
              placeholder="Enter your name…"
              className="input-field-lg"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button onClick={watch} disabled={loading} className="btn-primary w-full">
            {loading ? 'Loading…' : 'Enter room'}
          </button>
          <a href="/" className="block text-center text-sm text-mute transition-colors hover:text-ink">← Back home</a>
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse text-4xl">🎬</div>
          <p className="text-body">Connecting to <span className="font-mono font-semibold text-gradient">{code}</span>…</p>
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
