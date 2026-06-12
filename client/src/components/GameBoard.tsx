'use client';
import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import { leaveRoom } from '@/lib/leaveRoom';
import { getSavedName, getSavedToken, saveToken } from '@/lib/playerName';
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
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-hairline bg-canvas/90 px-4 py-3 backdrop-blur-md">
      <p className="text-sm text-body">Watching as <span className="font-semibold text-ink">{savedName || '…'}</span></p>
      <button onClick={joinGame} className="btn-primary-sm flex-shrink-0">Join game</button>
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

  const timerColor = timeRemaining > 15
    ? 'bg-success'
    : timeRemaining > 8
    ? 'bg-warning'
    : 'bg-error';

  return (
    <div className={clsx('flex min-h-screen flex-col bg-canvas-soft', spectating && 'pb-16')}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-canvas-soft/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-semibold tracking-[-0.02em] text-ink">
            Filmi<span className="text-gradient">Guess</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-mono text-sm text-mute">
              Round <span className="font-medium text-ink">{roundNumber}</span>/{totalRounds}
            </span>
            {myPlayer && (
              <div className="flex items-center gap-1.5 rounded-sm bg-canvas px-3 py-1.5 shadow-hairline">
                <span className="font-mono font-semibold text-ink">{myPlayer.score}</span>
                <span className="text-xs text-mute">pts</span>
              </div>
            )}
            <ThemeToggle />
            <button
              onClick={leaveRoom}
              className="rounded-sm px-2.5 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error-soft"
              title="Leave game"
            >
              Leave
            </button>
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1 bg-hairline">
          <div
            className={clsx('h-full transition-all duration-1000 ease-linear', timerColor)}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-page flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Main game area */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Question image */}
          <div className="card-md relative overflow-hidden">
            {currentQuestion ? (
              <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQuestion.imageUrl}
                  alt="Guess who?"
                  className="absolute inset-0 h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Category badge */}
                <div className="absolute left-3 top-3 z-10 flex gap-2">
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {CATEGORY_LABELS[currentQuestion.category]}
                  </span>
                  <span className={clsx('rounded-full px-3 py-1 text-xs font-medium capitalize backdrop-blur-sm', DIFFICULTY_COLORS[currentQuestion.difficulty])}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                {/* Timer overlay */}
                <div className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
                  <span className={clsx('font-mono text-xl font-semibold', timeRemaining <= 5 ? 'animate-pulse text-error' : 'text-white')}>
                    {timeRemaining}
                  </span>
                </div>
                {/* Between rounds overlay */}
                {isBetweenRounds && lastRoundAnswer && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/90 px-4 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="eyebrow mb-1 text-white/50">The answer was</p>
                      <p className="display-md leading-tight text-gradient-band text-gradient-animate">{lastRoundAnswer}</p>
                    </div>

                    <div className="h-px w-12 bg-white/15" />

                    {roundWinners.length > 0 ? (
                      <div className="text-center">
                        <p className="eyebrow mb-1 text-white/50">First to guess</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl">🥇</span>
                          <span className="text-lg font-semibold text-white">{roundWinners[0].playerName}</span>
                          <span className="font-mono text-sm font-medium text-success">+{roundWinners[0].pointsEarned}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">guessed it in {roundWinners[0].timeTaken}s</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="eyebrow mb-1 text-white/50">First to guess</p>
                        <p className="text-sm text-white/40">Nobody guessed this round</p>
                      </div>
                    )}

                    <div className="h-px w-12 bg-white/15" />

                    {currentQuestion && (
                      <div className="text-center">
                        <p className="eyebrow mb-0.5 text-white/40">Image submitted by</p>
                        <p className="text-sm font-medium text-white/70">{currentQuestion.submittedBy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex items-center justify-center bg-canvas-soft-2" style={{ paddingBottom: '75%' }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-mute">
                  <div className="mb-2 text-4xl">🎬</div>
                  <p className="font-mono text-sm">Loading question…</p>
                </div>
              </div>
            )}
          </div>

          {/* Hint */}
          {currentQuestion && !isBetweenRounds && (
            <div className="card flex items-start gap-2 px-4 py-3">
              <span className="text-warning">💡</span>
              <p className="text-sm text-body">{currentQuestion.hint}</p>
            </div>
          )}

          {/* Answer input — hidden for spectators */}
          {!isBetweenRounds && !spectating && (
            <AnswerInput disabled={hasAnsweredThisRound} />
          )}

          {/* Winners this round — show only that they guessed + how fast, never the answer text */}
          {roundWinners.length > 0 && (
            <div className="card space-y-2 p-4">
              {roundWinners.map(w => (
                <div key={w.playerId} className="flex animate-slide-up items-center gap-3 text-sm">
                  <span className="text-lg">{w.position === 1 ? '🥇' : w.position === 2 ? '🥈' : '🥉'}</span>
                  <span className="font-medium text-ink">{w.playerName}</span>
                  <span className="text-mute">guessed it in {w.timeTaken}s</span>
                  <span className="ml-auto font-mono font-semibold text-success-deep">+{w.pointsEarned}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:w-72">
          <PlayerList />
          <ChatPanel />
        </div>
      </div>

      {spectating && <JoinGameBanner />}
    </div>
  );
}
