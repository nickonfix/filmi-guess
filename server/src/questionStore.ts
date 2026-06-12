import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { questionBank } from './questionBank.js';
import type { Question, Category, Difficulty, ImageCrop } from './types.js';

/**
 * Question store: serves questions from Supabase when configured, with the
 * bundled bank as a fallback so the game always works (cold start, DB outage,
 * or simply no credentials set yet). Questions are cached in memory and
 * refreshed periodically — game rounds never wait on the database.
 */

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let cache: Question[] = questionBank;
let supabase: SupabaseClient | null = null;

interface QuestionRow {
  id: string;
  image_url: string;
  answer: string;
  aliases: string[] | null;
  category: Category;
  difficulty: Difficulty;
  hint: string | null;
  submitted_by: string | null;
  crop: ImageCrop | null;
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    imageUrl: row.image_url,
    answer: row.answer,
    aliases: row.aliases ?? [],
    category: row.category,
    difficulty: row.difficulty,
    hint: row.hint ?? '',
    submittedBy: row.submitted_by ?? 'FilmiGuess Team',
    crop: row.crop ?? undefined,
  };
}

export async function refreshQuestions(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, image_url, answer, aliases, category, difficulty, hint, submitted_by, crop')
      .eq('active', true);
    if (error) throw error;
    if (data && data.length > 0) {
      cache = (data as QuestionRow[]).map(rowToQuestion);
      console.log(`[questions] loaded ${cache.length} questions from Supabase`);
    } else {
      console.warn('[questions] Supabase returned no questions — keeping current set');
    }
  } catch (err) {
    console.error('[questions] Supabase refresh failed — keeping current set:', err);
  }
}

export function initQuestionStore(): void {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(`[questions] Supabase not configured — using bundled bank (${questionBank.length} questions)`);
    return;
  }
  supabase = createClient(url, key, { auth: { persistSession: false } });
  void refreshQuestions();
  setInterval(() => void refreshQuestions(), REFRESH_INTERVAL_MS).unref();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` questions matching the room's categories and difficulty.
 * A specific difficulty fills from exact matches first, then pads with the
 * rest so short pools never shrink the round count.
 */
export function getQuestions(
  categories: Category[],
  difficulty: Difficulty | 'mixed',
  count: number,
): Question[] {
  const inCategories = cache.filter(
    q => categories.length === 0 || categories.includes(q.category),
  );
  if (difficulty === 'mixed') {
    return shuffle(inCategories).slice(0, Math.min(count, inCategories.length));
  }
  const exact = shuffle(inCategories.filter(q => q.difficulty === difficulty));
  const rest = shuffle(inCategories.filter(q => q.difficulty !== difficulty));
  return [...exact, ...rest].slice(0, Math.min(count, inCategories.length));
}
