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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Winner announcement */}
        {winner && (
          <div className="text-center space-y-2">
            <div className="text-6xl">🏆</div>
            <p className="text-gray-400">Winner</p>
            <h2 className="text-4xl font-black text-brand-gold">{winner.name}</h2>
            <p className="text-2xl font-bold text-white">{winner.score} <span className="text-gray-400 text-base">points</span></p>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3">
          <h3 className="text-gray-400 text-sm font-medium mb-4">Final Scores</h3>
          {scores.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                p.id === myId ? 'bg-brand-orange/10 border border-brand-orange/30' : 'bg-brand-dark'
              }`}
            >
              <span className="text-xl w-8">{MEDALS[i] || `${i + 1}`}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center text-sm font-bold">
                {p.name[0].toUpperCase()}
              </div>
              <span className="flex-1 font-medium">{p.name}</span>
              {p.id === myId && <span className="text-xs text-gray-500">You</span>}
              <span className="text-brand-gold font-bold">{p.score}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-brand-orange hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02]"
          >
            Play Again
          </button>
          <button
            onClick={() => {
              const text = `I scored ${scores.find(s => s.id === myId)?.score || 0} points on FilmiGuess! Can you beat me? 🎬`;
              navigator.share?.({ text, url: window.location.origin }) ??
                navigator.clipboard.writeText(text);
            }}
            className="bg-brand-card border border-brand-border hover:border-brand-pink text-white font-bold py-4 px-6 rounded-xl transition-all"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
