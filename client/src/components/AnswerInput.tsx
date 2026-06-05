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
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center text-green-400 font-medium">
          Correct! Waiting for next round...
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
            placeholder="Type your answer and press Enter..."
            className="flex-1 bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors text-lg"
          />
          <button
            onClick={submit}
            className="bg-brand-orange hover:bg-orange-500 text-white font-bold px-6 rounded-xl transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
