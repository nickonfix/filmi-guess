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
      callback('Room not found or game already started');
      return;
    }
    const { room, token } = result;
    socket.join(room.code);
    const roomPublic = getRoomPublic(room);
    const player = room.players.get(socket.id)!;
    // Send data in the callback so the client has it before navigating
    callback(null, { room: roomPublic, player, token });
    // Notify others in the room
    socket.to(room.code).emit('room:updated', roomPublic);
    console.log(`[room:join] ${name} joined room ${room.code}`);
  });

  socket.on('room:watch', ({ code }, callback) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) { callback('Room not found'); return; }
    socket.join(room.code);
    callback(null, {
      room: getRoomPublic(room),
      question: getQuestionPublic(room),
      roundNumber: room.currentQuestionIndex + 1,
      timeLimit: 25,
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
      timeLimit: 25,
    });
    socket.to(room.code).emit('room:updated', roomPublic);
    console.log(`[room:rejoin] ${playerName} rejoined room ${room.code} (score: ${player.score})`);
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

  socket.on('game:answer', answer => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || typeof answer !== 'string') return;
    const sanitized = answer.trim().slice(0, 100);
    const correct = handleAnswer(io, room, socket.id, sanitized);

    // Broadcast the attempt as a chat message (masked if wrong, shown if correct)
    const player = room.players.get(socket.id);
    if (player) {
      io.to(room.code).emit('chat:message', {
        playerId: socket.id,
        playerName: player.name,
        message: sanitized,
        isCorrect: correct,
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

    if (room.state === 'waiting') {
      // Lobby — remove immediately
      removePlayer(room, socket.id);
      if (room.players.size > 0) io.to(room.code).emit('room:updated', getRoomPublic(room));
    } else {
      // Game in progress — mark disconnected so others can see, keep score intact
      markPlayerDisconnected(room, socket.id);
      io.to(room.code).emit('room:updated', getRoomPublic(room));

      // Clean up after 2 minutes if they never rejoin
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
