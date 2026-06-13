'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import clsx from 'clsx';

interface Props {
  /** Override the container classes (e.g. for the mobile bottom sheet). */
  className?: string;
  /** When provided, renders a close button in the header. */
  onClose?: () => void;
}

export default function ChatPanel({ className, onClose }: Props) {
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
    <div className={clsx('card flex flex-col p-4', !className && 'h-72', className)}>
      <div className="mb-3 flex flex-shrink-0 items-center justify-between">
        <h3 className="eyebrow">Chat</h3>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="rounded-md px-2 py-0.5 text-lg leading-none text-mute transition-colors hover:bg-canvas-soft hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto text-sm">
        {chatMessages.length === 0 ? (
          <p className="mt-2 text-xs text-mute">No messages yet — say hi! 👋</p>
        ) : (
          chatMessages.map((msg, i) =>
            msg.system ? (
              <div key={i} className="animate-slide-up py-0.5 text-center text-xs italic text-mute">
                {msg.message}
              </div>
            ) : (
              <div key={i} className="animate-slide-up">
                <span className={clsx('font-medium', msg.playerId === myPlayer?.id ? 'text-link' : 'text-ink')}>
                  {msg.playerName}:
                </span>{' '}
                <span className="text-body">{msg.message}</span>
              </div>
            ),
          )
        )}
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
