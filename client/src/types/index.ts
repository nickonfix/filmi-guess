export type RoomState = 'waiting' | 'playing' | 'between_rounds' | 'finished';
export type Category = 'bollywood_actor' | 'hindi_movie' | 'south_actor' | 'classic_movie';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  isHost: boolean;
  disconnected?: boolean;
}

export interface RoomPublic {
  code: string;
  players: Player[];
  state: RoomState;
  currentQuestionIndex: number;
  totalQuestions: number;
  settings: {
    totalRounds: number;
    categories: Category[];
  };
}

export interface QuestionPublic {
  id: string;
  imageUrl: string;
  category: Category;
  difficulty: Difficulty;
  hint: string;
  submittedBy: string;
}

export interface RoundWinner {
  playerId: string;
  playerName: string;
  answer: string;
  pointsEarned: number;
  position: number;
}

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  isHost: boolean;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  isCorrect?: boolean;
  timestamp: number;
}

export interface GameState {
  room: RoomPublic | null;
  myPlayer: Player | null;
  currentQuestion: QuestionPublic | null;
  roundNumber: number;
  totalRounds: number;
  timeRemaining: number;
  timeLimit: number;
  roundWinners: RoundWinner[];
  lastRoundAnswer: string | null;
  finalScores: PlayerScore[] | null;
  chatMessages: ChatMessage[];
  hasAnsweredThisRound: boolean;
  spectating: boolean;
}
