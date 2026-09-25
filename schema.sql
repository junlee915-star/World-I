-- WORLD&I (BookWorld) — Neon Postgres schema
-- Run once against the Neon database (Neon SQL editor, or `psql "$DATABASE_URL" -f schema.sql`).

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  password_salt text not null,
  newsletter boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_user_id_idx on sessions(user_id);

-- One row per "나에게 묻는 질문" answer the reader saves. Append-only: a reader
-- can answer the same book_id/question_index more than once over time, which is
-- what powers the "그때의 나, 지금의 나" comparison in the journal.
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  book_id text not null,
  question_index int not null,
  answer_text text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists responses_user_id_idx on responses(user_id, created_at desc);
create index if not exists responses_public_idx on responses(is_public, created_at desc) where is_public;
