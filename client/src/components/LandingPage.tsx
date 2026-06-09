'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { getSavedName, saveName, saveToken } from '@/lib/playerName';
import { CATEGORY_META } from '@/types';
import type { RoomPublic, Player, PublicRoomSummary } from '@/types';
import ThemeToggle from './ThemeToggle';

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

  // Browsing doesn't require a name — only joining does.
  function openBrowse() {
    setError('');
    setMode('browse');
    fetchRooms();
  }

  // Enter the create flow, bouncing to the name field first if none is set.
  function startCreate() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!playerName.trim()) { setMode('home'); setError('Enter your name to start'); return; }
    setMode('create');
    setError('');
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
    if (!name) { setError('Enter your name first to join'); return; }
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

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Atmospheric mesh gradient — occupies the top of the page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden">
        <div className="mesh mesh-drift absolute inset-0 opacity-90" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-canvas-soft" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-hairline/70 bg-canvas-soft/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 sm:px-6">
          <a href="/" className="text-lg font-semibold tracking-[-0.02em] text-ink">
            Filmi<span className="text-gradient">Guess</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="badge mr-1 hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live
            </span>
            <button onClick={openBrowse} className="nav-cta-ghost hidden sm:inline-flex">Browse rooms</button>
            <ThemeToggle />
            <button onClick={() => startCreate()} className="nav-cta-signup">Play now</button>
          </div>
        </nav>
      </header>

      {mode === 'browse' ? (
        /* ============================ BIG ROOM BROWSER ============================ */
        <section className="mx-auto w-full max-w-page px-4 pt-12 pb-24 sm:px-6 sm:pt-16">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button onClick={() => { setMode('home'); setError(''); }} className="mb-3 text-sm font-medium text-mute transition-colors hover:text-ink">
                ← Back home
              </button>
              <h1 className="display-lg text-ink">Public rooms.</h1>
              <p className="mt-1.5 text-sm text-body">
                {browseLoading ? 'Loading live rooms…' : `${publicRooms.length} open room${publicRooms.length === 1 ? '' : 's'} right now — jump into any of them.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Your name to join"
                className="input-field w-44"
              />
              <button onClick={fetchRooms} className="nav-cta-ghost h-10 px-4">↻ Refresh</button>
            </div>
          </div>

          {error && <p className="mb-4 text-sm text-error">{error}</p>}

          {browseLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-36 animate-pulse" />
              ))}
            </div>
          ) : publicRooms.length === 0 ? (
            <div className="card-md flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="text-4xl">🍿</div>
              <h3 className="display-sm mt-4 text-ink">No public rooms yet.</h3>
              <p className="mt-2 max-w-sm text-sm text-body">
                Be the first — create a room and flip on the public toggle so anyone can join from here.
              </p>
              <button onClick={() => startCreate()} className="btn-primary mt-6">Create a public room</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicRooms.map(r => (
                <button
                  key={r.code}
                  onClick={() => handleJoin(r.code)}
                  disabled={loading}
                  className="card group flex flex-col p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-card-lg disabled:opacity-50"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-2xl font-semibold tracking-[0.18em] text-ink">{r.code}</span>
                    <span className="badge">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {r.playerCount}/50
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-mute">
                    <span>Host: <span className="font-medium text-body">{r.hostName}</span></span>
                    <span className="font-mono">{r.totalRounds} rounds · {r.roundTime}s</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
                    <div className="flex gap-1.5 text-lg">
                      {r.categories.map(c => {
                        const meta = CATEGORY_META.find(m => m.id === c);
                        return meta ? <span key={c} title={meta.label}>{meta.icon}</span> : null;
                      })}
                    </div>
                    <span className="text-sm font-medium text-link transition-transform group-hover:translate-x-0.5">Join →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* ============================ HERO + CARD ============================ */
        <section className="relative mx-auto w-full max-w-page px-4 pt-12 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-5 inline-block">Real-time · Multiplayer · No signup</p>
            <h1 className="display-2xl text-ink">
              Guess the <span className="text-gradient text-gradient-animate">filmi</span> star
              <br className="hidden sm:block" /> before anyone else.
            </h1>
            <p className="body-lg mx-auto mt-5 max-w-xl text-body sm:mt-6">
              A free, real-time Bollywood &amp; Indian cinema quiz you can spin up in seconds.
              Create a room, drop the link in the group chat, and race up to 50 friends.
            </p>
          </div>

          {kicked && (
            <div className="mx-auto mt-8 max-w-md rounded-md bg-error-soft px-4 py-3 text-center text-sm text-error-deep shadow-hairline">
              You were removed from the room by the host.
            </div>
          )}

          {/* Interactive auth card — the hero CTA */}
          <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
            <div className="card-lg p-6 sm:p-8">
              {mode === 'home' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-body">Your name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && playerName.trim() && setMode('create')}
                      maxLength={20}
                      placeholder="e.g. Priya"
                      className="input-field-lg"
                    />
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button
                    onClick={() => { if (!playerName.trim()) { setError('Enter your name'); return; } setMode('create'); setError(''); }}
                    className="btn-primary w-full"
                  >
                    Create a room
                  </button>
                  <button
                    onClick={() => { if (!playerName.trim()) { setError('Enter your name'); return; } setMode('join'); setError(''); }}
                    className="btn-secondary w-full"
                  >
                    Join with a code
                  </button>
                  <button
                    onClick={openBrowse}
                    className="w-full py-1 text-sm font-medium text-mute transition-colors hover:text-ink"
                  >
                    Browse public rooms →
                  </button>
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-5">
                  <button onClick={() => setMode('home')} className="text-sm font-medium text-mute transition-colors hover:text-ink">← Back</button>
                  <div className="rounded-md bg-canvas-soft py-5 text-center shadow-hairline">
                    <p className="eyebrow mb-1.5">Playing as</p>
                    <p className="display-md text-ink">{playerName || '…'}</p>
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button onClick={handleCreate} disabled={loading} className="btn-primary w-full">
                    {loading ? 'Creating…' : 'Create & start room'}
                  </button>
                </div>
              )}

              {mode === 'join' && (
                <div className="space-y-4">
                  <button onClick={() => setMode('home')} className="text-sm font-medium text-mute transition-colors hover:text-ink">← Back</button>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-body">Room code</label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={e => setRoomCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      maxLength={4}
                      placeholder="ABCD"
                      className="input-field-lg text-center font-mono text-2xl uppercase tracking-[0.5em]"
                    />
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button onClick={() => handleJoin()} disabled={loading} className="btn-primary w-full">
                    {loading ? 'Joining…' : 'Join room'}
                  </button>
                </div>
              )}
            </div>

            <p className="mt-5 text-center font-mono text-xs text-mute">
              No signup · Up to 50 players · Free forever
            </p>
          </div>

          {/* Category pill row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 sm:mt-14">
            {CATEGORY_META.map(c => (
              <span key={c.id} className="pill-tab">
                <span className="text-base">{c.icon}</span> {c.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* How it works — 3-up feature cards (hidden in browse mode) */}
      {mode !== 'browse' && (
        <section className="mx-auto w-full max-w-page px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <p className="eyebrow mb-4">How it works</p>
            <h2 className="display-lg text-ink">Three steps to game night.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { step: '01', icon: '🎮', title: 'Create a room', body: 'Enter your name and spin up a private room. Share the link on WhatsApp — friends join in one tap, no account needed.' },
              { step: '02', icon: '🖼️', title: 'Guess the star', body: 'A photo drops. Type the Bollywood actor, Hindi movie, or South Indian star as fast as you can before the timer runs out.' },
              { step: '03', icon: '🏆', title: 'Win the round', body: 'Faster answers score more. Stack streaks for bonus multipliers. The top scorer at the final whistle takes the crown.' },
            ].map(f => (
              <div key={f.step} className="card-md flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{f.icon}</span>
                  <span className="font-mono text-xs text-mute">{f.step}</span>
                </div>
                <h3 className="display-sm mt-6 text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Polarity-flipped dark band */}
      {mode !== 'browse' && (
        <section className="relative overflow-hidden bg-band">
          <div className="mesh-dark pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative mx-auto w-full max-w-page px-4 py-20 sm:px-6 sm:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow mb-4 text-white/50">Built for the group chat</p>
              <h2 className="display-lg text-white">
                Spin up a room. Drop the link. Play in seconds.
              </h2>
              <p className="body-lg mx-auto mt-5 max-w-lg text-white/60">
                No installs, no logins, no friction. Just a code and your crew.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => startCreate()}
                  className="btn rounded-pill bg-white px-6 text-base text-[#171717] shadow-btn-primary hover:opacity-90 active:scale-[0.98] h-12 w-full sm:w-auto"
                >
                  Create a room
                </button>
                <button
                  onClick={openBrowse}
                  className="btn h-12 w-full rounded-pill border border-white/15 px-6 text-base text-white/80 transition-colors hover:bg-white/10 sm:w-auto"
                >
                  Browse public rooms
                </button>
              </div>
            </div>

            {/* Stat strip */}
            <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/10 shadow-card-dark sm:mt-16">
              {[
                { value: '50', label: 'players / room' },
                { value: '4', label: 'cinema categories' },
                { value: '∞', label: 'free games' },
              ].map(s => (
                <div key={s.label} className="bg-band px-3 py-6 text-center sm:px-4">
                  <div className="display-md text-gradient">{s.value}</div>
                  <div className="mt-1 font-mono text-[11px] text-white/50 sm:text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO / closing copy */}
      {mode !== 'browse' && (
        <section className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-mute">
            FilmiGuess is a free online multiplayer Bollywood quiz game. Test your knowledge of Indian
            cinema — from classic Hindi films to modern blockbusters, South Indian superstars and
            everything in between. Play with up to 50 friends, no account needed.
          </p>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-hairline bg-canvas">
        <div className="mx-auto flex w-full max-w-page flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <span className="text-sm font-semibold tracking-[-0.02em] text-ink">
            Filmi<span className="text-gradient">Guess</span>
          </span>
          <p className="font-mono text-xs text-mute">Made for Indian cinema fans · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
