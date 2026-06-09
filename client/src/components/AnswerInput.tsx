'use client';
import { useState, useRef, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

interface Props {
  disabled: boolean;
}

export default function AnswerInput({ disabled }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    getSocket().emit('game:answer', trimmed);
    setValue('');
  }

  return (
    <div className="relative">
      {disabled ? (
        <div className="rounded-md bg-success-soft px-4 py-3 text-center font-medium text-success-deep shadow-hairline">
          ✓ Correct! Waiting for next round…
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            maxLength={100}
            placeholder="Type your answer and press Enter…"
            className="input-field-lg flex-1"
          />
          <button
            onClick={submit}
            className="btn-primary aspect-square h-12 rounded-md px-0 text-lg"
            aria-label="Submit answer"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
