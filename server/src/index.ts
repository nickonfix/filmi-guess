import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom,
  joinRoom,
  rejoinRoom,
  markPlayerDisconnected,
  getRoom,
  getRoomByPlayerId,
  removePlayer,
  startGame,
  getRoomPublic,
  updateSettings,
  kickPlayer,
  listPublicRooms,
  resetRoomToLobby,
} from './roomManager.js';
import { startRound, handleAnswer, getQuestionPublic } from './gameEngine.js';
import type { ServerToClientEvents, ClientToServerEvents } from './types.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

io.on('connection', socket => {
  console.log(`[connect] ${socket.id}`);

  socket.on('room:create', (playerName, callback) => {
    const name = playerName?.trim().slice(0, 20) || 'Player';
    const { room, token } = createRoom(socket.id, name);
    socket.join(room.code);
    const roomPublic = getRoomPublic(room);
    const player = room.players.get(socket.id)!;
    // Send data in the callback so the client has it before navigating
    callback({ code: room.code, room: roomPublic, player, token });
    console.log(`[room:create] ${name} created room ${room.code}`);
  });

  socket.on('room:join', ({ code, playerName }, callback) => {
    const name = playerName?.trim().slice(0, 20) || 'Player';
    const result = joinRoom(code, socket.id, name);
    if (!result) {
      callback('Room not found or the game has already finished');
      return;
    }
    const { room, token } = result;
    socket.join(room.code);
    const roomPublic = getRoomPublic(room);
    const player = room.players.get(socket.id)!;
    // Send data in the callback so the client has it before navigating.
    // Include the live question so a mid-game joiner lands straight on the board.
    callback(null, {
      room: roomPublic,
      player,
      token,
      question: getQuestionPublic(room),
      roundNumber: room.currentQuestionIndex + 1,
      timeLimit: room.settings.roundTime,
      timeRemaining: room.timeRemaining,
    });
    // Notify others in the room
    socket.to(room.code).emit('room:updated', roomPublic);
    console.log(`[room:join] ${name} joined room ${room.code} (state: ${room.state})`);
  });

  socket.on('room:watch', ({ code }, callback) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) { callback('Room not found'); return; }
    socket.join(room.code);
    callback(null, {
      room: getRoomPublic(room),
      question: getQuestionPublic(room),
      roundNumber: room.currentQuestionIndex + 1,
      timeLimit: room.settings.roundTime,
    });
    console.log(`[room:watch] ${socket.id} watching room ${room.code}`);
  });

  socket.on('room:rejoin', ({ code, playerName, token }, callback) => {
    const result = rejoinRoom(code, playerName, token, socket.id);
    if (!result) { callback('Room not found or game already started'); return; }
    const { room, player, token: sessionToken } = result;
    socket.join(room.code);
    const roomPublic = getRoomPublic(room);
    callback(null, {
      room: roomPublic,
      player,
      token: sessionToken,
      question: getQuestionPublic(room),
      roundNumber: room.currentQuestionIndex + 1,
      timeLimit: room.settings.roundTime,
    });
    socket.to(room.code).emit('room:updated', roomPublic);
    console.log(`[room:rejoin] ${playerName} rejoined room ${room.code} (score: ${player.score})`);
  });

  socket.on('rooms:list', callback => {
    if (typeof callback === 'function') callback(listPublicRooms());
  });

  socket.on('room:update_settings', (settings, callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) { callback?.('Room not found'); return; }
    const player = room.players.get(socket.id);
    if (!player?.isHost) { callback?.('Only the host can change settings'); return; }
    if (room.state !== 'waiting') { callback?.('Settings can only be changed in the lobby'); return; }
    updateSettings(room, settings ?? {});
    io.to(room.code).emit('room:updated', getRoomPublic(room));
    callback?.(null);
    console.log(`[room:update_settings] ${room.code}`, room.settings);
  });

  socket.on('room:kick', targetId => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || typeof targetId !== 'string') return;
    const host = room.players.get(socket.id);
    if (!host?.isHost) return;
    if (targetId === socket.id) return; // can't kick yourself
    const kicked = kickPlayer(room, targetId);
    if (!kicked) return;
    // Tell the kicked client, then remove them from the room channel
    io.to(targetId).emit('room:kicked');
    const kickedSocket = io.sockets.sockets.get(targetId);
    if (kickedSocket) kickedSocket.leave(room.code);
    io.to(room.code).emit('room:updated', getRoomPublic(room));
    console.log(`[room:kick] ${kicked.name} kicked from room ${room.code}`);
  });

  socket.on('game:start', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player?.isHost) return;
    if (room.state !== 'waiting') return;
    if (room.players.size < 1) return;

    startGame(room);
    io.to(room.code).emit('room:updated', getRoomPublic(room));
    startRound(io, room);
    console.log(`[game:start] Room ${room.code} started`);
  });

  // Host wants another match after the game finished — bring the room back to the
  // lobby so they can change the rules and start again with the same players.
  socket.on('game:play_again', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player?.isHost) return;
    if (room.state !== 'finished') return;
    resetRoomToLobby(room);
    io.to(room.code).emit('room:updated', getRoomPublic(room));
    console.log(`[game:play_again] Room ${room.code} returned to lobby`);
  });

  socket.on('game:answer', answer => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || typeof answer !== 'string') return;
    const sanitized = answer.trim().slice(0, 100);
    const winner = handleAnswer(io, room, socket.id, sanitized);

    // Broadcast the attempt as a chat message. A wrong guess shows the text the
    // player typed; a correct one hides it (so it doesn't spoil the answer) and
    // instead reports how fast they got it.
    const player = room.players.get(socket.id);
    if (player) {
      io.to(room.code).emit('chat:message', {
        playerId: socket.id,
        playerName: player.name,
        message: winner ? `guessed it in ${winner.timeTaken}s` : sanitized,
        isCorrect: !!winner,
        timestamp: Date.now(),
      });
    }
  });

  socket.on('chat:send', message => {
    const room = getRoomByPlayerId(socket.id);
    const player = room?.players.get(socket.id);
    if (!room || !player || typeof message !== 'string') return;
    io.to(room.code).emit('chat:message', {
      playerId: socket.id,
      playerName: player.name,
      message: message.trim().slice(0, 200),
      isCorrect: false,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    const playerName = player?.name ?? socket.id;

    if (room.state === 'waiting' && room.players.size > 1) {
      // Lobby with others still present — remove immediately so the player list updates.
      removePlayer(room, socket.id);
      io.to(room.code).emit('room:updated', getRoomPublic(room));
    } else {
      // Either a game in progress, or the last person in a lobby. Don't tear the room
      // down on a transient disconnect (tab blur, phone sleep, network blip) — that's
      // what made freshly-created public rooms vanish before anyone could join them.
      // Mark disconnected, keep the room (and its public listing) alive, and clean up
      // later only if they never reconnect.
      markPlayerDisconnected(room, socket.id);
      io.to(room.code).emit('room:updated', getRoomPublic(room));

      const oldId = socket.id;
      setTimeout(() => {
        const still = room.players.get(oldId);
        if (still?.disconnected) {
          removePlayer(room, oldId);
          if (room.players.size > 0) io.to(room.code).emit('room:updated', getRoomPublic(room));
        }
      }, 120_000);
    }
    console.log(`[disconnect] ${playerName} from room ${room.code}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎬 FilmiGuess server running on http://localhost:${PORT}\n`);
});
