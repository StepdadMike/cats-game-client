// ─────────────────────────────────────────────
//  Question Types
// ─────────────────────────────────────────────

export type QuestionType =
  | 'multiple-choice'
  | 'guess-waves'
  | 'guess-image'
  | 'guess-audio'
  | 'draw-this'
  | 'either-or'
  | 'memefy'
  | 'timeline'
  | 'odd-one-out';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple Choice',
  'guess-waves':     'Guess This (Waves)',
  'guess-image':     'Guess This (Image)',
  'guess-audio':     'Guess This (Audio)',
  'draw-this':       'Draw This',
  'either-or':       'Either Or',
  'memefy':          'Memefy',
  'timeline':        'Timeline',
  'odd-one-out':     'Odd One Out',
};

export const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  'multiple-choice': '#4e9af1',
  'guess-waves':     '#a855f7',
  'guess-image':     '#ec4899',
  'guess-audio':     '#f59e0b',
  'draw-this':       '#10b981',
  'either-or':       '#f97316',
  'memefy':          '#06b6d4',
  'timeline':        '#84cc16',
  'odd-one-out':     '#db2777',
};

export const QUESTION_DEFAULT_TIME: Record<QuestionType, number> = {
  'multiple-choice': 30,
  'guess-waves':     90,
  'guess-image':     45,
  'guess-audio':     45,
  'draw-this':       60,
  'either-or':       20,
  'memefy':          60,
  'timeline':        60,
  'odd-one-out':     60,
};

// ─────────────────────────────────────────────
//  Question Definitions
// ─────────────────────────────────────────────

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  timeLimit: number; // seconds
  points: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  correctAnswer: number; // index into options
  imageUrl?: string;     // optional image shown with the question
}

export type HintType = 'image' | 'audio' | 'drawing';

export interface WaveHint {
  id: string;
  type: HintType;
  content: string; // URL or data URL
}

export interface GuessWavesQuestion extends BaseQuestion {
  type: 'guess-waves';
  hints: WaveHint[];
  correctAnswer: string; // shown to host only
}

export interface GuessImageQuestion extends BaseQuestion {
  type: 'guess-image';
  imageUrl: string;
  correctAnswer: string;
}

export interface GuessAudioQuestion extends BaseQuestion {
  type: 'guess-audio';
  audioUrl: string;
  correctAnswer: string;
}

export interface DrawThisQuestion extends BaseQuestion {
  type: 'draw-this';
  // prompt describes what to draw; host judges best drawing
}

export interface EitherOrQuestion extends BaseQuestion {
  type: 'either-or';
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
}

export interface MemefyQuestion extends BaseQuestion {
  type: 'memefy';
  imageUrl: string;
  // prompt is the scenario or caption context; host picks funniest
}

export interface OddOneOutQuestion extends BaseQuestion {
  type: 'odd-one-out';
  oddPrompt: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
}

export interface TimelineQuestion extends BaseQuestion {
  type: 'timeline';
  events: TimelineEvent[]; // in correct chronological order
}

export type Question =
  | MultipleChoiceQuestion
  | GuessWavesQuestion
  | GuessImageQuestion
  | GuessAudioQuestion
  | DrawThisQuestion
  | EitherOrQuestion
  | MemefyQuestion
  | OddOneOutQuestion
  | TimelineQuestion;

// ─────────────────────────────────────────────
//  Grid / Game Structure
// ─────────────────────────────────────────────

export interface GridCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  question: Question | null;
  played: boolean;
}

export interface Board {
  id: string;
  categories: [string, string, string, string, string]; // one per column
  grid: GridCell[][]; // [row][col] — 5 rows × 5 cols
  rowPoints: [number, number, number, number, number];  // point value per row
}

export interface Game {
  id: string;
  name: string;
  boards: Board[]; // ordered list of boards; played sequentially
  createdAt: number;
  updatedAt: number;
}

// ─────────────────────────────────────────────
//  Room / Player
// ─────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  nameImageData: string; // canvas data URL of drawn name
  score: number;
  isConnected: boolean;
  isHost: boolean;
}

export type AnswerValue =
  | { type: 'choice'; value: number }        // multiple-choice index
  | { type: 'ab'; value: 'A' | 'B' }         // either-or
  | { type: 'drawing'; value: string }        // canvas data URL
  | { type: 'image-url'; value: string }      // submitted image URL
  | { type: 'text'; value: string }           // text answer
  | { type: 'order'; value: string[] };       // timeline: ordered event IDs

export interface PlayerAnswer {
  playerId: string;
  answer: AnswerValue;
  submittedAt: number;
  buzzedAt?: number;        // for guess-waves: when they buzzed in
  isCorrect?: boolean;      // undefined = not yet graded
  pointsAwarded: number;
  wave?: number;            // for guess-waves: which wave this answer belongs to
  votes?: string[];         // for host-pick questions: array of playerIds who voted for this answer
}

// ─────────────────────────────────────────────
//  Wave-specific state
// ─────────────────────────────────────────────

export interface WaveState {
  currentWave: number;           // 0-indexed
  totalWaves: number;
  lockedOutIds: string[];        // buzzed in (answered or timed out) — excluded from all future waves
  awaitingBuzzAnswers: string[]; // buzzed this wave but haven't typed their answer yet
  givenUpThisWave: string[];     // skipped this hint — resets each wave, can buzz next wave
  isReviewingWave: boolean;      // host is reviewing this wave's answers between waves
  waveReviewIndex: number;       // which of this wave's answers is currently shown (-1 = not started)
}

// ─────────────────────────────────────────────
//  Current Question State
// ─────────────────────────────────────────────

export type QuestionPhase =
  | 'answering'    // players submitting
  | 'reviewing'    // host reviewing one-by-one
  | 'voting';      // players and host voting (for host-pick questions)

export interface CurrentQuestion {
  cellId: string;
  question: Question;
  selectingPlayerId: string;
  answers: PlayerAnswer[];
  phase: QuestionPhase;
  reviewIndex: number;        // which answer is currently being reviewed
  waveState?: WaveState;      // only for guess-waves
  allAnswered: boolean;
  votesSubmitted?: string[];  // playerIds who have voted (for voting phase)
  oddPlayerId?: string;
}

// ─────────────────────────────────────────────
//  Room State
// ─────────────────────────────────────────────

export type GamePhase =
  | 'lobby'
  | 'player-select'   // countdown + random player selection
  | 'question-active' // players answering
  | 'reviewing'       // host reviewing answers
  | 'game-over';

export interface RoomState {
  seed: string;
  game: Game;
  players: Player[];
  phase: GamePhase;
  currentPlayerIndex: number; // whose turn to pick
  currentQuestion: CurrentQuestion | null;
  timerSeconds: number;
  timerMax: number;
  isPaused: boolean;
  selectedPlayerId: string | null; // who was chosen to pick
  rankings: Player[];
  currentBoardIndex: number;
}

// ─────────────────────────────────────────────
//  WebSocket Messages
// ─────────────────────────────────────────────

export type ClientMessage =
  | { type: 'CREATE_ROOM'; gameData: Game }
  | { type: 'JOIN_ROOM'; roomSeed: string; playerName: string; nameImageData: string }
  | { type: 'REJOIN_ROOM'; roomSeed: string; playerId: string }
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'SELECT_QUESTION'; cellId: string }
  | { type: 'SUBMIT_ANSWER'; answer: AnswerValue }
  | { type: 'BUZZ_IN' }
  | { type: 'GIVE_UP_WAVE' }
  | { type: 'GRADE_ANSWER'; playerId: string; isCorrect: boolean }
  | { type: 'CAST_VOTE'; votedForPlayerId: string }
  | { type: 'NEXT_REVIEW' }
  | { type: 'END_QUESTION' }
  | { type: 'NEXT_WAVE' }
  | { type: 'KICK_PLAYER'; playerId: string };

export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomSeed: string; playerId: string; roomState: RoomState }
  | { type: 'ROOM_JOINED'; roomState: RoomState; playerId: string }
  | { type: 'ROOM_STATE_UPDATE'; roomState: RoomState }
  | { type: 'TIMER_TICK'; timeLeft: number }
  | { type: 'PLAYER_BUZZED'; playerId: string }
  | { type: 'GAME_OVER'; rankings: Player[] }
  | { type: 'ERROR'; message: string };
