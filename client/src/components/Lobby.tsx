'use client';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { getSavedName } from '@/lib/playerName';
import type { RoomPublic, Player, QuestionPublic } from '@/types';

interface Props {
  room: RoomPublic;
  myPlayer: Player | null;
}

export default function Lobby({ room, myPlayer }: Props) {
  const store = useGameStore();
  const { spectating } = store;
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [savedName, setSavedName] = useState('');

  useEffect(() => {
    setSavedName(getSavedName());
  }, []);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/room/${room.code}`);
  }, [room.code]);

  function copyLink() {
    const url = shareUrl || `${window.location.origin}/room/${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startGame() {
    getSocket().emit('game:start');
  }

  function joinGame() {
    if (!savedName) return;
    getSocket().emit('room:rejoin', { code: room.code, playerName: savedName }, (err: string | null, data?: { room: RoomPublic; player: Player; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
      if (err || !data) return;
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      store.setSpectating(false);
    });
  }

  const isHost = myPlayer?.isHost;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Room code */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Room Code</p>
          <div className="text-6xl font-black font-mono text-brand-gold tracking-widest mb-4">{room.code}</div>
          {shareUrl && (
            <p className="text-xs font-mono text-gray-500 bg-brand-dark rounded-lg px-3 py-2 mb-2 break-all">{shareUrl}</p>
          )}
          <button
            onClick={copyLink}
            className="text-sm bg-brand-dark border border-brand-border rounded-lg px-4 py-2 text-gray-300 hover:text-white hover:border-brand-orange transition-colors"
          >
            {copied ? '✓ Copied!' : '🔗 Copy invite link'}
          </button>
          <p className="text-gray-600 text-xs mt-3">Share this link with friends anywhere — works worldwide</p>
        </div>

        {/* Players list */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h2 className="text-gray-300 text-sm font-medium mb-4">
            Players ({room.players.length})
          </h2>
          <div className="space-y-2">
            {room.players.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  p.id === myPlayer?.id ? 'bg-brand-orange bg-opacity-10 border border-brand-orange border-opacity-30' : 'bg-brand-dark'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center text-sm font-bold">
                  {p.name[0].toUpperCase()}
                </div>
                <span className="font-medium">{p.name}</span>
                {p.isHost && (
                  <span className="ml-auto text-xs bg-brand-gold bg-opacity-20 text-brand-gold rounded-full px-2 py-0.5">Host</span>
                )}
                {p.id === myPlayer?.id && (
                  <span className="ml-auto text-xs text-gray-500">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game settings preview */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Rounds: <span className="text-white font-medium">{room.settings.totalRounds}</span></span>
            <span>Players: <span className="text-white font-medium">{room.players.length}/50</span></span>
            <span>Timer: <span className="text-white font-medium">25s</span></span>
          </div>
        </div>

        {spectating ? (
          <div className="space-y-3">
            <div className="text-center py-3 text-gray-400 text-sm bg-brand-card border border-brand-border rounded-xl">
              You&apos;re watching as <span className="text-white font-semibold">{savedName || '...'}</span>
            </div>
            <button
              onClick={joinGame}
              className="w-full bg-brand-orange hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Game
            </button>
          </div>
        ) : isHost ? (
          <button
            onClick={startGame}
            disabled={room.players.length < 1}
            className="w-full bg-brand-orange hover:bg-orange-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Game
          </button>
        ) : (
          <div className="text-center py-4 text-gray-400">
            Waiting for host to start the game...
          </div>
        )}

        <a href="/" className="block text-center text-gray-600 hover:text-gray-400 text-sm">Leave room</a>
      </div>
    </div>
  );
}
