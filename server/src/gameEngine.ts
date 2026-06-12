import type { Server } from 'socket.io';
import type { Room, RoundWinner, QuestionPublic } from './types.js';
import { isCorrectAnswer } from './answerMatcher.js';
import { getRoomPublic } from './roomManager.js';
import { registerRoundImage } from './imageProxy.js';

const DEFAULT_ROUND_TIME = 25; // fallback seconds per round
const BETWEEN_ROUND_TIME = 5; // seconds to show answer

export function getQuestionPublic(room: Room): QuestionPublic | null {
  if (!room.currentQuestion) return null;
  // Never expose the question id or source image URL — both can be traced back
  // to the answer (public repo question ids, Wikipedia filenames). The client
  // only ever sees an opaque token pointing at the server's image proxy.
  if (!room.currentImageToken) room.currentImageToken = registerRoundImage(room.currentQuestion);
  return {
    id: room.currentImageToken,
    imageUrl: `/img/${room.currentImageToken}`,
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

// Fixed, position-based scoring. The fastest correct guess earns the most and
// each subsequent guesser earns two fewer points; everyone who eventually gets
// it right still banks at least one point. Deterministic — no time/streak bonus.
const POINTS_BY_POSITION = [10, 8, 6, 4, 2];

function calcPoints(position: number): number {
  return POINTS_BY_POSITION[position - 1] ?? 1;
}

export function startRound(io: Server, room: Room): void {
  if (room.currentQuestionIndex >= room.questions.length) {
    endGame(io, room);
    return;
  }

  const roundTime = room.settings.roundTime || DEFAULT_ROUND_TIME;
  room.currentQuestion = room.questions[room.currentQuestionIndex];
  room.currentImageToken = registerRoundImage(room.currentQuestion);
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

/** Returns the winning entry if the guess was correct (and counted), else null. */
export function handleAnswer(io: Server, room: Room, playerId: string, answer: string): RoundWinner | null {
  if (room.state !== 'playing' || !room.currentQuestion) return null;

  const alreadyAnswered = room.roundWinners.some(w => w.playerId === playerId);
  if (alreadyAnswered) return null;

  const correct = isCorrectAnswer(answer, room.currentQuestion.answer, room.currentQuestion.aliases);
  if (!correct) return null;

  const player = room.players.get(playerId);
  if (!player) return null;

  player.streak++;
  const position = room.roundWinners.length + 1;
  const points = calcPoints(position);
  player.score += points;

  const roundTime = room.settings.roundTime || DEFAULT_ROUND_TIME;
  const timeTaken = Math.max(0, roundTime - room.timeRemaining);

  const winner: RoundWinner = {
    playerId,
    playerName: player.name,
    answer,
    pointsEarned: points,
    position,
    timeTaken,
  };
  room.roundWinners.push(winner);

  io.to(room.code).emit('game:correct_answer', winner);

  // End early when all connected players have answered
  const connected = [...room.players.values()].filter(p => !p.disconnected).length;
  if (room.roundWinners.length >= connected) {
    if (room.timer) { clearInterval(room.timer); room.timer = null; }
    endRound(io, room);
  }

  return winner;
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
