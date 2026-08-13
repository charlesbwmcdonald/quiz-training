-- Run this file once in the Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, position)
);

create table if not exists public.quiz_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null,
  unique (question_id, position)
);

-- Upgrade tables created by an earlier version of the app. PostgreSQL's
-- "create table if not exists" does not add missing columns to existing tables.
alter table public.quizzes
  add column if not exists owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists description text,
  add column if not exists status text not null default 'draft',
  add column if not exists passing_score integer not null default 80,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.quiz_questions
  add column if not exists quiz_id uuid references public.quizzes(id) on delete cascade,
  add column if not exists prompt text,
  add column if not exists position integer,
  add column if not exists created_at timestamptz not null default now();

alter table public.quiz_choices
  add column if not exists question_id uuid references public.quiz_questions(id) on delete cascade,
  add column if not exists label text,
  add column if not exists is_correct boolean not null default false,
  add column if not exists position integer;

-- If this development project has only one account, preserve legacy quizzes by
-- assigning them to that account. With multiple accounts, ownership is left
-- unassigned rather than guessing and exposing data to the wrong person.
do $$
declare
  only_user_id uuid;
begin
  if (select count(*) from auth.users) = 1 then
    select id into only_user_id from auth.users limit 1;
    update public.quizzes set owner_id = only_user_id where owner_id is null;
  end if;
end
$$;

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_choices enable row level security;

drop policy if exists "Owners manage quizzes" on public.quizzes;
create policy "Owners manage quizzes" on public.quizzes for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Owners manage questions" on public.quiz_questions;
create policy "Owners manage questions" on public.quiz_questions for all to authenticated using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())) with check (exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid()));
drop policy if exists "Owners manage choices" on public.quiz_choices;
create policy "Owners manage choices" on public.quiz_choices for all to authenticated using (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = question_id and q.owner_id = auth.uid())) with check (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = question_id and q.owner_id = auth.uid()));

create or replace function public.create_quiz_with_questions(quiz_title text, quiz_description text, quiz_passing_score integer, quiz_status text, questions jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare new_quiz_id uuid; question_record jsonb; choice_record jsonb; new_question_id uuid; question_position integer := 0; choice_position integer;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  if quiz_status not in ('draft', 'published') then raise exception 'Invalid quiz status.'; end if;
  insert into quizzes (owner_id, title, description, passing_score, status) values (auth.uid(), quiz_title, quiz_description, quiz_passing_score, quiz_status) returning id into new_quiz_id;
  for question_record in select value from jsonb_array_elements(questions) loop
    insert into quiz_questions (quiz_id, prompt, position) values (new_quiz_id, question_record->>'prompt', question_position) returning id into new_question_id;
    choice_position := 0;
    for choice_record in select value from jsonb_array_elements(question_record->'choices') loop
      insert into quiz_choices (question_id, label, is_correct, position) values (new_question_id, choice_record->>'label', coalesce((choice_record->>'is_correct')::boolean, false), choice_position);
      choice_position := choice_position + 1;
    end loop;
    question_position := question_position + 1;
  end loop;
  return new_quiz_id;
end;
$$;

grant execute on function public.create_quiz_with_questions(text, text, integer, text, jsonb) to authenticated;
