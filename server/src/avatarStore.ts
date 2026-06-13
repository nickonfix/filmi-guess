import { randomBytes } from 'node:crypto';

/**
 * Profile-picture storage. Clients send a small (resized) JPEG/PNG/WebP data
 * URL; we push it to a public Supabase Storage bucket and hand back a stable
 * public URL (cheap to broadcast, browser-cacheable). When Supabase isn't
 * configured we simply echo the data URL back so the feature still works
 * inline in local dev — no separate code path on the client.
 */

const BUCKET = 'avatars';
const MAX_BYTES = 1_500_000; // ~1.5MB hard cap on the decoded image

let config: { url: string; key: string } | null = null;

export function initAvatarStore(): void {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('[avatar] Supabase not configured — avatars stored inline as data URLs');
    return;
  }
  config = { url: url.replace(/\/$/, ''), key };
  void ensureBucket();
}

async function ensureBucket(): Promise<void> {
  if (!config) return;
  try {
    const res = await fetch(`${config.url}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: MAX_BYTES,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    });
    if (res.ok) {
      console.log(`[avatar] created public '${BUCKET}' bucket`);
    } else {
      const text = await res.text();
      // "already exists" is the normal steady-state response — not an error.
      if (!text.toLowerCase().includes('already exists')) {
        console.warn(`[avatar] bucket ensure returned ${res.status}: ${text}`);
      }
    }
  } catch (err) {
    console.error('[avatar] bucket ensure failed:', err);
  }
}

/** Store an avatar from a data URL and return a URL the client can use. */
export async function storeAvatar(dataUrl: string): Promise<string> {
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('not a supported image data URL');
  const mime = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const buf = Buffer.from(match[3], 'base64');
  if (buf.length === 0 || buf.length > MAX_BYTES) throw new Error('image too large');

  // No Supabase — keep the (already small) data URL inline.
  if (!config) return dataUrl;

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${randomBytes(12).toString('base64url')}.${ext}`;
  const res = await fetch(`${config.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`storage upload failed ${res.status}: ${await res.text()}`);
  return `${config.url}/storage/v1/object/public/${BUCKET}/${path}`;
}
