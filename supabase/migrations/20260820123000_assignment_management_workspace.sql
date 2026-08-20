create or replace function public.manufacturer_assignment_directory()
returns table (
  audience_type text, audience_id uuid, audience_name text,
  content_type text, content_id uuid, training_title text,
  is_required boolean, due_at timestamptz, created_at timestamptz,
  learner_count bigint, completed_count bigint
)
language sql stable security definer set search_path = ''
as $function$
  with ctx as (
    select p.active_manufacturer_id as manufacturer_id
    from public.profiles p
    where p.id=(select auth.uid())
      and p.active_manufacturer_id is not null
      and private.has_manufacturer_role(
        p.active_manufacturer_id,
        array['owner','admin','content_manager']::public.manufacturer_role[]
      )
  )
  select 'team'::text,mqa.manufacturer_id,m.name,'quiz'::text,q.id,q.title,
         mqa.is_required,mqa.due_at,mqa.created_at,
         (select count(*) from public.manufacturer_members mm
          where mm.manufacturer_id=mqa.manufacturer_id and mm.status='active'),
         (select count(*) from public.manufacturer_members mm
          where mm.manufacturer_id=mqa.manufacturer_id and mm.status='active'
            and exists (
              select 1 from public.quiz_attempts qa
              where qa.manufacturer_id=mqa.manufacturer_id and qa.quiz_id=q.id
                and qa.user_id=mm.user_id and qa.status='completed'
                and qa.score>=q.passing_score
            ))
  from ctx
  join public.manufacturer_quiz_assignments mqa on mqa.manufacturer_id=ctx.manufacturer_id
  join public.manufacturers m on m.id=mqa.manufacturer_id
  join public.quizzes q on q.id=mqa.quiz_id and q.manufacturer_id=ctx.manufacturer_id

  union all

  select 'team'::text,mca.manufacturer_id,m.name,'course'::text,c.id,c.title,
         mca.is_required,mca.due_at,mca.created_at,
         (select count(*) from public.manufacturer_members mm
          where mm.manufacturer_id=mca.manufacturer_id and mm.status='active'),
         (select count(*) from public.manufacturer_members mm
          where mm.manufacturer_id=mca.manufacturer_id and mm.status='active'
            and exists (
              select 1 from public.course_modules cm
              join public.course_blocks cb on cb.module_id=cm.id
              where cm.course_id=c.id and cb.required
            )
            and not exists (
              select 1 from public.course_modules cm
              join public.course_blocks cb on cb.module_id=cm.id
              where cm.course_id=c.id and cb.required
                and not exists (
                  select 1 from public.manufacturer_course_progress cp
                  where cp.manufacturer_id=mca.manufacturer_id and cp.course_id=c.id
                    and cp.block_id=cb.id and cp.user_id=mm.user_id
                )
            ))
  from ctx
  join public.manufacturer_course_assignments mca on mca.manufacturer_id=ctx.manufacturer_id
  join public.manufacturers m on m.id=mca.manufacturer_id
  join public.courses c on c.id=mca.course_id and c.manufacturer_id=ctx.manufacturer_id

  union all

  select 'retailer'::text,cqa.company_id,co.name,'quiz'::text,q.id,q.title,
         cqa.is_required,cqa.due_at,cqa.created_at,
         (select count(*) from public.company_members cm
          where cm.company_id=cqa.company_id and cm.status='active'),
         (select count(*) from public.company_members cm
          where cm.company_id=cqa.company_id and cm.status='active'
            and exists (
              select 1 from public.quiz_attempts qa
              where qa.company_id=cqa.company_id and qa.quiz_id=q.id
                and qa.user_id=cm.user_id and qa.status='completed'
                and qa.score>=q.passing_score
            ))
  from ctx
  join public.manufacturer_companies mc on mc.manufacturer_id=ctx.manufacturer_id and mc.status='active'
  join public.company_quiz_assignments cqa on cqa.company_id=mc.company_id
  join public.companies co on co.id=cqa.company_id
  join public.quizzes q on q.id=cqa.quiz_id and q.manufacturer_id=ctx.manufacturer_id

  union all

  select 'retailer'::text,cca.company_id,co.name,'course'::text,c.id,c.title,
         cca.is_required,cca.due_at,cca.created_at,
         (select count(*) from public.company_members cm
          where cm.company_id=cca.company_id and cm.status='active'),
         (select count(*) from public.company_members cm
          where cm.company_id=cca.company_id and cm.status='active'
            and exists (
              select 1 from public.course_modules mod
              join public.course_blocks cb on cb.module_id=mod.id
              where mod.course_id=c.id and cb.required
            )
            and not exists (
              select 1 from public.course_modules mod
              join public.course_blocks cb on cb.module_id=mod.id
              where mod.course_id=c.id and cb.required
                and not exists (
                  select 1 from public.course_block_progress cp
                  where cp.company_id=cca.company_id and cp.course_id=c.id
                    and cp.block_id=cb.id and cp.user_id=cm.user_id
                )
            ))
  from ctx
  join public.manufacturer_companies mc on mc.manufacturer_id=ctx.manufacturer_id and mc.status='active'
  join public.company_course_assignments cca on cca.company_id=mc.company_id
  join public.companies co on co.id=cca.company_id
  join public.courses c on c.id=cca.course_id and c.manufacturer_id=ctx.manufacturer_id
  order by created_at desc;
$function$;

create or replace function public.update_training_assignment(
  target_audience_type text, target_audience_id uuid,
  target_content_type text, target_content_id uuid,
  required boolean, target_due_at timestamptz default null
)
returns void
language plpgsql security definer set search_path = ''
as $function$
declare mid uuid;
begin
  select p.active_manufacturer_id into mid
  from public.profiles p where p.id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(
    mid,array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then raise exception 'Training management access required'; end if;
  if target_audience_type not in ('team','retailer')
     or target_content_type not in ('quiz','course')
  then raise exception 'Invalid assignment'; end if;

  if target_audience_type='team' then
    if target_content_type='quiz' then
      update public.manufacturer_quiz_assignments a
      set is_required=required,due_at=target_due_at
      from public.quizzes q
      where a.manufacturer_id=mid and a.quiz_id=target_content_id
        and q.id=a.quiz_id and q.manufacturer_id=mid;
    else
      update public.manufacturer_course_assignments a
      set is_required=required,due_at=target_due_at
      from public.courses c
      where a.manufacturer_id=mid and a.course_id=target_content_id
        and c.id=a.course_id and c.manufacturer_id=mid;
    end if;
  else
    if not exists (
      select 1 from public.manufacturer_companies mc
      where mc.manufacturer_id=mid and mc.company_id=target_audience_id
        and mc.status='active'
    ) then raise exception 'Retailer is not connected'; end if;
    if target_content_type='quiz' then
      update public.company_quiz_assignments a
      set is_required=required,due_at=target_due_at
      from public.quizzes q
      where a.company_id=target_audience_id and a.quiz_id=target_content_id
        and q.id=a.quiz_id and q.manufacturer_id=mid;
    else
      update public.company_course_assignments a
      set is_required=required,due_at=target_due_at
      from public.courses c
      where a.company_id=target_audience_id and a.course_id=target_content_id
        and c.id=a.course_id and c.manufacturer_id=mid;
    end if;
  end if;
  if not found then raise exception 'Assignment not found'; end if;
end;
$function$;

create or replace function public.remove_training_assignment(
  target_audience_type text, target_audience_id uuid,
  target_content_type text, target_content_id uuid
)
returns void
language plpgsql security definer set search_path = ''
as $function$
declare mid uuid;
begin
  select p.active_manufacturer_id into mid
  from public.profiles p where p.id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(
    mid,array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then raise exception 'Training management access required'; end if;
  if target_audience_type not in ('team','retailer')
     or target_content_type not in ('quiz','course')
  then raise exception 'Invalid assignment'; end if;

  if target_audience_type='team' then
    if target_content_type='quiz' then
      delete from public.manufacturer_quiz_assignments a
      using public.quizzes q
      where a.manufacturer_id=mid and a.quiz_id=target_content_id
        and q.id=a.quiz_id and q.manufacturer_id=mid;
    else
      delete from public.manufacturer_course_assignments a
      using public.courses c
      where a.manufacturer_id=mid and a.course_id=target_content_id
        and c.id=a.course_id and c.manufacturer_id=mid;
    end if;
  else
    if not exists (
      select 1 from public.manufacturer_companies mc
      where mc.manufacturer_id=mid and mc.company_id=target_audience_id
        and mc.status='active'
    ) then raise exception 'Retailer is not connected'; end if;
    if target_content_type='quiz' then
      delete from public.company_quiz_assignments a
      using public.quizzes q
      where a.company_id=target_audience_id and a.quiz_id=target_content_id
        and q.id=a.quiz_id and q.manufacturer_id=mid;
    else
      delete from public.company_course_assignments a
      using public.courses c
      where a.company_id=target_audience_id and a.course_id=target_content_id
        and c.id=a.course_id and c.manufacturer_id=mid;
    end if;
  end if;
  if not found then raise exception 'Assignment not found'; end if;
end;
$function$;

revoke all on function public.manufacturer_assignment_directory() from public;
revoke all on function public.update_training_assignment(text,uuid,text,uuid,boolean,timestamptz) from public;
revoke all on function public.remove_training_assignment(text,uuid,text,uuid) from public;
revoke execute on function public.manufacturer_assignment_directory() from anon;
revoke execute on function public.update_training_assignment(text,uuid,text,uuid,boolean,timestamptz) from anon;
revoke execute on function public.remove_training_assignment(text,uuid,text,uuid) from anon;
grant execute on function public.manufacturer_assignment_directory() to authenticated;
grant execute on function public.update_training_assignment(text,uuid,text,uuid,boolean,timestamptz) to authenticated;
grant execute on function public.remove_training_assignment(text,uuid,text,uuid) to authenticated;
