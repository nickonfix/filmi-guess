'use client';
import { getServerUrl } from './socket';

/**
 * Turn a user-picked image file into a small, square JPEG data URL.
 * Center-crops to a square and downscales to 256px so uploads stay tiny
 * (~15–40KB) and broadcasts to the room are cheap.
 */
export function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported.')); return; }
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

/**
 * Upload a data URL to the server, which hosts it (Supabase Storage) and
 * returns a stable URL. Falls back to the inline data URL if the upload
 * fails, so the avatar still works either way.
 */
export async function uploadAvatar(dataUrl: string): Promise<string> {
  try {
    const res = await fetch(`${getServerUrl()}/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
    if (res.ok) {
      const json = (await res.json()) as { url?: string };
      if (json.url) return json.url;
    }
  } catch {
    /* fall through to inline */
  }
  return dataUrl;
}
