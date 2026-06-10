'use client';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { leaveRoom } from '@/lib/leaveRoom';
import { useGameStore } from '@/store/gameStore';
import { getSavedName, getSavedToken, saveToken } from '@/lib/playerName';
import { CATEGORY_META } from '@/types';
import ThemeToggle from './ThemeToggle';
import clsx from 'clsx';
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
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    setSavedName(getSavedName());
  }, []);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/room/${room.code}`);
  }, [room.code]);

  // Close the rules drawer on Escape
  useEffect(() => {
    if (!rulesOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setRulesOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rulesOpen]);

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
    <div className="relative min-h-screen overflow-hidden">
      {/* Mesh atmosphere up top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]">
        <div className="mesh mesh-drift absolute inset-0 opacity-80" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas-soft" />
      </div>

      {/* Slim header */}
      <header className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 sm:px-6">
        <a href="/" className="text-lg font-semibold tracking-[-0.02em] text-ink">
          Filmi<span className="text-gradient">Guess</span>
        </a>
        <ThemeToggle />
      </header>

      {/* Host-only left tab that slides the game-rules panel out */}
      {isHost && (
        <button
          onClick={() => setRulesOpen(true)}
          className={clsx(
            'fixed left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-lg bg-primary py-4 pl-2.5 pr-3 text-on-primary shadow-card-lg transition-all hover:pr-4',
            rulesOpen && 'pointer-events-none opacity-0',
          )}
          style={{ writingMode: 'vertical-rl' }}
          title="Edit game rules"
          aria-label="Open game rules"
        >
          ⚙ Game rules
        </button>
      )}

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 pb-12 pt-2">
        <div className="space-y-5">
          {/* Room code */}
          <div className="card-lg p-7 text-center">
            <p className="eyebrow mb-3">Room code</p>
            <div className="mb-5 font-mono text-6xl font-semibold tracking-[0.15em] text-ink">{room.code}</div>
            {shareUrl && (
              <p className="mb-3 break-all rounded-sm bg-canvas-soft px-3 py-2 font-mono text-xs text-mute shadow-hairline">{shareUrl}</p>
            )}
            <button onClick={copyLink} className="btn-secondary-sm mx-auto">
              {copied ? '✓ Copied!' : 'Copy invite link'}
            </button>
            <div className="mt-4">
              <span className={`badge ${settings.isPublic ? 'text-success-deep' : ''}`}>
                {settings.isPublic ? (
                  <><span className="h-1.5 w-1.5 rounded-full bg-success" /> Public — listed in lobby</>
                ) : (
                  <>🔒 Private — invite only</>
                )}
              </span>
            </div>
          </div>

          {/* Players list */}
          <div className="card p-6">
            <h2 className="eyebrow mb-4">Players · {room.players.length}</h2>
            <div className="space-y-2">
              {room.players.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${
                    p.id === myPlayer?.id ? 'bg-canvas-soft shadow-hairline' : ''
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-g-develop-start to-g-preview-end text-sm font-semibold text-white">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-ink">{p.name}</span>
                  {p.isHost && <span className="badge">Host</span>}
                  {p.id === myPlayer?.id && <span className="text-xs text-mute">You</span>}
                  {isHost && !p.isHost && p.id !== myPlayer?.id && (
                    <button
                      onClick={() => kick(p.id)}
                      className="ml-auto rounded-sm px-2 py-1 text-xs font-medium text-error transition-colors hover:bg-error-soft"
                      title={`Kick ${p.name}`}
                    >
                      Kick
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Game rules — read-only summary; host edits via the slide-out panel */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="eyebrow">Game rules</h2>
              {isHost && (
                <button onClick={() => setRulesOpen(true)} className="btn-secondary-sm">
                  ⚙ Edit
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge">{settings.totalRounds} rounds</span>
              <span className="badge">{settings.roundTime}s / round</span>
              {settings.categories.map(c => {
                const m = CATEGORY_META.find(x => x.id === c);
                return <span key={c} className="badge">{m?.icon} {m?.label ?? c}</span>;
              })}
            </div>
            {!isHost && <p className="mt-3 text-xs text-mute">Only the host can change the rules.</p>}
          </div>

          {spectating ? (
            <div className="space-y-3">
              <div className="card-soft py-3 text-center text-sm text-body">
                You&apos;re watching as <span className="font-semibold text-ink">{savedName || '…'}</span>
              </div>
              <button onClick={joinGame} className="btn-primary w-full">Join game</button>
            </div>
          ) : isHost ? (
            <button onClick={startGame} disabled={room.players.length < 1} className="btn-primary w-full">
              Start game
            </button>
          ) : (
            <div className="py-4 text-center text-sm text-mute">
              Waiting for host to start the game…
            </div>
          )}

          <button
            onClick={leaveRoom}
            className="mx-auto block rounded-md px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error-soft"
          >
            Leave room
          </button>
        </div>
      </div>

      {/* ---- Host-only game-rules slide-out panel ---- */}
      {isHost && (
        <>
          <div
            className={clsx(
              'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
              rulesOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            onClick={() => setRulesOpen(false)}
          />
          <aside
            className={clsx(
              'fixed left-0 top-0 z-50 flex h-full w-[88%] max-w-sm flex-col bg-canvas shadow-modal transition-transform duration-300',
              rulesOpen ? 'translate-x-0' : '-translate-x-full',
            )}
            aria-hidden={!rulesOpen}
          >
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h2 className="display-sm text-ink">Game rules</h2>
              <button
                onClick={() => setRulesOpen(false)}
                className="rounded-md px-2 py-1 text-lg text-mute transition-colors hover:bg-canvas-soft hover:text-ink"
                aria-label="Close game rules"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              {/* Rounds */}
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-body">Rounds</span>
                  <span className="font-mono font-medium text-ink">{settings.totalRounds}</span>
                </div>
                <input
                  type="range" min={3} max={30} step={1}
                  value={settings.totalRounds}
                  onChange={e => updateSettings({ totalRounds: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-ink"
                />
              </div>

              {/* Timer */}
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-body">Time per round</span>
                  <span className="font-mono font-medium text-ink">{settings.roundTime}s</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIMER_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => updateSettings({ roundTime: t })}
                      className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                        settings.roundTime === t
                          ? 'bg-ink text-on-primary'
                          : 'bg-canvas text-body shadow-hairline hover:bg-canvas-soft'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="mb-2 text-sm text-body">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_META.map(c => {
                    const active = settings.categories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className={`rounded-pill-sm px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? 'bg-ink text-on-primary'
                            : 'bg-canvas text-mute shadow-hairline'
                        } cursor-pointer hover:opacity-90`}
                      >
                        {c.icon} {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Public / Private */}
              <div className="flex items-center justify-between border-t border-hairline pt-5">
                <div>
                  <p className="text-sm font-medium text-ink">Public lobby</p>
                  <p className="text-xs text-mute">Anyone can find and join from the browser</p>
                </div>
                <button
                  onClick={() => updateSettings({ isPublic: !settings.isPublic })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${settings.isPublic ? 'bg-success' : 'bg-hairline'}`}
                  role="switch"
                  aria-checked={settings.isPublic}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-btn transition-transform ${settings.isPublic ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            <div className="border-t border-hairline p-4">
              <button onClick={() => setRulesOpen(false)} className="btn-primary w-full">Done</button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
