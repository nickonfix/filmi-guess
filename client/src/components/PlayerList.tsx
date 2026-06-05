'use client';
import { useGameStore } from '@/store/gameStore';

export default function PlayerList() {
  const { room, myPlayer } = useGameStore();
  if (!room) return null;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Scores</h3>
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              p.disconnected ? 'opacity-50' : ''
            } ${p.id === myPlayer?.id ? 'bg-brand-orange/10 border border-brand-orange/20' : ''}`}
          >
            <span className="text-gray-600 w-5 text-right text-xs">{i + 1}</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              p.disconnected
                ? 'bg-gray-700 text-gray-500'
                : 'bg-gradient-to-br from-brand-orange to-brand-pink'
            }`}>
              {p.name[0].toUpperCase()}
            </div>
            <span className={`truncate flex-1 font-medium ${p.disconnected ? 'text-gray-500' : ''}`}>{p.name}</span>
            {p.disconnected
              ? <span className="text-xs text-gray-600">offline</span>
              : p.streak >= 3 && <span className="text-xs">🔥</span>
            }
            <span className="text-brand-gold font-bold text-xs">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
