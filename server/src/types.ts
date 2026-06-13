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
  /** Optional profile-picture URL (Supabase Storage URL or inline data URL). */
  avatar?: string;
}

/** Percentages (0–100) of the original image to KEEP. Used to cut the
 *  printed title off movie posters so the answer isn't visible on screen. */
export interface ImageCrop {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
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
  crop?: ImageCrop;
}

export interface RoundWinner {
  playerId: string;
  playerName: string;
  answer: string;
  pointsEarned: number;
  position: number;
  /** Seconds elapsed in the round when this player guessed correctly. */
  timeTaken: number;
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
  /** Opaque token for the current round's proxied image (never expose the source URL —
   *  Wikipedia filenames contain the answer). */
  currentImageToken: string | null;
  /** Players who revealed the hint this round — their winnings are docked. */
  hintUsers: Set<string>;
  /** Wall-clock ms when the current round started — used for sub-second timing. */
  roundStartedAt: number;
}

export interface RoomSettings {
  totalRounds: number;
  categories: Category[];
  roundTime: number;
  isPublic: boolean;
  /** Question difficulty for the match — 'mixed' draws from all levels. */
  difficulty: Difficulty | 'mixed';
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
  'game:guess': (guess: PlayerGuess) => void;
  'chat:message': (msg: ChatMessage) => void;
}

/** A player's answer attempt, shown live under their name in the score list.
 *  Correct guesses carry an empty `guess` so the answer is never broadcast. */
export interface PlayerGuess {
  playerId: string;
  playerName: string;
  guess: string;
  isCorrect: boolean;
  timeTaken?: number;
  timestamp: number;
}

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; avatar?: string }, callback: (data: { code: string; room: RoomPublic; player: Player; token: string }) => void) => void;
  'room:join': (data: { code: string; playerName: string; avatar?: string }, callback: (err: string | null, data?: { room: RoomPublic; player: Player; token: string; question: QuestionPublic | null; roundNumber: number; timeLimit: number; timeRemaining: number }) => void) => void;
  'room:rejoin': (data: { code: string; playerName: string; token: string; avatar?: string }, callback: (err: string | null, data?: { room: RoomPublic; player: Player; token: string; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => void) => void;
  'room:watch': (data: { code: string }, callback: (err: string | null, data?: { room: RoomPublic; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => void) => void;
  'game:start': () => void;
  'game:play_again': () => void;
  'room:leave': () => void;
  'game:answer': (answer: string) => void;
  'game:hint': (callback: (data: { hint: string; score: number }) => void) => void;
  'chat:send': (message: string) => void;
  'room:update_settings': (settings: Partial<RoomSettings>, callback?: (err: string | null) => void) => void;
  'room:kick': (playerId: string) => void;
  'rooms:list': (callback: (rooms: PublicRoomSummary[]) => void) => void;
}

// The hint is deliberately NOT part of the public question payload — it's
// only handed out via the `game:hint` request so the server can dock points.
export interface QuestionPublic {
  id: string;
  imageUrl: string;
  category: Category;
  difficulty: Difficulty;
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
  avatar?: string;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  isCorrect?: boolean;
  /** System notice (e.g. join/leave) — rendered differently from player chat. */
  system?: boolean;
  timestamp: number;
}
