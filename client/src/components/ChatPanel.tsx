'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import clsx from 'clsx';

export default function ChatPanel() {
  const { chatMessages, myPlayer } = useGameStore();
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');

  // Keep the chat pinned to the latest message by scrolling the list itself —
  // never scrollIntoView, which would yank the whole page.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    getSocket().emit('chat:send', trimmed);
    setText('');
  }

  return (
    <div className="card flex h-72 flex-col p-4">
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
      <div className="mt-3 flex flex-shrink-0 gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          maxLength={200}
          placeholder="Say something…"
          className="input-field flex-1"
        />
        <button onClick={send} className="btn-primary-sm flex-shrink-0 px-3" aria-label="Send message">
          →
        </button>
      </div>
    </div>
  );
}
