import { randomUUID } from 'node:crypto';
import type { Room, Player, RoomSettings, Category, PublicRoomSummary } from './types.js';
import { getQuestions } from './questionStore.js';

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId: string, hostName: string, avatar?: string): { room: Room; token: string } {
  const code = generateCode();
  const settings: RoomSettings = {
    totalRounds: 10,
    categories: ['bollywood_actor', 'hindi_movie', 'south_actor', 'classic_movie'],
    roundTime: 25,
    isPublic: false,
    difficulty: 'mixed',
  };

  const host: Player = {
    id: hostId,
    name: hostName,
    score: 0,
    streak: 0,
    isHost: true,
    avatar,
  };

  const token = randomUUID();

  const room: Room = {
    code,
    players: new Map([[hostId, host]]),
    state: 'waiting',
    currentQuestion: null,
    currentQuestionIndex: 0,
    questions: [],
    timer: null,
    timeRemaining: 0,
    roundWinners: [],
    settings,
    playerTokens: new Map([[hostName.toLowerCase(), token]]),
    currentImageToken: null,
    hintUsers: new Set(),
    roundStartedAt: 0,
  };

  rooms.set(code, room);
  return { room, token };
}

export function joinRoom(code: string, playerId: string, playerName: string, avatar?: string): { room: Room; token: string } | null {
  const room = rooms.get(code.toUpperCase());
  // Joinable at any point while the game is live — only a finished game is closed.
  if (!room || room.state === 'finished') return null;
  if (room.players.size >= 50) return null;

  const player: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    streak: 0,
    isHost: false,
    avatar,
  };
  room.players.set(playerId, player);

  const token = randomUUID();
  room.playerTokens.set(playerName.toLowerCase(), token);
  return { room, token };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomByPlayerId(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) return room;
  }
  return undefined;
}

export function removePlayer(room: Room, playerId: string): void {
  const wasHost = room.players.get(playerId)?.isHost;
  room.players.delete(playerId);

  if (wasHost && room.players.size > 0) {
    const nextPlayer = room.players.values().next().value;
    if (nextPlayer) nextPlayer.isHost = true;
  }

  if (room.players.size === 0) {
    if (room.timer) clearInterval(room.timer);
    rooms.delete(room.code);
  }
}

export function markPlayerDisconnected(room: Room, playerId: string): void {
  const player = room.players.get(playerId);
  if (player) player.disconnected = true;
}

export function rejoinRoom(code: string, playerName: string, token: string, newSocketId: string, avatar?: string): { room: Room; player: Player; token: string; isNew: boolean } | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  const key = playerName.toLowerCase();
  const expectedToken = room.playerTokens.get(key);

  // Existing player (disconnected or active) — only reattach if the session token matches,
  // otherwise anyone who learns a player's public display name could hijack their identity/score
  for (const [oldId, player] of room.players) {
    if (player.name.toLowerCase() === key) {
      if (!expectedToken || expectedToken !== token) return null;
      room.players.delete(oldId);
      player.id = newSocketId;
      player.disconnected = false;
      if (avatar !== undefined) player.avatar = avatar;
      room.players.set(newSocketId, player);
      return { room, player, token: expectedToken, isNew: false };
    }
  }

  // Completely new player — allowed any time before the game finishes (join-in-progress)
  if (room.state === 'finished' || room.players.size >= 50) return null;
  const newToken = randomUUID();
  const player: Player = { id: newSocketId, name: playerName, score: 0, streak: 0, isHost: false, avatar };
  room.players.set(newSocketId, player);
  room.playerTokens.set(key, newToken);
  return { room, player, token: newToken, isNew: true };
}

export function startGame(room: Room): void {
  room.questions = getQuestions(
    room.settings.categories,
    room.settings.difficulty,
    room.settings.totalRounds
  );
  room.currentQuestionIndex = 0;
  room.state = 'playing';
  for (const player of room.players.values()) {
    player.score = 0;
    player.streak = 0;
  }
}

/** Return a finished room to the lobby so the host can tweak the rules and replay
 *  with the same players. Clears game progress and resets everyone's score. */
export function resetRoomToLobby(room: Room): void {
  if (room.timer) { clearInterval(room.timer); room.timer = null; }
  room.state = 'waiting';
  room.currentQuestion = null;
  room.currentImageToken = null;
  room.hintUsers = new Set();
  room.currentQuestionIndex = 0;
  room.questions = [];
  room.roundWinners = [];
  room.timeRemaining = 0;
  for (const player of room.players.values()) {
    player.score = 0;
    player.streak = 0;
  }
}

const VALID_CATEGORIES: Category[] = ['bollywood_actor', 'hindi_movie', 'south_actor', 'classic_movie'];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Apply host-supplied settings with validation. Returns the updated settings. */
export function updateSettings(room: Room, partial: Partial<RoomSettings>): RoomSettings {
  const s = room.settings;
  if (typeof partial.totalRounds === 'number' && Number.isFinite(partial.totalRounds)) {
    s.totalRounds = clamp(partial.totalRounds, 3, 30);
  }
  if (typeof partial.roundTime === 'number' && Number.isFinite(partial.roundTime)) {
    s.roundTime = clamp(partial.roundTime, 10, 60);
  }
  if (typeof partial.isPublic === 'boolean') {
    s.isPublic = partial.isPublic;
  }
  if (typeof partial.difficulty === 'string' && ['easy', 'medium', 'hard', 'mixed'].includes(partial.difficulty)) {
    s.difficulty = partial.difficulty;
  }
  if (Array.isArray(partial.categories)) {
    const valid = partial.categories.filter((c): c is Category => VALID_CATEGORIES.includes(c as Category));
    // Always keep at least one category selected
    if (valid.length > 0) s.categories = [...new Set(valid)];
  }
  return s;
}

/** Remove a player by id (used for host kicks). Returns the kicked player, if any. */
export function kickPlayer(room: Room, targetId: string): Player | undefined {
  const target = room.players.get(targetId);
  if (!target || target.isHost) return undefined; // never kick the host
  room.players.delete(targetId);
  room.playerTokens.delete(target.name.toLowerCase());
  return target;
}

/** Public rooms that are joinable — i.e. live (lobby or in-progress), not finished or full. */
export function listPublicRooms(): PublicRoomSummary[] {
  const out: PublicRoomSummary[] = [];
  for (const room of rooms.values()) {
    if (!room.settings.isPublic || room.state === 'finished' || room.players.size >= 50) continue;
    const host = [...room.players.values()].find(p => p.isHost);
    out.push({
      code: room.code,
      hostName: host?.name ?? 'Host',
      playerCount: room.players.size,
      totalRounds: room.settings.totalRounds,
      roundTime: room.settings.roundTime,
      categories: room.settings.categories,
      state: room.state,
      roundNumber: room.state === 'waiting' ? 0 : room.currentQuestionIndex + 1,
    });
  }
  // Lobbies first (easiest to join from the start), then by how full the room is.
  return out.sort((a, b) => {
    if (a.state === 'waiting' && b.state !== 'waiting') return -1;
    if (b.state === 'waiting' && a.state !== 'waiting') return 1;
    return b.playerCount - a.playerCount;
  });
}

export function getRoomPublic(room: Room) {
  return {
    code: room.code,
    players: [...room.players.values()],
    state: room.state,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.settings.totalRounds,
    settings: room.settings,
  };
}
