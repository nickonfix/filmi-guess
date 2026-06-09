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
  settings: RoomSettings;
}

export interface RoomSettings {
  totalRounds: number;
  categories: Category[];
  roundTime: number;
  isPublic: boolean;
}

export interface PublicRoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  totalRounds: number;
  roundTime: number;
  categories: Category[];
  /** Current room state so the browser can show "In lobby" vs "In progress". */
  state: RoomState;
  /** 1-based round number when a game is in progress (0 in the lobby). */
  roundNumber: number;
}

export const CATEGORY_META: { id: Category; icon: string; label: string }[] = [
  { id: 'bollywood_actor', icon: '🎬', label: 'Bollywood Actors' },
  { id: 'hindi_movie', icon: '🎥', label: 'Hindi Movies' },
  { id: 'south_actor', icon: '🌟', label: 'South Stars' },
  { id: 'classic_movie', icon: '🏆', label: 'Classic Films' },
];

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
