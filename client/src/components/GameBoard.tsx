'use client';
import { useState, useEffect, type CSSProperties } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import { leaveRoom } from '@/lib/leaveRoom';
import { getSavedName, getSavedToken, saveToken } from '@/lib/playerName';
import { avatarColor } from '@/lib/avatar';
import AnswerInput from './AnswerInput';
import PlayerList from './PlayerList';
import ChatPanel from './ChatPanel';
import ThemeToggle from './ThemeToggle';
import clsx from 'clsx';
import type { Player, QuestionPublic, RoomPublic } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  bollywood_actor: 'Bollywood Actor',
  hindi_movie: 'Hindi Movie',
  south_actor: 'South Indian Actor',
  classic_movie: 'Classic Movie',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-success-deep bg-success-soft',
  medium: 'text-warning-deep bg-warning-soft',
  hard: 'text-error-deep bg-error-soft',
};

const RING_MAX = 8;
function medal(position: number): string {
  return position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '✓';
}

// Place avatar `index` of `count` evenly around a circle, starting at the top.
function ringStyle(index: number, count: number): CSSProperties {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const radius = 43; // % of the square stage, measured from its centre
  return {
    left: `${50 + radius * Math.cos(angle)}%`,
    top: `${50 + radius * Math.sin(angle)}%`,
    transform: 'translate(-50%, -50%)',
  };
}

function JoinGameBanner() {
  const store = useGameStore();
  const [savedName, setSavedName] = useState('');

  useEffect(() => {
    setSavedName(getSavedName());
  }, []);

  function joinGame() {
    const room = store.room;
    if (!savedName || !room) return;
    getSocket().emit('room:rejoin', { code: room.code, playerName: savedName, token: getSavedToken() }, (err: string | null, data?: { room: RoomPublic; player: Player; token: string; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
      if (err || !data) return;
      saveToken(data.token);
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      store.setSpectating(false);
      if (data.question && data.room.state === 'playing') {
        store.setQuestion(data.question, data.roundNumber, data.room.totalQuestions, data.timeLimit);
      }
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t-2 border-hairline bg-canvas/95 px-4 py-3 backdrop-blur-md">
      <p className="text-sm font-semibold text-body">Watching as <span className="font-bold text-ink">{savedName || '…'}</span></p>
      <button onClick={joinGame} className="btn-primary-sm flex-shrink-0">Jump in!</button>
    </div>
  );
}

export default function GameBoard() {
  const {
    currentQuestion,
    roundNumber,
    totalRounds,
    timeRemaining,
    timeLimit,
    roundWinners,
    lastRoundAnswer,
    room,
    myPlayer,
    hasAnsweredThisRound,
    spectating,
  } = useGameStore();

  const isBetweenRounds = room?.state === 'between_rounds';
  const timerPct = timeLimit > 0 ? (timeRemaining / timeLimit) * 100 : 0;
  const myId = myPlayer?.id;

  const timerColor = timeRemaining > 15
    ? 'bg-success'
    : timeRemaining > 8
    ? 'bg-warning'
    : 'bg-error';

  // Pick who sits around the table: top scorers, with "you" always guaranteed a seat.
  const everyone = room?.players ?? [];
  const ranked = [...everyone].sort((a, b) => b.score - a.score);
  let ring = ranked.slice(0, RING_MAX);
  if (myId && !ring.some(p => p.id === myId)) {
    const me = everyone.find(p => p.id === myId);
    if (me) ring = [...ranked.slice(0, RING_MAX - 1), me];
  }
  const overflow = everyone.length - ring.length;

  return (
    <div className={clsx('flex min-h-screen flex-col', spectating && 'pb-16')}>
      {/* Soft warm wash behind everything */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="mesh absolute inset-0 opacity-70" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b-2 border-hairline bg-canvas-soft/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6">
          <span className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">
            Filmi<span className="text-gradient">Guess</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="badge font-mono">
              Round <span className="text-ink">{roundNumber}</span>/{totalRounds}
            </span>
            {myPlayer && (
              <div className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 shadow-card">
                <span className="font-display font-bold text-on-primary">{myPlayer.score}</span>
                <span className="text-xs font-bold text-on-primary/70">pts</span>
              </div>
            )}
            <ThemeToggle />
            <button
              onClick={leaveRoom}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-error transition-colors hover:bg-error-soft"
              title="Leave game"
            >
              Leave
            </button>
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1.5 bg-hairline/60">
          <div
            className={clsx('h-full transition-all duration-1000 ease-linear', timerColor)}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-page flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Main game area — the ring "table" */}
        <div className="flex flex-1 flex-col items-center gap-5">
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            {/* Ring of players around the stage */}
            {ring.map((p, i) => {
              const winner = roundWinners.find(w => w.playerId === p.id);
              const isMe = p.id === myId;
              return (
                <div
                  key={p.id}
                  className="absolute z-10 flex w-[4.5rem] flex-col items-center"
                  style={ringStyle(i, ring.length)}
                >
                  <div
                    className={clsx(
                      'relative flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold text-white shadow-card transition-transform sm:h-14 sm:w-14',
                      winner && 'ring-4 ring-success',
                      isMe && !winner && 'ring-4 ring-primary',
                      p.disconnected && 'opacity-40 grayscale',
                    )}
                    style={{ backgroundColor: avatarColor(p.name) }}
                  >
                    {p.name[0].toUpperCase()}
                    {winner && (
                      <span className="absolute -right-1.5 -top-1.5 text-base drop-shadow">{medal(winner.position)}</span>
                    )}
                  </div>
                  <span className="mt-1 max-w-[4.5rem] truncate text-[11px] font-bold text-ink">
                    {isMe ? 'You' : p.name}
                  </span>
                  <span className="font-mono text-[11px] font-extrabold text-teal-deep">{p.score}</span>
                </div>
              );
            })}

            {/* Central stage — the image to guess */}
            <div className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl shadow-card-lg">
              {currentQuestion ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Guess who?"
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Category + difficulty */}
                  <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
                    <span className="rounded-pill bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                      {CATEGORY_LABELS[currentQuestion.category]}
                    </span>
                    <span className={clsx('rounded-pill px-2.5 py-1 text-[11px] font-bold capitalize backdrop-blur-sm', DIFFICULTY_COLORS[currentQuestion.difficulty])}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  {/* Countdown */}
                  <div className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 backdrop-blur-sm">
                    <span className={clsx('font-display text-xl font-bold', timeRemaining <= 5 ? 'animate-pulse text-error' : 'text-white')}>
                      {timeRemaining}
                    </span>
                  </div>
                  {/* Between-rounds reveal */}
                  {isBetweenRounds && lastRoundAnswer && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90 px-4 text-center backdrop-blur-sm">
                      <div>
                        <p className="eyebrow mb-1 text-white/50">The answer was</p>
                        <p className="display-md leading-tight text-gradient">{lastRoundAnswer}</p>
                      </div>
                      <div className="h-px w-10 bg-white/15" />
                      {roundWinners.length > 0 ? (
                        <div>
                          <p className="eyebrow mb-1 text-white/50">Fastest guess</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xl">🥇</span>
                            <span className="font-display font-bold text-white">{roundWinners[0].playerName}</span>
                            <span className="font-mono text-sm font-bold text-success">+{roundWinners[0].pointsEarned}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-white/40">Nobody guessed this round</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-canvas-soft-2 text-mute">
                  <div className="mb-2 text-4xl">🎬</div>
                  <p className="font-display text-sm font-semibold">Loading…</p>
                </div>
              )}
            </div>
          </div>

          {overflow > 0 && (
            <p className="-mt-1 text-xs font-bold text-mute">+{overflow} more {overflow === 1 ? 'player' : 'players'} in the scores →</p>
          )}

          {/* Hint */}
          {currentQuestion && !isBetweenRounds && (
            <div className="card flex w-full max-w-md items-start gap-2 px-4 py-3">
              <span className="text-warning-deep">💡</span>
              <p className="text-sm font-semibold text-body">{currentQuestion.hint}</p>
            </div>
          )}

          {/* Answer input — hidden for spectators */}
          {!isBetweenRounds && !spectating && (
            <div className="w-full max-w-md">
              <AnswerInput disabled={hasAnsweredThisRound} />
            </div>
          )}
        </div>

        {/* Sidebar — full scores + chat */}
        <div className="flex flex-col gap-4 lg:w-80">
          <PlayerList />
          <ChatPanel />
        </div>
      </div>

      {spectating && <JoinGameBanner />}
    </div>
  );
}
