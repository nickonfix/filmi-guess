'use client';
import { useGameStore } from '@/store/gameStore';
import { avatarColor } from '@/lib/avatar';

export default function PlayerList() {
  const { room, myPlayer } = useGameStore();
  if (!room) return null;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="card p-4">
      <h3 className="eyebrow mb-3">Scores</h3>
      <div className="space-y-1">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
              p.disconnected ? 'opacity-50' : ''
            } ${p.id === myPlayer?.id ? 'bg-canvas-soft shadow-hairline' : ''}`}
          >
            <span className="w-5 text-right font-mono text-xs font-bold text-mute">{i + 1}</span>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white"
              style={{ backgroundColor: p.disconnected ? 'rgb(var(--hairline-strong))' : avatarColor(p.name) }}
            >
              {p.name[0].toUpperCase()}
            </div>
            <span className={`flex-1 truncate font-bold ${p.disconnected ? 'text-mute' : 'text-ink'}`}>{p.name}</span>
            {p.disconnected
              ? <span className="font-mono text-xs text-mute">offline</span>
              : p.streak >= 3 && <span className="text-xs">🔥</span>
            }
            <span className="font-mono text-sm font-extrabold text-teal-deep">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
