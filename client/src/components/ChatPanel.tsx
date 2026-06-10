'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import clsx from 'clsx';

export default function ChatPanel() {
  const { chatMessages, myPlayer } = useGameStore();
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the chat pinned to the latest message by scrolling the list itself —
  // never scrollIntoView, which would yank the whole page (and on mobile shoves
  // the game board out of view).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  return (
    <div className="card flex h-64 flex-col p-4">
      <h3 className="eyebrow mb-3 flex-shrink-0">Chat</h3>
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto text-sm">
        {chatMessages.map((msg, i) => (
          <div key={i} className="animate-slide-up">
            <span className={clsx('font-medium', msg.playerId === myPlayer?.id ? 'text-link' : 'text-ink')}>
              {msg.playerName}:
            </span>{' '}
            <span className={clsx(msg.isCorrect ? 'font-medium text-success-deep' : 'text-body')}>
              {msg.isCorrect ? `✓ ${msg.message}` : msg.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
