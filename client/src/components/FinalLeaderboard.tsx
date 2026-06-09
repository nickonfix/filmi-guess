'use client';
import { useRouter } from 'next/navigation';
import type { PlayerScore } from '@/types';

interface Props {
  scores: PlayerScore[];
  myId: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function FinalLeaderboard({ scores, myId }: Props) {
  const router = useRouter();
  const winner = scores[0];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Celebratory mesh */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]">
        <div className="mesh mesh-drift absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-canvas-soft" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
        <div className="space-y-6">
          {/* Winner — polarity-flipped dark card */}
          {winner && (
            <div className="relative overflow-hidden rounded-lg bg-band p-8 text-center shadow-card-dark">
              <div className="mesh-dark pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative">
                <div className="text-6xl">🏆</div>
                <p className="eyebrow mt-3 text-white/50">Winner</p>
                <h2 className="display-lg mt-1 text-gradient">{winner.name}</h2>
                <p className="mt-2 font-mono text-lg text-white/70">
                  {winner.score} <span className="text-sm text-white/40">points</span>
                </p>
              </div>
            </div>
          )}

          {/* Full leaderboard */}
          <div className="card-md p-6">
            <h3 className="eyebrow mb-4">Final scores</h3>
            <div className="space-y-2">
              {scores.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${
                    p.id === myId ? 'bg-canvas-soft shadow-hairline' : ''
                  }`}
                >
                  <span className="w-7 text-center text-lg">{MEDALS[i] || <span className="font-mono text-sm text-mute">{i + 1}</span>}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-g-develop-start to-g-preview-end text-sm font-semibold text-white">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="flex-1 font-medium text-ink">{p.name}</span>
                  {p.id === myId && <span className="text-xs text-mute">You</span>}
                  <span className="font-mono font-semibold text-ink">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.push('/')} className="btn-primary flex-1">
              Play again
            </button>
            <button
              onClick={() => {
                const text = `I scored ${scores.find(s => s.id === myId)?.score || 0} points on FilmiGuess! Can you beat me? 🎬`;
                navigator.share?.({ text, url: window.location.origin }) ??
                  navigator.clipboard.writeText(text);
              }}
              className="btn-secondary px-6"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
