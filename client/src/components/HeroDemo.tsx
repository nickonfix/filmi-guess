'use client';
import { useEffect, useState } from 'react';

/**
 * Interactive live game-preview that auto-plays FilmiGuess's core loop —
 * a film poster drops, opponents race to guess, *you* fire off the winning
 * answer and bank the points. Drives a tiny 3-phase state machine per round
 * (reveal → race → solved) and cycles through a handful of rounds forever.
 *
 * The whole card tilts in 3D toward the cursor via the parent `.tilt-card`
 * (CSS vars set by useParallax). Under reduced motion it freezes on a solved
 * round and skips the cycling.
 */

type Opponent = { name: string; emoji: string; text: string };
type Round = {
  title: string;
  meta: string;
  cat: string;
  icon: string;
  guess: string;
  time: string;
  from: string;
  to: string;
  opponents: [Opponent, Opponent]; // [wrong guess, still typing]
};

// Answers are *movie titles* (not anyone's likeness) so the demo stays on-brand
// without leaning on real photos — the poster art is an abstract gradient + glyph.
const ROUNDS: Round[] = [
  {
    title: 'Sholay', meta: '1975 · Classic', cat: 'Classic Film', icon: '🤠',
    guess: 'Sholay', time: '0.19', from: '#5a3b22', to: '#0b0b0b',
    opponents: [{ name: 'Mia', emoji: '🎭', text: 'Deewaar' }, { name: 'Arjun', emoji: '🪩', text: '' }],
  },
  {
    title: '3 Idiots', meta: '2009 · Comedy', cat: 'Hindi Movie', icon: '🎓',
    guess: '3 Idiots', time: '0.27', from: '#1f4a45', to: '#0a0a0a',
    opponents: [{ name: 'Zoe', emoji: '🎤', text: 'PK' }, { name: 'Kai', emoji: '🎟️', text: '' }],
  },
  {
    title: 'Dangal', meta: '2016 · Sports', cat: 'Hindi Movie', icon: '🤼',
    guess: 'Dangal', time: '0.22', from: '#4a1f33', to: '#0a0a0a',
    opponents: [{ name: 'Leo', emoji: '🌟', text: 'Sultan' }, { name: 'Nina', emoji: '🎭', text: '' }],
  },
  {
    title: 'DDLJ', meta: '1995 · Romance', cat: 'Classic Film', icon: '🚂',
    guess: 'DDLJ', time: '0.18', from: '#243a5e', to: '#0a0a0a',
    opponents: [{ name: 'Ava', emoji: '🪩', text: 'Kuch Kuch' }, { name: 'Finn', emoji: '🎤', text: '' }],
  },
];

type Phase = 0 | 1 | 2; // 0 reveal · 1 racing · 2 solved

export default function HeroDemo() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced) { setPhase(2); return; }
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 350);
    const t2 = setTimeout(() => setPhase(2), 1950);
    const t3 = setTimeout(() => setI(v => (v + 1) % ROUNDS.length), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [i, reduced]);

  const r = ROUNDS[i];
  const solved = phase === 2;

  // Timer bar: snaps full at reveal, then drains over the race, then freezes.
  const timerStyle = {
    transform: `scaleX(${phase === 0 ? 1 : 0.42})`,
    transition: phase === 0 ? 'none' : 'transform 1.6s linear',
  } as const;

  return (
    <div className="tilt-card mx-auto w-full max-w-[26rem]">
      <div className="demo-card" style={{ transform: 'translateZ(40px)' }}>
        {/* Window chrome — sells it as a real, live room */}
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="badge text-[11px] font-medium text-error-deep">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-error" />
            </span>
            LIVE
          </span>
          <span className="font-mono text-[11px] tracking-[0.32em] text-mute">ROOM · 7K2P</span>
          <div className="flex -space-x-1.5">
            {['🎭', '🎤', '🪩', '🌟'].map((e, k) => (
              <span key={k} className="flex h-5 w-5 items-center justify-center rounded-full bg-canvas-soft-2 text-[10px] ring-2 ring-canvas">
                {e}
              </span>
            ))}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-on-primary ring-2 ring-canvas">
              +9
            </span>
          </div>
        </div>

        {/* The "screen" — poster art + HUD */}
        <div
          className={`demo-screen transition-shadow duration-500 ${solved ? 'ring-2 ring-success' : ''}`}
          style={{ background: `radial-gradient(125% 100% at 50% 0%, ${r.from}, ${r.to})` }}
        >
          <div className="demo-scanlines" />
          <span key={`emo-${i}`} className={reduced ? 'demo-emoji' : 'demo-emoji demo-zoom'}>
            {r.icon}
          </span>

          {/* Top HUD: category · round · draining timer */}
          <div className="absolute inset-x-0 top-0 z-20 p-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {r.cat}
              </span>
              <span className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur-sm">
                Round {i + 1}/8
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/30">
              <div className={`h-full origin-left rounded-full ${solved ? 'bg-success' : 'bg-white/80'}`} style={timerStyle} />
            </div>
          </div>

          {/* Nameplate — slides up the instant the round is solved */}
          <div className={`demo-nameplate transition-all duration-500 ${solved ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-success">✓ Answer revealed</p>
            <p className="text-lg font-semibold text-white">
              {r.title} <span className="text-sm font-normal text-white/55">· {r.meta}</span>
            </p>
          </div>

          {/* Points pop */}
          {solved && (
            <div key={`pts-${i}`} className="demo-pop absolute right-3 top-[42%] z-30">
              <span className="rounded-full bg-success px-3 py-1.5 text-sm font-bold text-white shadow-lg">+10</span>
            </div>
          )}
        </div>

        {/* Live guess feed */}
        <div className="mt-3 space-y-1.5">
          <div className="demo-row bg-canvas-soft">
            <span>{r.opponents[0].emoji}</span>
            <span className="font-medium text-ink">{r.opponents[0].name}</span>
            <span className="ml-auto flex items-center gap-1.5 text-error-deep">
              <span className="text-[10px]">✕</span>
              <span className="line-through opacity-70">{r.opponents[0].text}</span>
            </span>
          </div>

          <div className="demo-row bg-canvas-soft">
            <span>{r.opponents[1].emoji}</span>
            <span className="font-medium text-ink">{r.opponents[1].name}</span>
            <span className="ml-auto flex items-center gap-1 text-mute">
              typing
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
              <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
            </span>
          </div>

          {/* You — the winning guess */}
          <div className={`demo-row transition-colors duration-300 ${solved ? 'bg-success-soft' : 'bg-canvas-soft-2'}`}>
            <span>🍿</span>
            <span className="font-semibold text-ink">You</span>
            {!solved ? (
              phase === 1 ? (
                <span
                  key={`type-${i}`}
                  className="demo-type ml-auto font-mono text-ink"
                  style={{ ['--w' as string]: `${r.guess.length}ch`, ['--steps' as string]: r.guess.length }}
                >
                  {r.guess}
                </span>
              ) : (
                <span className="ml-auto text-mute">…</span>
              )
            ) : (
              <span className="ml-auto flex items-center gap-2 text-success-deep">
                <span className="font-mono">{r.guess}</span>
                <span className="font-mono text-[11px] text-mute">{r.time}s</span>
                <span className="font-bold">+10</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
