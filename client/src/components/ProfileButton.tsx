'use client';
import { useRef, useState } from 'react';
import { fileToAvatarDataUrl, uploadAvatar } from '@/lib/avatar';
import { saveAvatar } from '@/lib/playerName';
import Avatar from './Avatar';

interface Props {
  name: string;
  avatar: string;
  onChange: (url: string) => void;
  /** Avatar pixel size. */
  size?: number;
}

/**
 * Profile-picture control for the landing nav: click the avatar to upload a
 * photo (resized + hosted), which is then reused as the player's avatar in
 * every room. Hover reveals a small camera badge; a menu offers Remove.
 */
export default function ProfileButton({ name, avatar, onChange, size = 32 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const url = await uploadAvatar(dataUrl);
      saveAvatar(url);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function remove(e: React.MouseEvent) {
    e.stopPropagation();
    saveAvatar('');
    onChange('');
  }

  return (
    <div className="relative">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        title={avatar ? 'Change profile picture' : 'Add a profile picture'}
        aria-label="Profile picture"
        style={{ width: size, height: size }}
        className="group relative flex items-center justify-center rounded-full transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <Avatar name={name || '?'} avatar={avatar} size={size} />
        {/* Camera badge */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-on-primary shadow-btn-primary ring-2 ring-canvas-soft">
          {busy ? '…' : '✎'}
        </span>
      </button>
      {avatar && !busy && (
        <button
          onClick={remove}
          title="Remove profile picture"
          aria-label="Remove profile picture"
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-canvas text-[10px] text-mute shadow-hairline transition-colors hover:text-error"
        >
          ✕
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && (
        <span className="absolute right-0 top-10 z-50 whitespace-nowrap rounded-sm bg-error-soft px-2 py-1 text-xs text-error-deep shadow-hairline">
          {error}
        </span>
      )}
    </div>
  );
}
