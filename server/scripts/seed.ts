/**
 * Seed/refresh the Supabase `questions` table from the bundled bank.
 *
 *   SUPABASE_URL=https://xyz.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   npx tsx scripts/seed.ts
 *
 * Upserts by id, so it's safe to re-run after editing questionBank.ts.
 * Rows added directly in Supabase (custom ids outside q1..qN) are untouched.
 */
import { questionBank } from '../src/questionBank.js';

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const rows = questionBank.map(q => ({
  id: q.id,
  image_url: q.imageUrl,
  answer: q.answer,
  aliases: q.aliases,
  category: q.category,
  difficulty: q.difficulty,
  hint: q.hint,
  submitted_by: q.submittedBy,
  crop: q.crop ?? null,
  active: true,
}));

const res = await fetch(`${url}/rest/v1/questions?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  console.error(`Seed failed (${res.status}):`, await res.text());
  process.exit(1);
}
console.log(`Seeded ${rows.length} questions into Supabase.`);
