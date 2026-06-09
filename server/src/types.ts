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

export interface Question {
  id: string;
  imageUrl: string;
  answer: string;
  aliases: string[];
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

export interface Room {
  code: string;
  players: Map<string, Player>;
  state: RoomState;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  questions: Question[];
  timer: ReturnType<typeof setInterval> | null;
  timeRemaining: number;
  roundWinners: RoundWinner[];
  settings: RoomSettings;
  /** Lowercase player name -> session token, required to reattach to that player via room:rejoin */
  playerTokens: Map<string, string>;
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

// Socket event payloads
export interface ServerToClientEvents {
  'room:joined': (data: { room: RoomPublic; player: Player }) => void;
  'room:updated': (room: RoomPublic) => void;
  'room:error': (message: string) => void;
  'room:kicked': () => void;
  'game:round_start': (data: { question: QuestionPublic; roundNumber: number; totalRounds: number; timeLimit: number }) => void;
  'game:timer': (timeRemaining: number) => void;
  'game:correct_answer': (winner: RoundWinner) => void;
  'game:round_end': (data: { answer: string; winners: RoundWinner[]; scores: PlayerScore[] }) => void;
  'game:finished': (scores: PlayerScore[]) => void;
  'chat:message': (msg: ChatMessage) => void;
}

export interface ClientToServerEvents {
  'room:create': (playerName: string, callback: (data: { code: string; room: RoomPublic; player: Player; token: string }) => void) => void;
  'room:join': (data: { code: string; playerName: string }, callback: (err: string | null, data?: { room: RoomPublic; player: Player; token: string; question: QuestionPublic | null; roundNumber: number; timeLimit: number; timeRemaining: number }) => void) => void;
  'room:rejoin': (data: { code: string; playerName: string; token: string }, callback: (err: string | null, data?: { room: RoomPublic; player: Player; token: string; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => void) => void;
  'room:watch': (data: { code: string }, callback: (err: string | null, data?: { room: RoomPublic; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => void) => void;
  'game:start': () => void;
  'game:answer': (answer: string) => void;
  'chat:send': (message: string) => void;
  'room:update_settings': (settings: Partial<RoomSettings>, callback?: (err: string | null) => void) => void;
  'room:kick': (playerId: string) => void;
  'rooms:list': (callback: (rooms: PublicRoomSummary[]) => void) => void;
}

export interface QuestionPublic {
  id: string;
  imageUrl: string;
  category: Category;
  difficulty: Difficulty;
  hint: string;
  submittedBy: string;
}

export interface RoomPublic {
  code: string;
  players: Player[];
  state: RoomState;
  currentQuestionIndex: number;
  totalQuestions: number;
  settings: RoomSettings;
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
