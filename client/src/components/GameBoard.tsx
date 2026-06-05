'use client';
import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import { getSavedName } from '@/lib/playerName';
import AnswerInput from './AnswerInput';
import PlayerList from './PlayerList';
import ChatPanel from './ChatPanel';
import clsx from 'clsx';
import type { Player, QuestionPublic, RoomPublic } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  bollywood_actor: 'Bollywood Actor',
  hindi_movie: 'Hindi Movie',
  south_actor: 'South Indian Actor',
  classic_movie: 'Classic Movie',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
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
    getSocket().emit('room:rejoin', { code: room.code, playerName: savedName }, (err: string | null, data?: { room: RoomPublic; player: Player; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
      if (err || !data) return;
      store.setRoom(data.room);
      store.setMyPlayer(data.player);
      store.setSpectating(false);
      if (data.question && data.room.state === 'playing') {
        store.setQuestion(data.question, data.roundNumber, data.room.totalQuestions, data.timeLimit);
      }
    });
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-brand-dark/95 backdrop-blur border-t border-brand-border px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-gray-400">You&apos;re watching as <span className="text-white font-semibold">{savedName || '...'}</span></p>
      <button
        onClick={joinGame}
        className="bg-brand-orange hover:bg-orange-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
      >
        Join Game
      </button>
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
    ? 'bg-green-500'
    : timeRemaining > 8
    ? 'bg-yellow-500'
    : 'bg-red-500';

  return (
    <div className={clsx('min-h-screen flex flex-col', spectating && 'pb-16')}>
      {/* Top bar */}
      <header className="bg-brand-card border-b border-brand-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-black text-xl">
            <span className="text-brand-orange">Filmi</span>
            <span className="text-brand-gold">Guess</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Round <span className="text-white font-bold">{roundNumber}</span>/{totalRounds}
            </span>
            {myPlayer && (
              <div className="flex items-center gap-2 bg-brand-dark rounded-lg px-3 py-1.5">
                <span className="text-brand-gold font-bold">{myPlayer.score}</span>
                <span className="text-gray-500 text-xs">pts</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div className="h-1.5 bg-brand-dark">
        <div
          className={clsx('h-full transition-all duration-1000 ease-linear', timerColor)}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        {/* Main game area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Question image */}
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden relative">
            {currentQuestion ? (
              <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQuestion.imageUrl}
                  alt="Guess who?"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Category badge */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  <span className="text-xs bg-black/70 backdrop-blur rounded-full px-3 py-1 text-white">
                    {CATEGORY_LABELS[currentQuestion.category]}
                  </span>
                  <span className={clsx('text-xs rounded-full px-3 py-1 backdrop-blur', DIFFICULTY_COLORS[currentQuestion.difficulty])}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                {/* Timer overlay */}
                <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-black/70 backdrop-blur flex items-center justify-center z-10">
                  <span className={clsx('text-xl font-black', timeRemaining <= 5 ? 'text-red-400 animate-pulse' : 'text-white')}>
                    {timeRemaining}
                  </span>
                </div>
                {/* Between rounds overlay */}
                {isBetweenRounds && lastRoundAnswer && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 px-4 gap-4">
                    {/* Correct answer */}
                    <div className="text-center">
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">The answer was</p>
                      <p className="text-3xl font-black text-brand-gold leading-tight">{lastRoundAnswer}</p>
                    </div>

                    <div className="w-12 h-px bg-brand-border" />

                    {/* First guesser */}
                    {roundWinners.length > 0 ? (
                      <div className="text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">First to guess</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl">🥇</span>
                          <span className="text-white font-bold text-lg">{roundWinners[0].playerName}</span>
                          <span className="text-brand-orange font-bold text-sm">+{roundWinners[0].pointsEarned}</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">"{roundWinners[0].answer}"</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">First to guess</p>
                        <p className="text-gray-500 text-sm">Nobody guessed this round</p>
                      </div>
                    )}

                    <div className="w-12 h-px bg-brand-border" />

                    {/* Image submitted by */}
                    {currentQuestion && (
                      <div className="text-center">
                        <p className="text-gray-600 text-xs uppercase tracking-widest mb-0.5">Image submitted by</p>
                        <p className="text-gray-400 text-sm font-medium">{currentQuestion.submittedBy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center bg-brand-dark" style={{ paddingBottom: '75%', position: 'relative' }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <div className="text-4xl mb-2">🎬</div>
                  <p>Loading question...</p>
                </div>
              </div>
            )}
          </div>

          {/* Hint */}
          {currentQuestion && !isBetweenRounds && (
            <div className="bg-brand-card border border-brand-border rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-brand-gold">💡</span>
              <p className="text-gray-300 text-sm">{currentQuestion.hint}</p>
            </div>
          )}

          {/* Answer input — hidden for spectators */}
          {!isBetweenRounds && !spectating && (
            <AnswerInput disabled={hasAnsweredThisRound} />
          )}

          {/* Winners this round */}
          {roundWinners.length > 0 && (
            <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2">
              {roundWinners.map(w => (
                <div key={w.playerId} className="flex items-center gap-3 text-sm animate-slide-up">
                  <span className="text-lg">{w.position === 1 ? '🥇' : w.position === 2 ? '🥈' : '🥉'}</span>
                  <span className="font-medium">{w.playerName}</span>
                  <span className="text-gray-500">"{w.answer}"</span>
                  <span className="ml-auto text-brand-gold font-bold">+{w.pointsEarned}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 flex flex-col gap-4">
          <PlayerList />
          <ChatPanel />
        </div>
      </div>

      {spectating && <JoinGameBanner />}
    </div>
  );
}
