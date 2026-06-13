'use client';
import { useGameStore } from '@/store/gameStore';
import clsx from 'clsx';
import Avatar from './Avatar';

export default function PlayerList({ className }: { className?: string }) {
  const { room, myPlayer, guesses } = useGameStore();
  if (!room) return null;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className={clsx('card flex flex-col p-4', className)}>
      <h3 className="eyebrow mb-3 flex-shrink-0">Scores</h3>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sorted.map((p, i) => {
          const guess = guesses[p.id];
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${
                p.disconnected ? 'opacity-50' : ''
              } ${p.id === myPlayer?.id ? 'bg-canvas-soft shadow-hairline' : ''}`}
            >
              <span className="w-5 text-right font-mono text-xs text-mute">{i + 1}</span>
              <Avatar name={p.name} avatar={p.avatar} size={24} muted={p.disconnected} />
              <div className="min-w-0 flex-1">
                <span className={`block truncate font-medium ${p.disconnected ? 'text-mute' : 'text-ink'}`}>{p.name}</span>
                {/* Live guess feed — re-animates on every new attempt */}
                {guess && (
                  guess.isCorrect ? (
                    <span key={guess.timestamp} className="block animate-slide-up truncate text-xs font-medium text-success-deep">
                      ✓ guessed it in {guess.timeTaken}s
                    </span>
                  ) : (
                    <span key={guess.timestamp} className="block animate-slide-up truncate text-xs text-mute">
                      “{guess.guess}”
                    </span>
                  )
                )}
              </div>
              {p.disconnected
                ? <span className="font-mono text-xs text-mute">offline</span>
                : p.streak >= 3 && <span className="text-xs">🔥</span>
              }
              <span className="font-mono text-xs font-semibold text-ink">{p.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
