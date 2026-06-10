// Per-player avatar accent — a stable colour derived from the player's name so
// it stays the same across the lobby, the ring and the leaderboard.
const AVATAR_COLORS = ['#1ab0a2', '#ef6f5e', '#4fa0dd', '#f4c152', '#62b24e', '#a874d6'];

export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
