'use client';
import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import type { RoomPublic, Player, QuestionPublic } from '@/types';

export function useGameSocket() {
  useEffect(() => {
    const socket = connectSocket();
    let isFirstConnect = true;

    // Reconnect handler — re-enters the room if the socket drops and comes back
    socket.on('connect', () => {
      if (isFirstConnect) { isFirstConnect = false; return; }
      const { room, myPlayer, spectating } = useGameStore.getState();
      if (!room) return;

      if (spectating && !myPlayer) {
        // Spectator reconnect — re-watch without joining
        socket.emit('room:watch', { code: room.code }, (err: string | null, data?: { room: RoomPublic; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
          if (!data) return;
          const store = useGameStore.getState();
          store.setRoom(data.room);
          if (data.question && data.room.state === 'playing') {
            store.setQuestion(data.question, data.roundNumber, data.room.totalQuestions, data.timeLimit);
          }
        });
        return;
      }

      if (!myPlayer) return;
      socket.emit('room:rejoin', { code: room.code, playerName: myPlayer.name }, (err: string | null, data?: { room: RoomPublic; player: Player; question: QuestionPublic | null; roundNumber: number; timeLimit: number }) => {
        if (!data) return;
        const store = useGameStore.getState();
        store.setRoom(data.room);
        store.setMyPlayer(data.player);
        if (data.question && data.room.state === 'playing') {
          store.setQuestion(data.question, data.roundNumber, data.room.totalQuestions, data.timeLimit);
        }
      });
    });

    // All handlers use getState() to avoid stale closure on captured store reference
    socket.on('room:updated', room => {
      useGameStore.getState().setRoom(room);
    });

    socket.on('game:round_start', ({ question, roundNumber, totalRounds, timeLimit }) => {
      useGameStore.getState().setQuestion(question, roundNumber, totalRounds, timeLimit);
    });

    socket.on('game:timer', timeRemaining => {
      useGameStore.getState().setTimer(timeRemaining);
    });

    socket.on('game:correct_answer', winner => {
      const state = useGameStore.getState();
      state.addWinner(winner);
      const myPlayer = state.myPlayer;
      if (myPlayer && winner.playerId === myPlayer.id) {
        state.setMyPlayer({ ...myPlayer, score: myPlayer.score + winner.pointsEarned });
        state.markAnswered();
      }
    });

    socket.on('game:round_end', ({ answer, winners, scores }) => {
      useGameStore.getState().setRoundEnd(answer, winners, scores);
    });

    socket.on('game:finished', scores => {
      useGameStore.getState().setFinished(scores);
    });

    socket.on('chat:message', msg => {
      useGameStore.getState().addChat(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('room:updated');
      socket.off('game:round_start');
      socket.off('game:timer');
      socket.off('game:correct_answer');
      socket.off('game:round_end');
      socket.off('game:finished');
      socket.off('chat:message');
    };
  }, []);

  return useGameStore();
}
