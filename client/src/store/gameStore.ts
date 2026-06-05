'use client';
import { create } from 'zustand';
import type { GameState, RoomPublic, Player, QuestionPublic, RoundWinner, PlayerScore, ChatMessage } from '@/types';

interface GameStore extends GameState {
  setRoom: (room: RoomPublic) => void;
  setMyPlayer: (player: Player) => void;
  setQuestion: (q: QuestionPublic, roundNumber: number, totalRounds: number, timeLimit: number) => void;
  setTimer: (t: number) => void;
  addWinner: (w: RoundWinner) => void;
  setRoundEnd: (answer: string, winners: RoundWinner[], scores: PlayerScore[]) => void;
  setFinished: (scores: PlayerScore[]) => void;
  addChat: (msg: ChatMessage) => void;
  markAnswered: () => void;
  setSpectating: (v: boolean) => void;
  reset: () => void;
}

const initialState: GameState = {
  room: null,
  myPlayer: null,
  currentQuestion: null,
  roundNumber: 0,
  totalRounds: 0,
  timeRemaining: 0,
  timeLimit: 25,
  roundWinners: [],
  lastRoundAnswer: null,
  finalScores: null,
  chatMessages: [],
  hasAnsweredThisRound: false,
  spectating: false,
};

export const useGameStore = create<GameStore>(set => ({
  ...initialState,

  setRoom: room => set({ room }),
  setMyPlayer: myPlayer => set({ myPlayer }),

  setQuestion: (currentQuestion, roundNumber, totalRounds, timeLimit) =>
    set(state => ({
      currentQuestion,
      roundNumber,
      totalRounds,
      timeLimit,
      roundWinners: [],
      lastRoundAnswer: null,
      hasAnsweredThisRound: false,
      room: state.room ? { ...state.room, state: 'playing' as const } : null,
    })),

  setTimer: timeRemaining => set({ timeRemaining }),

  addWinner: winner =>
    set(state => ({ roundWinners: [...state.roundWinners, winner] })),

  setRoundEnd: (lastRoundAnswer, roundWinners, scores) =>
    set(state => ({
      lastRoundAnswer,
      roundWinners,
      room: state.room
        ? { ...state.room, state: 'between_rounds' as const, players: scores.map(s => ({ ...s, streak: 0 })) }
        : null,
    })),

  setFinished: finalScores => set({ finalScores }),

  addChat: msg =>
    set(state => ({
      chatMessages: [...state.chatMessages.slice(-100), msg],
    })),

  markAnswered: () => set({ hasAnsweredThisRound: true }),

  setSpectating: (spectating) => set({ spectating }),

  reset: () => set(initialState),
}));
