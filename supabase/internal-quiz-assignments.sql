-- Standalone quiz assignments for manufacturer teams.

create table if not exists public.manufacturer_quiz_assignments (
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  is_required boolean not null default true,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (manufacturer_id, quiz_id)
);

alter table public.manufacturer_quiz_assignments enable row level security;

alter table public.quiz_attempts
  add column if not exists manufacturer_id uuid references public.manufacturers(id) on delete cascade;

alter table public.quiz_attempts alter column company_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'quiz_attempts_single_assignment_context'
      and conrelid = 'public.quiz_attempts'::regclass
  ) then
    alter table public.quiz_attempts
      add constraint quiz_attempts_single_assignment_context
      check (num_nonnulls(company_id, manufacturer_id) = 1) not valid;
  end if;
end
$$;

alter table public.quiz_attempts validate constraint quiz_attempts_single_assignment_context;

create index if not exists quiz_attempts_internal_lookup_idx
  on public.quiz_attempts (manufacturer_id, quiz_id, user_id, started_at desc)
  where manufacturer_id is not null;

create or replace function public.assign_quiz_to_internal_team(
  target_quiz_id uuid,
  required boolean default true,
  target_due_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
begin
  select p.active_manufacturer_id into mid
  from public.profiles p
  where p.id = (select auth.uid());

  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Training management access required';
  end if;

  if not exists (
    select 1 from public.quizzes q
    where q.id = target_quiz_id
      and q.manufacturer_id = mid
      and q.status = 'published'
  ) then
    raise exception 'Quiz must be published and belong to this manufacturer';
  end if;

  insert into public.manufacturer_quiz_assignments (
    manufacturer_id, quiz_id, is_required, due_at
  ) values (
    mid, target_quiz_id, coalesce(required, true), target_due_at
  )
  on conflict (manufacturer_id, quiz_id) do update
  set is_required = excluded.is_required,
      due_at = excluded.due_at;
end
$$;

create or replace function public.internal_assigned_quiz_ids()
returns table (quiz_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select a.quiz_id
  from public.profiles p
  join public.manufacturer_quiz_assignments a
    on a.manufacturer_id = p.active_manufacturer_id
  where p.id = (select auth.uid())
    and private.has_manufacturer_role(
      a.manufacturer_id,
      array['owner','admin','content_manager']::public.manufacturer_role[]
    )
$$;

create or replace function public.internal_team_quizzes()
returns table (
  quiz_id uuid,
  title text,
  description text,
  passing_score integer,
  is_required boolean,
  due_at timestamptz,
  attempt_status text,
  latest_score integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.id,
    q.title,
    q.description,
    q.passing_score,
    a.is_required,
    a.due_at,
    latest.status,
    latest.score
  from public.profiles p
  join public.manufacturer_members mm
    on mm.manufacturer_id = p.active_manufacturer_id
   and mm.user_id = (select auth.uid())
   and mm.status = 'active'
  join public.manufacturer_quiz_assignments a
    on a.manufacturer_id = mm.manufacturer_id
  join public.quizzes q
    on q.id = a.quiz_id
   and q.manufacturer_id = a.manufacturer_id
   and q.status = 'published'
  left join lateral (
    select qa.status, qa.score
    from public.quiz_attempts qa
    where qa.manufacturer_id = a.manufacturer_id
      and qa.quiz_id = a.quiz_id
      and qa.user_id = (select auth.uid())
    order by qa.started_at desc
    limit 1
  ) latest on true
  where p.id = (select auth.uid())
  order by a.created_at desc
$$;

create or replace function public.start_internal_quiz(target_quiz_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  mid uuid;
  attempt_id uuid;
  payload jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select p.active_manufacturer_id into mid
  from public.profiles p
  join public.manufacturer_members mm
    on mm.manufacturer_id = p.active_manufacturer_id
   and mm.user_id = current_user_id
   and mm.status = 'active'
  where p.id = current_user_id;

  if mid is null or not exists (
    select 1
    from public.manufacturer_quiz_assignments a
    join public.quizzes q
      on q.id = a.quiz_id
     and q.manufacturer_id = a.manufacturer_id
     and q.status = 'published'
    where a.manufacturer_id = mid
      and a.quiz_id = target_quiz_id
  ) then
    raise exception 'This quiz is not assigned to your internal team';
  end if;

  select qa.id into attempt_id
  from public.quiz_attempts qa
  where qa.manufacturer_id = mid
    and qa.quiz_id = target_quiz_id
    and qa.user_id = current_user_id
    and qa.status = 'in_progress'
  order by qa.started_at desc
  limit 1;

  if attempt_id is null then
    insert into public.quiz_attempts (manufacturer_id, quiz_id, user_id, status)
    values (mid, target_quiz_id, current_user_id, 'in_progress')
    returning id into attempt_id;
  end if;

  select jsonb_build_object(
    'attempt_id', attempt_id,
    'quiz_id', q.id,
    'manufacturer_id', mid,
    'title', q.title,
    'description', q.description,
    'passing_score', q.passing_score,
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', qq.id,
          'prompt', qq.prompt,
          'image_url', qq.image_url,
          'position', qq.position,
          'choices', coalesce((
            select jsonb_agg(
              jsonb_build_object('id', qc.id, 'label', qc.label, 'position', qc.position)
              order by qc.position
            )
            from public.quiz_choices qc
            where qc.question_id = qq.id
          ), '[]'::jsonb)
        ) order by qq.position
      )
      from public.quiz_questions qq
      where qq.quiz_id = q.id
    ), '[]'::jsonb)
  ) into payload
  from public.quizzes q
  where q.id = target_quiz_id;

  return payload;
end
$$;

revoke all on function public.assign_quiz_to_internal_team(uuid, boolean, timestamptz) from public;
revoke all on function public.internal_assigned_quiz_ids() from public;
revoke all on function public.internal_team_quizzes() from public;
revoke all on function public.start_internal_quiz(uuid) from public;
revoke all on function public.assign_quiz_to_internal_team(uuid, boolean, timestamptz) from anon;
revoke all on function public.internal_assigned_quiz_ids() from anon;
revoke all on function public.internal_team_quizzes() from anon;
revoke all on function public.start_internal_quiz(uuid) from anon;

revoke all on table public.manufacturer_quiz_assignments from anon, authenticated;

grant execute on function public.assign_quiz_to_internal_team(uuid, boolean, timestamptz) to authenticated;
grant execute on function public.internal_assigned_quiz_ids() to authenticated;
grant execute on function public.internal_team_quizzes() to authenticated;
grant execute on function public.start_internal_quiz(uuid) to authenticated;
