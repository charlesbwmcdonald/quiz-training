create or replace function public.update_course_with_blocks(
  target_course_id uuid,
  course_title text,
  course_description text,
  course_status text,
  blocks jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  mid uuid;
  target_module_id uuid;
  item jsonb;
  pos integer := 0;
  qid uuid;
  pid uuid;
  requested_id uuid;
  retained_ids uuid[] := array[]::uuid[];
begin
  select c.manufacturer_id into mid
  from public.courses c
  where c.id = target_course_id;

  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Training management access required';
  end if;
  if trim(course_title) = '' then raise exception 'Add a course title'; end if;
  if course_status not in ('draft','published') then raise exception 'Invalid status'; end if;
  if jsonb_typeof(blocks) <> 'array' or jsonb_array_length(blocks) = 0 then
    raise exception 'Add at least one learning block';
  end if;

  select m.id into target_module_id
  from public.course_modules m
  where m.course_id = target_course_id
  order by m.position
  limit 1;
  if target_module_id is null then raise exception 'Course content could not be found'; end if;

  update public.courses
  set title = trim(course_title),
      description = nullif(trim(course_description), ''),
      status = course_status,
      updated_at = now()
  where id = target_course_id;

  update public.course_blocks b
  set position = b.position + 100000
  where b.module_id = target_module_id;

  for item in select value from jsonb_array_elements(blocks) loop
    if item->>'type' not in ('rich_text','product_card','video','quiz') then
      raise exception 'Invalid block type';
    end if;

    qid := nullif(item->>'quizId', '')::uuid;
    pid := nullif(item->'content'->>'product_id', '')::uuid;
    if qid is not null and not exists(
      select 1 from public.quizzes q
      where q.id = qid and q.manufacturer_id = mid and q.status = 'published'
    ) then raise exception 'Attached quiz must be published'; end if;
    if pid is not null and not exists(
      select 1 from public.products p
      where p.id = pid and p.manufacturer_id = mid and p.status = 'published'
    ) then raise exception 'Attached product must be published'; end if;

    requested_id := null;
    if coalesce(item->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      requested_id := (item->>'id')::uuid;
    end if;

    if requested_id is not null and exists(
      select 1 from public.course_blocks b
      where b.id = requested_id and b.module_id = target_module_id
    ) then
      update public.course_blocks b
      set block_type = item->>'type',
          title = nullif(trim(item->>'title'), ''),
          content = coalesce(item->'content', '{}'::jsonb),
          quiz_id = qid,
          position = pos,
          required = coalesce((item->>'required')::boolean, true)
      where b.id = requested_id;
      retained_ids := array_append(retained_ids, requested_id);
    else
      insert into public.course_blocks(module_id, block_type, title, content, quiz_id, position, required)
      values (
        target_module_id,
        item->>'type',
        nullif(trim(item->>'title'), ''),
        coalesce(item->'content', '{}'::jsonb),
        qid,
        pos,
        coalesce((item->>'required')::boolean, true)
      )
      returning id into requested_id;
      retained_ids := array_append(retained_ids, requested_id);
    end if;
    pos := pos + 1;
  end loop;

  delete from public.course_blocks b
  where b.module_id = target_module_id and not (b.id = any(retained_ids));
end;
$function$;

revoke all on function public.update_course_with_blocks(uuid, text, text, text, jsonb) from public;
revoke execute on function public.update_course_with_blocks(uuid, text, text, text, jsonb) from anon;
grant execute on function public.update_course_with_blocks(uuid, text, text, text, jsonb) to authenticated;
