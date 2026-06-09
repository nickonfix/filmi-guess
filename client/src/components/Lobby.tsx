'use client';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { getSavedName, getSavedToken, saveToken } from '@/lib/playerName';
import { CATEGORY_META } from '@/types';
import type { RoomPublic, Player, QuestionPublic, Category, RoomSettings } from '@/types';

interface Props {
  room: RoomPublic;
  myPlayer: Player | null;
}

const TIMER_OPTIONS = [10, 15, 20, 25, 30, 45, 60];

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
    getSocket().emit('room:rejoin', { code: room.code, playerName: savedName, token: getSavedToken() }, (err: string | null, data?: { room: RoomPublic; player: Player; token: string; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
      if (err || !data) return;
      saveToken(data.token);
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      store.setSpectating(false);
    });
  }

  const isHost = myPlayer?.isHost;
  const settings = room.settings;

  function updateSettings(partial: Partial<RoomSettings>) {
    getSocket().emit('room:update_settings', partial);
  }

  function toggleCategory(cat: Category) {
    const current = settings.categories;
    const next = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat];
    if (next.length === 0) return; // keep at least one
    updateSettings({ categories: next });
  }

  function kick(playerId: string) {
    getSocket().emit('room:kick', playerId);
  }

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
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1 ${settings.isPublic ? 'bg-green-500 bg-opacity-15 text-green-400' : 'bg-brand-dark text-gray-400'}`}>
              {settings.isPublic ? '🌐 Public — listed in lobby browser' : '🔒 Private — invite only'}
            </span>
          </div>
        </div>

        {/* Players list */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h2 className="text-gray-300 text-sm font-medium mb-4">
            Players ({room.players.length})
          </h2>
          <div className="space-y-2">
            {room.players.map(p => (
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
                  <span className="text-xs bg-brand-gold bg-opacity-20 text-brand-gold rounded-full px-2 py-0.5">Host</span>
                )}
                {p.id === myPlayer?.id && (
                  <span className="text-xs text-gray-500">You</span>
                )}
                {isHost && !p.isHost && p.id !== myPlayer?.id && (
                  <button
                    onClick={() => kick(p.id)}
                    className="ml-auto text-xs text-red-400 hover:text-white hover:bg-red-500 border border-red-500 border-opacity-40 rounded-lg px-2 py-1 transition-colors"
                    title={`Kick ${p.name}`}
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game settings */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-5">
          <h2 className="text-gray-300 text-sm font-medium flex items-center gap-2">
            ⚙️ Game Settings
            {!isHost && <span className="text-xs text-gray-600">(host controls)</span>}
          </h2>

          {/* Rounds */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Rounds</span>
              <span className="text-white font-semibold">{settings.totalRounds}</span>
            </div>
            {isHost ? (
              <input
                type="range" min={3} max={30} step={1}
                value={settings.totalRounds}
                onChange={e => updateSettings({ totalRounds: Number(e.target.value) })}
                className="w-full accent-brand-orange cursor-pointer"
              />
            ) : (
              <div className="h-1.5 bg-brand-dark rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange" style={{ width: `${((settings.totalRounds - 3) / 27) * 100}%` }} />
              </div>
            )}
          </div>

          {/* Timer */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Time per round</span>
              <span className="text-white font-semibold">{settings.roundTime}s</span>
            </div>
            {isHost ? (
              <div className="flex flex-wrap gap-2">
                {TIMER_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => updateSettings({ roundTime: t })}
                    className={`text-sm rounded-lg px-3 py-1.5 border transition-colors ${
                      settings.roundTime === t
                        ? 'bg-brand-orange border-brand-orange text-white'
                        : 'bg-brand-dark border-brand-border text-gray-300 hover:border-brand-orange'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{settings.roundTime} seconds</p>
            )}
          </div>

          {/* Categories */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_META.map(c => {
                const active = settings.categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => isHost && toggleCategory(c.id)}
                    disabled={!isHost}
                    className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                      active
                        ? 'bg-brand-orange bg-opacity-15 border-brand-orange text-brand-orange'
                        : 'bg-brand-dark border-brand-border text-gray-500'
                    } ${isHost ? 'cursor-pointer hover:border-brand-orange' : 'cursor-default'}`}
                  >
                    {c.icon} {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public / Private */}
          {isHost && (
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-gray-300 text-sm font-medium">Public lobby</p>
                <p className="text-gray-600 text-xs">Anyone can find and join from the browser</p>
              </div>
              <button
                onClick={() => updateSettings({ isPublic: !settings.isPublic })}
                className={`relative w-12 h-7 rounded-full transition-colors ${settings.isPublic ? 'bg-brand-orange' : 'bg-brand-dark border border-brand-border'}`}
                role="switch"
                aria-checked={settings.isPublic}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${settings.isPublic ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          )}
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
