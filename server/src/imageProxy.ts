import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import type { Request, Response } from 'express';
import type { Question } from './types.js';

/**
 * Image proxy with opaque per-round tokens.
 *
 * The question bank uses Wikipedia images whose filenames literally contain
 * the answer ("Indian_actor_Amitabh_Bachchan.jpg"), so the original URL must
 * never reach the client — anyone could read it in the network tab. Instead,
 * each round registers its image here and clients get `/img/<random-token>`.
 * The proxy streams the bytes through the server and, when the question has
 * crop metadata (movie posters with the title printed on them), cuts the
 * title region off with sharp before serving.
 */

const TOKEN_TTL_MS = 30 * 60 * 1000;

interface Entry {
  url: string;
  crop?: Question['crop'];
  expiresAt: number;
  /** Processed bytes, cached so 50 players in a room hit upstream only once. */
  data?: { buf: Buffer; type: string };
}

const entries = new Map<string, Entry>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [token, entry] of entries) {
    if (entry.expiresAt < now) entries.delete(token);
  }
}

/** Register the current round's image and get the opaque token for it. */
export function registerRoundImage(question: Question): string {
  sweepExpired();
  const token = randomBytes(12).toString('base64url');
  entries.set(token, {
    url: question.imageUrl,
    crop: question.crop,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

export async function serveImage(req: Request, res: Response): Promise<void> {
  const entry = entries.get(req.params.token);
  if (!entry || entry.expiresAt < Date.now()) {
    res.status(404).end();
    return;
  }

  try {
    if (!entry.data) {
      // Wikimedia requires a descriptive User-Agent and may 403 generic ones.
      const upstream = await fetch(entry.url, {
        headers: { 'User-Agent': 'FilmiGuess/1.0 (https://filmi-guess.pages.dev; game image proxy)' },
      });
      if (!upstream.ok) {
        res.status(502).end();
        return;
      }
      let buf: Buffer = Buffer.from(await upstream.arrayBuffer());
      let type = upstream.headers.get('content-type') ?? 'image/jpeg';

      const c = entry.crop;
      if (c) {
        const img = sharp(buf);
        const meta = await img.metadata();
        if (meta.width && meta.height) {
          const left = Math.round((meta.width * (c.left ?? 0)) / 100);
          const top = Math.round((meta.height * (c.top ?? 0)) / 100);
          const width = Math.max(1, Math.round((meta.width * (c.right ?? 100)) / 100) - left);
          const height = Math.max(1, Math.round((meta.height * (c.bottom ?? 100)) / 100) - top);
          buf = await img.extract({ left, top, width, height }).jpeg({ quality: 85 }).toBuffer();
          type = 'image/jpeg';
        }
      }
      entry.data = { buf, type };
    }

    res.setHeader('Content-Type', entry.data.type);
    res.setHeader('Cache-Control', 'private, max-age=900');
    res.send(entry.data.buf);
  } catch (err) {
    console.error('[img] proxy error:', err);
    res.status(502).end();
  }
}
