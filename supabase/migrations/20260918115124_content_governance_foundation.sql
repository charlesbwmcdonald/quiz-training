alter table public.products drop constraint products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('draft', 'review', 'published', 'archived'));
alter table public.quizzes drop constraint quizzes_status_check;
alter table public.quizzes add constraint quizzes_status_check
  check (status in ('draft', 'review', 'published', 'archived'));
alter table public.courses drop constraint courses_status_check;
alter table public.courses add constraint courses_status_check
  check (status in ('draft', 'review', 'published', 'archived'));

alter table public.products
  add column content_owner_id uuid references auth.users(id) on delete set null,
  add column review_requested_at timestamptz,
  add column published_at timestamptz;
alter table public.quizzes
  add column content_owner_id uuid references auth.users(id) on delete set null,
  add column review_requested_at timestamptz,
  add column published_at timestamptz;
alter table public.courses
  add column content_owner_id uuid references auth.users(id) on delete set null,
  add column review_requested_at timestamptz,
  add column published_at timestamptz;

update public.products set published_at = updated_at where status = 'published';
update public.quizzes set published_at = updated_at where status = 'published';
update public.courses set published_at = updated_at where status = 'published';

create index products_content_owner_idx on public.products(content_owner_id) where content_owner_id is not null;
create index quizzes_content_owner_idx on public.quizzes(content_owner_id) where content_owner_id is not null;
create index courses_content_owner_idx on public.courses(content_owner_id) where content_owner_id is not null;

create or replace function private.apply_content_governance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.content_owner_id := coalesce(new.content_owner_id, (select auth.uid()));
  if new.status = 'review' and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status is distinct from 'review')) then
    new.review_requested_at := now();
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status is distinct from 'published')) then
    new.published_at := now();
  end if;
  return new;
end
$$;

create trigger products_content_governance before insert or update on public.products
for each row execute function private.apply_content_governance();
create trigger quizzes_content_governance before insert or update on public.quizzes
for each row execute function private.apply_content_governance();
create trigger courses_content_governance before insert or update on public.courses
for each row execute function private.apply_content_governance();

revoke all on function private.apply_content_governance() from public, anon, authenticated;

create or replace function public.set_content_workflow_status(
  content_type text,
  target_content_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
begin
  if content_type not in ('product', 'quiz', 'course') or next_status not in ('draft', 'review', 'published', 'archived') then
    raise exception 'Invalid content workflow update.';
  end if;

  if content_type = 'product' then
    select manufacturer_id into mid from public.products where id = target_content_id;
  elsif content_type = 'quiz' then
    select manufacturer_id into mid from public.quizzes where id = target_content_id;
  else
    select manufacturer_id into mid from public.courses where id = target_content_id;
  end if;

  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Content management access required.' using errcode = '42501';
  end if;

  if content_type = 'product' then
    update public.products set status = next_status, updated_at = now() where id = target_content_id;
  elsif content_type = 'quiz' then
    update public.quizzes
    set status = next_status,
        is_published = next_status = 'published',
        archived_at = case when next_status = 'archived' then now() else null end,
        updated_at = now()
    where id = target_content_id;
  else
    update public.courses set status = next_status, updated_at = now() where id = target_content_id;
  end if;
end
$$;

create or replace function public.manufacturer_content_governance()
returns table (
  content_type text,
  content_id uuid,
  owner_email text,
  updated_at timestamptz,
  review_requested_at timestamptz,
  published_at timestamptz,
  assignment_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  mid uuid;
begin
  select active_manufacturer_id into mid from public.profiles where id = (select auth.uid());
  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager','viewer']::public.manufacturer_role[]
  ) then
    raise exception 'Manufacturer access required.' using errcode = '42501';
  end if;

  return query
  select 'product'::text, p.id, u.email::text, p.updated_at, p.review_requested_at, p.published_at,
    (select count(*) from public.course_blocks b where b.content ->> 'product_id' = p.id::text)::bigint
  from public.products p
  left join auth.users u on u.id = p.content_owner_id
  where p.manufacturer_id = mid
  union all
  select 'quiz'::text, q.id, u.email::text, q.updated_at, q.review_requested_at, q.published_at,
    ((select count(*) from public.company_quiz_assignments a where a.quiz_id = q.id)
      + (select count(*) from public.manufacturer_quiz_assignments a where a.quiz_id = q.id)
      + (select count(*) from public.course_blocks b where b.quiz_id = q.id))::bigint
  from public.quizzes q
  left join auth.users u on u.id = q.content_owner_id
  where q.manufacturer_id = mid
  union all
  select 'course'::text, c.id, u.email::text, c.updated_at, c.review_requested_at, c.published_at,
    ((select count(*) from public.company_course_assignments a where a.course_id = c.id)
      + (select count(*) from public.manufacturer_course_assignments a where a.course_id = c.id))::bigint
  from public.courses c
  left join auth.users u on u.id = c.content_owner_id
  where c.manufacturer_id = mid;
end
$$;

revoke all on function public.set_content_workflow_status(text,uuid,text) from public, anon;
grant execute on function public.set_content_workflow_status(text,uuid,text) to authenticated;
revoke all on function public.manufacturer_content_governance() from public, anon;
grant execute on function public.manufacturer_content_governance() to authenticated;
