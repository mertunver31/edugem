-- Create lesson_notes table for persistent per-document user notes
create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null
);

-- Indexes
create index if not exists idx_lesson_notes_document on public.lesson_notes(document_id);
create index if not exists idx_lesson_notes_user on public.lesson_notes(user_id);
create index if not exists idx_lesson_notes_created_at on public.lesson_notes(created_at desc);

-- Enable RLS
alter table public.lesson_notes enable row level security;

-- Policies: users can see their own notes
create policy if not exists "Users can view own notes"
  on public.lesson_notes for select
  using (auth.uid() = user_id);

-- Users can insert their own notes
create policy if not exists "Users can insert own notes"
  on public.lesson_notes for insert
  with check (auth.uid() = user_id);

-- Users can update their own notes (optional)
create policy if not exists "Users can update own notes"
  on public.lesson_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own notes (optional)
create policy if not exists "Users can delete own notes"
  on public.lesson_notes for delete
  using (auth.uid() = user_id);
