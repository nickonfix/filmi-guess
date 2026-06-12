-- FilmiGuess question bank.
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.questions (
  id           text primary key,
  image_url    text not null,
  answer       text not null,
  aliases      text[] not null default '{}',
  category     text not null check (category in ('bollywood_actor', 'hindi_movie', 'south_actor', 'classic_movie')),
  difficulty   text not null check (difficulty in ('easy', 'medium', 'hard')),
  hint         text not null default '',
  submitted_by text not null default 'FilmiGuess Team',
  -- Percentages (0-100) of the image to keep, e.g. {"top": 10, "bottom": 70}.
  -- Used to cut printed titles off movie posters before serving.
  crop         jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Lock the table down: RLS on with no public policies means only the
-- service-role key (used by the game server) can read or write. Answers
-- must never be readable with the anon key.
alter table public.questions enable row level security;
