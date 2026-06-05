import type { Room, Player, RoomSettings } from './types.js';
import { getQuestionsByCategories } from './questions.js';

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId: string, hostName: string): Room {
  const code = generateCode();
  const settings: RoomSettings = {
    totalRounds: 10,
    categories: ['bollywood_actor', 'hindi_movie', 'south_actor', 'classic_movie'],
  };

  const host: Player = {
    id: hostId,
    name: hostName,
    score: 0,
    streak: 0,
    isHost: true,
  };

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
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, playerId: string, playerName: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.state !== 'waiting') return null;
  if (room.players.size >= 50) return null;

  const player: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    streak: 0,
    isHost: false,
  };
  room.players.set(playerId, player);
  return room;
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

export function rejoinRoom(code: string, playerName: string, newSocketId: string): { room: Room; player: Player } | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  // Existing player (disconnected or active) — swap socket ID, preserve score
  for (const [oldId, player] of room.players) {
    if (player.name.toLowerCase() === playerName.toLowerCase()) {
      room.players.delete(oldId);
      player.id = newSocketId;
      player.disconnected = false;
      room.players.set(newSocketId, player);
      return { room, player };
    }
  }

  // Completely new player — only allowed while game is still in lobby
  if (room.state !== 'waiting' || room.players.size >= 50) return null;
  const player: Player = { id: newSocketId, name: playerName, score: 0, streak: 0, isHost: false };
  room.players.set(newSocketId, player);
  return { room, player };
}

export function startGame(room: Room): void {
  room.questions = getQuestionsByCategories(
    room.settings.categories,
    room.settings.totalRounds
  );
  room.currentQuestionIndex = 0;
  room.state = 'playing';
  for (const player of room.players.values()) {
    player.score = 0;
    player.streak = 0;
  }
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
