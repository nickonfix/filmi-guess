/**
 * Seed/refresh the Supabase `questions` table from the bundled bank.
 *
 *   SUPABASE_URL=https://xyz.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx scripts/seed.ts
 *
 * Upserts by id, so it's safe to re-run after editing questionBank.ts.
 * Rows added directly in Supabase (custom ids outside q1..qN) are untouched.
 */
import { createClient } from '@supabase/supabase-js';
import { questionBank } from '../src/questionBank.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

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

const { error } = await supabase.from('questions').upsert(rows, { onConflict: 'id' });
if (error) {
  console.error('Seed failed:', error);
  process.exit(1);
}
console.log(`Seeded ${rows.length} questions into Supabase.`);
