'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import clsx from 'clsx';

export default function ChatPanel() {
  const { chatMessages, myPlayer } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col h-64">
      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3 flex-shrink-0">Chat</h3>
      <div className="flex-1 overflow-y-auto space-y-1 text-sm">
        {chatMessages.map((msg, i) => (
          <div key={i} className="animate-slide-up">
            <span className={clsx('font-medium', msg.playerId === myPlayer?.id ? 'text-brand-orange' : 'text-gray-300')}>
              {msg.playerName}:
            </span>{' '}
            <span className={clsx(msg.isCorrect ? 'text-green-400 font-medium' : 'text-gray-400')}>
              {msg.isCorrect ? `✓ ${msg.message}` : msg.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
