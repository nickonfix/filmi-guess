import type { Server } from 'socket.io';
import type { Room, RoundWinner, QuestionPublic } from './types.js';
import { isCorrectAnswer } from './answerMatcher.js';
import { getRoomPublic } from './roomManager.js';

const DEFAULT_ROUND_TIME = 25; // fallback seconds per round
const BETWEEN_ROUND_TIME = 5; // seconds to show answer

export function getQuestionPublic(room: Room): QuestionPublic | null {
  if (!room.currentQuestion) return null;
  return {
    id: room.currentQuestion.id,
    imageUrl: room.currentQuestion.imageUrl,
    category: room.currentQuestion.category,
    difficulty: room.currentQuestion.difficulty,
    hint: room.currentQuestion.hint,
    submittedBy: room.currentQuestion.submittedBy,
  };
}

function getScores(room: Room) {
  return [...room.players.values()].map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    correctAnswers: 0,
    isHost: p.isHost,
  })).sort((a, b) => b.score - a.score);
}

function calcPoints(position: number, timeRemaining: number, streak: number, roundTime: number): number {
  const basePoints = position === 1 ? 1000 : position === 2 ? 700 : position === 3 ? 500 : 200;
  const speedBonus = position <= 3 ? Math.floor((timeRemaining / roundTime) * 200) : 0;
  const multiplier = streak >= 3 ? 1.5 : 1;
  return Math.floor((basePoints + speedBonus) * multiplier);
}

export function startRound(io: Server, room: Room): void {
  if (room.currentQuestionIndex >= room.questions.length) {
    endGame(io, room);
    return;
  }

  const roundTime = room.settings.roundTime || DEFAULT_ROUND_TIME;
  room.currentQuestion = room.questions[room.currentQuestionIndex];
  room.roundWinners = [];
  room.state = 'playing';
  room.timeRemaining = roundTime;

  const questionPublic = getQuestionPublic(room);

  io.to(room.code).emit('game:round_start', {
    question: questionPublic,
    roundNumber: room.currentQuestionIndex + 1,
    totalRounds: room.questions.length,
    timeLimit: roundTime,
  });

  if (room.timer) clearInterval(room.timer);

  room.timer = setInterval(() => {
    room.timeRemaining--;
    io.to(room.code).emit('game:timer', room.timeRemaining);

    if (room.timeRemaining <= 0) {
      clearInterval(room.timer!);
      room.timer = null;
      endRound(io, room);
    }
  }, 1000);
}

export function handleAnswer(io: Server, room: Room, playerId: string, answer: string): boolean {
  if (room.state !== 'playing' || !room.currentQuestion) return false;

  const alreadyAnswered = room.roundWinners.some(w => w.playerId === playerId);
  if (alreadyAnswered) return false;

  const correct = isCorrectAnswer(answer, room.currentQuestion.answer, room.currentQuestion.aliases);
  if (!correct) return false;

  const player = room.players.get(playerId);
  if (!player) return false;

  player.streak++;
  const position = room.roundWinners.length + 1;
  const points = calcPoints(position, room.timeRemaining, player.streak, room.settings.roundTime || DEFAULT_ROUND_TIME);
  player.score += points;

  const winner: RoundWinner = {
    playerId,
    playerName: player.name,
    answer,
    pointsEarned: points,
    position,
  };
  room.roundWinners.push(winner);

  io.to(room.code).emit('game:correct_answer', winner);

  // End early when all connected players have answered
  const connected = [...room.players.values()].filter(p => !p.disconnected).length;
  if (room.roundWinners.length >= connected) {
    if (room.timer) { clearInterval(room.timer); room.timer = null; }
    endRound(io, room);
  }

  return true;
}

function endRound(io: Server, room: Room): void {
  room.state = 'between_rounds';

  // Reset streak for players who didn't answer
  const answeredIds = new Set(room.roundWinners.map(w => w.playerId));
  for (const [id, player] of room.players) {
    if (!answeredIds.has(id)) player.streak = 0;
  }

  // Broadcast new room state so client knows we're in between_rounds
  io.to(room.code).emit('room:updated', getRoomPublic(room));

  io.to(room.code).emit('game:round_end', {
    answer: room.currentQuestion!.answer,
    winners: room.roundWinners,
    scores: getScores(room),
  });

  room.currentQuestionIndex++;

  setTimeout(() => {
    if (room.currentQuestionIndex >= room.questions.length) {
      endGame(io, room);
    } else {
      startRound(io, room);
    }
  }, BETWEEN_ROUND_TIME * 1000);
}

function endGame(io: Server, room: Room): void {
  room.state = 'finished';
  
  if (room.timer) { clearInterval(room.timer); room.timer = null; }
  io.to(room.code).emit('game:finished', getScores(room));
  io.to(room.code).emit('room:updated', getRoomPublic(room));
}
