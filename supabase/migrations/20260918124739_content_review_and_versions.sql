create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  content_type text not null check (content_type in ('product','quiz','course')),
  content_id uuid not null,
  version_number integer not null,
  status text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_type, content_id, version_number)
);

create index content_versions_lookup_idx on public.content_versions(content_type, content_id, version_number desc);
create index content_versions_manufacturer_idx on public.content_versions(manufacturer_id, created_at desc);
alter table public.content_versions enable row level security;
revoke all on table public.content_versions from public, anon, authenticated;

create table public.content_review_events (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  content_type text not null check (content_type in ('product','quiz','course')),
  content_id uuid not null,
  decision text not null check (decision in ('approved','changes_requested')),
  note text,
  reviewer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index content_review_events_lookup_idx on public.content_review_events(content_type, content_id, created_at desc);
create index content_review_events_manufacturer_idx on public.content_review_events(manufacturer_id, created_at desc);
alter table public.content_review_events enable row level security;
revoke all on table public.content_review_events from public, anon, authenticated;

create or replace function private.content_snapshot(kind text, target_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if kind = 'product' then
    select to_jsonb(p) into result from public.products p where p.id = target_id;
  elsif kind = 'quiz' then
    select to_jsonb(q) || jsonb_build_object('questions', coalesce((
      select jsonb_agg(to_jsonb(qq) || jsonb_build_object('choices', coalesce((
        select jsonb_agg(to_jsonb(qc) order by qc.position) from public.quiz_choices qc where qc.question_id = qq.id
      ), '[]'::jsonb)) order by qq.position)
      from public.quiz_questions qq where qq.quiz_id = q.id
    ), '[]'::jsonb)) into result
    from public.quizzes q where q.id = target_id;
  elsif kind = 'course' then
    select to_jsonb(c) || jsonb_build_object('modules', coalesce((
      select jsonb_agg(to_jsonb(cm) || jsonb_build_object('blocks', coalesce((
        select jsonb_agg(to_jsonb(cb) order by cb.position) from public.course_blocks cb where cb.module_id = cm.id
      ), '[]'::jsonb)) order by cm.position)
      from public.course_modules cm where cm.course_id = c.id
    ), '[]'::jsonb)) into result
    from public.courses c where c.id = target_id;
  end if;
  return result;
end
$$;

revoke all on function private.content_snapshot(text,uuid) from public, anon, authenticated;

create or replace function private.capture_content_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text := tg_argv[0];
  next_version integer;
  prior jsonb;
begin
  prior := private.content_snapshot(kind, old.id);
  if prior is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(kind || old.id::text, 0));
  select coalesce(max(version_number), 0) + 1 into next_version
  from public.content_versions where content_type = kind and content_id = old.id;
  insert into public.content_versions(manufacturer_id, content_type, content_id, version_number, status, snapshot, created_by)
  values (old.manufacturer_id, kind, old.id, next_version, old.status, prior, (select auth.uid()));
  return new;
end
$$;

drop trigger if exists products_capture_version on public.products;
create trigger products_capture_version before update on public.products
for each row execute function private.capture_content_version('product');
drop trigger if exists quizzes_capture_version on public.quizzes;
create trigger quizzes_capture_version before update on public.quizzes
for each row execute function private.capture_content_version('quiz');
drop trigger if exists courses_capture_version on public.courses;
create trigger courses_capture_version before update on public.courses
for each row execute function private.capture_content_version('course');

revoke all on function private.capture_content_version() from public, anon, authenticated;

create or replace function public.review_content(
  content_type text,
  target_content_id uuid,
  review_decision text,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare mid uuid; current_status text;
begin
  if content_type not in ('product','quiz','course') or review_decision not in ('approved','changes_requested') then
    raise exception 'Invalid review action.';
  end if;
  if review_decision = 'changes_requested' and nullif(trim(review_note), '') is null then
    raise exception 'Add a note explaining the requested changes.';
  end if;
  if content_type = 'product' then select manufacturer_id,status into mid,current_status from public.products where id=target_content_id;
  elsif content_type = 'quiz' then select manufacturer_id,status into mid,current_status from public.quizzes where id=target_content_id;
  else select manufacturer_id,status into mid,current_status from public.courses where id=target_content_id; end if;
  if mid is null or not private.has_manufacturer_role(mid, array['owner','admin']::public.manufacturer_role[]) then
    raise exception 'Owner or admin review access required.' using errcode='42501';
  end if;
  if current_status <> 'review' then raise exception 'Only content in review can be approved or returned.'; end if;

  insert into public.content_review_events(manufacturer_id,content_type,content_id,decision,note,reviewer_id)
  values(mid,content_type,target_content_id,review_decision,nullif(trim(review_note),''),(select auth.uid()));

  if review_decision = 'approved' then
    perform public.set_content_workflow_status(content_type,target_content_id,'published');
  else
    perform public.set_content_workflow_status(content_type,target_content_id,'draft');
  end if;
end
$$;

create or replace function public.content_version_history(content_type text, target_content_id uuid)
returns table(version_id uuid, version_number integer, version_status text, actor_email text, created_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
declare mid uuid;
begin
  if content_type='product' then select manufacturer_id into mid from public.products where id=target_content_id;
  elsif content_type='quiz' then select manufacturer_id into mid from public.quizzes where id=target_content_id;
  elsif content_type='course' then select manufacturer_id into mid from public.courses where id=target_content_id;
  else raise exception 'Invalid content type.'; end if;
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager','viewer']::public.manufacturer_role[]) then
    raise exception 'Manufacturer access required.' using errcode='42501';
  end if;
  return query select v.id,v.version_number,v.status,u.email::text,v.created_at
  from public.content_versions v left join auth.users u on u.id=v.created_by
  where v.content_type=content_version_history.content_type and v.content_id=target_content_id
  order by v.version_number desc limit 25;
end
$$;

create or replace function public.content_review_history(content_type text, target_content_id uuid)
returns table(decision text, note text, reviewer_email text, created_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
declare mid uuid;
begin
  if content_type='product' then select manufacturer_id into mid from public.products where id=target_content_id;
  elsif content_type='quiz' then select manufacturer_id into mid from public.quizzes where id=target_content_id;
  elsif content_type='course' then select manufacturer_id into mid from public.courses where id=target_content_id;
  else raise exception 'Invalid content type.'; end if;
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager','viewer']::public.manufacturer_role[]) then
    raise exception 'Manufacturer access required.' using errcode='42501';
  end if;
  return query select e.decision,e.note,u.email::text,e.created_at
  from public.content_review_events e left join auth.users u on u.id=e.reviewer_id
  where e.content_type=content_review_history.content_type and e.content_id=target_content_id
  order by e.created_at desc limit 25;
end
$$;

create or replace function public.restore_content_version(target_version_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v public.content_versions%rowtype;
  item jsonb;
  child jsonb;
begin
  select * into v from public.content_versions where id=target_version_id;
  if v.id is null or not private.has_manufacturer_role(v.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[]) then
    raise exception 'Content management access required.' using errcode='42501';
  end if;

  if v.content_type='product' then
    update public.products set
      category_id=(v.snapshot->>'category_id')::uuid,
      name=v.snapshot->>'name', slug=v.snapshot->>'slug', model_sku=v.snapshot->>'model_sku',
      tagline=v.snapshot->>'tagline', description=v.snapshot->>'description',
      images=coalesce(v.snapshot->'images','[]'::jsonb), features=coalesce(v.snapshot->'features','[]'::jsonb),
      specs=coalesce(v.snapshot->'specs','[]'::jsonb), compatibility=v.snapshot->>'compatibility',
      videos=coalesce(v.snapshot->'videos','[]'::jsonb), downloads=coalesce(v.snapshot->'downloads','[]'::jsonb),
      product_url=v.snapshot->>'product_url', parent_product_id=(v.snapshot->>'parent_product_id')::uuid,
      is_family=coalesce((v.snapshot->>'is_family')::boolean,false), variation_label=v.snapshot->>'variation_label',
      variation_options=coalesce(v.snapshot->'variation_options','{}'::jsonb), status='draft', updated_at=now()
    where id=v.content_id and manufacturer_id=v.manufacturer_id;
  elsif v.content_type='quiz' then
    if exists(select 1 from public.quiz_attempts where quiz_id=v.content_id) then
      raise exception 'Quiz versions cannot be restored after learner attempts exist. Duplicate the quiz instead.';
    end if;
    update public.quizzes set title=v.snapshot->>'title',description=v.snapshot->>'description',
      passing_score=(v.snapshot->>'passing_score')::integer,status='draft',is_published=false,archived_at=null,updated_at=now()
    where id=v.content_id and manufacturer_id=v.manufacturer_id;
    delete from public.quiz_questions where quiz_id=v.content_id;
    for item in select value from jsonb_array_elements(coalesce(v.snapshot->'questions','[]'::jsonb)) loop
      insert into public.quiz_questions(id,quiz_id,position,prompt,question_type,created_at,image_url)
      values((item->>'id')::uuid,v.content_id,(item->>'position')::integer,item->>'prompt',coalesce(item->>'question_type','single_choice'),coalesce((item->>'created_at')::timestamptz,now()),item->>'image_url');
      for child in select value from jsonb_array_elements(coalesce(item->'choices','[]'::jsonb)) loop
        insert into public.quiz_choices(id,question_id,position,label,is_correct)
        values((child->>'id')::uuid,(item->>'id')::uuid,(child->>'position')::integer,child->>'label',(child->>'is_correct')::boolean);
      end loop;
    end loop;
  elsif v.content_type='course' then
    if exists(select 1 from public.company_course_assignments where course_id=v.content_id)
      or exists(select 1 from public.manufacturer_course_assignments where course_id=v.content_id)
      or exists(select 1 from public.course_block_progress where course_id=v.content_id)
      or exists(select 1 from public.manufacturer_course_progress where course_id=v.content_id) then
      raise exception 'Course versions cannot be restored while assignments or learner progress exist. Duplicate the course instead.';
    end if;
    update public.courses set title=v.snapshot->>'title',description=v.snapshot->>'description',status='draft',updated_at=now()
    where id=v.content_id and manufacturer_id=v.manufacturer_id;
    delete from public.course_modules where course_id=v.content_id;
    for item in select value from jsonb_array_elements(coalesce(v.snapshot->'modules','[]'::jsonb)) loop
      insert into public.course_modules(id,course_id,title,position)
      values((item->>'id')::uuid,v.content_id,item->>'title',(item->>'position')::integer);
      for child in select value from jsonb_array_elements(coalesce(item->'blocks','[]'::jsonb)) loop
        insert into public.course_blocks(id,module_id,block_type,title,content,quiz_id,position,required)
        values((child->>'id')::uuid,(item->>'id')::uuid,child->>'block_type',child->>'title',coalesce(child->'content','{}'::jsonb),(child->>'quiz_id')::uuid,(child->>'position')::integer,coalesce((child->>'required')::boolean,true));
      end loop;
    end loop;
  end if;
end
$$;

revoke all on function public.review_content(text,uuid,text,text) from public, anon;
grant execute on function public.review_content(text,uuid,text,text) to authenticated;
revoke all on function public.content_version_history(text,uuid) from public, anon;
grant execute on function public.content_version_history(text,uuid) to authenticated;
revoke all on function public.content_review_history(text,uuid) from public, anon;
grant execute on function public.content_review_history(text,uuid) to authenticated;
revoke all on function public.restore_content_version(uuid) from public, anon;
grant execute on function public.restore_content_version(uuid) to authenticated;
