create extension if not exists pg_cron;

create table public.content_schedules (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  content_type text not null check (content_type in ('product','quiz','course')),
  content_id uuid not null,
  action text not null check (action in ('publish','archive')),
  execute_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','completed','cancelled','failed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  error text
);

create unique index content_schedules_one_pending_action_idx on public.content_schedules(content_type,content_id,action) where status='pending';
create index content_schedules_due_idx on public.content_schedules(execute_at) where status='pending';
create index content_schedules_manufacturer_idx on public.content_schedules(manufacturer_id,created_at desc);
alter table public.content_schedules enable row level security;
revoke all on table public.content_schedules from public,anon,authenticated;

create or replace function private.content_identity(kind text,target_id uuid,out mid uuid,out current_status text)
language plpgsql stable security definer set search_path=''
as $$
begin
  if kind='product' then select manufacturer_id,status into mid,current_status from public.products where id=target_id;
  elsif kind='quiz' then select manufacturer_id,status into mid,current_status from public.quizzes where id=target_id;
  elsif kind='course' then select manufacturer_id,status into mid,current_status from public.courses where id=target_id;
  else raise exception 'Invalid content type.'; end if;
end
$$;

revoke all on function private.content_identity(text,uuid) from public,anon,authenticated;

create or replace function public.schedule_content_action(content_type text,target_content_id uuid,schedule_action text,scheduled_for timestamptz)
returns uuid language plpgsql security definer set search_path=''
as $$
declare mid uuid; current_status text; schedule_id uuid;
begin
  select i.mid,i.current_status into mid,current_status from private.content_identity(content_type,target_content_id) i;
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin']::public.manufacturer_role[]) then
    raise exception 'Owner or admin scheduling access required.' using errcode='42501';
  end if;
  if schedule_action not in ('publish','archive') then raise exception 'Invalid scheduled action.'; end if;
  if scheduled_for <= now() + interval '1 minute' then raise exception 'Choose a time at least one minute in the future.'; end if;
  if schedule_action='publish' and current_status<>'review' then raise exception 'Content must be in review before publication can be scheduled.'; end if;
  if schedule_action='archive' and current_status='archived' then raise exception 'Archived content cannot be scheduled again.'; end if;
  update public.content_schedules set status='cancelled',cancelled_at=now()
  where content_schedules.content_type=schedule_content_action.content_type and content_id=target_content_id and action=schedule_action and status='pending';
  insert into public.content_schedules(manufacturer_id,content_type,content_id,action,execute_at,created_by)
  values(mid,content_type,target_content_id,schedule_action,scheduled_for,(select auth.uid())) returning id into schedule_id;
  return schedule_id;
end
$$;

create or replace function public.cancel_content_schedule(target_schedule_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare mid uuid;
begin
  select manufacturer_id into mid from public.content_schedules where id=target_schedule_id and status='pending';
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin']::public.manufacturer_role[]) then
    raise exception 'Owner or admin scheduling access required.' using errcode='42501';
  end if;
  update public.content_schedules set status='cancelled',cancelled_at=now() where id=target_schedule_id;
end
$$;

create or replace function public.manufacturer_content_schedules()
returns table(schedule_id uuid,content_type text,content_id uuid,schedule_action text,execute_at timestamptz,schedule_status text,created_by_email text,created_at timestamptz,error text)
language plpgsql stable security definer set search_path=''
as $$
declare mid uuid;
begin
  select active_manufacturer_id into mid from public.profiles where id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager','viewer']::public.manufacturer_role[]) then
    raise exception 'Manufacturer access required.' using errcode='42501';
  end if;
  return query select s.id,s.content_type,s.content_id,s.action,s.execute_at,s.status,u.email::text,s.created_at,s.error
  from public.content_schedules s left join auth.users u on u.id=s.created_by
  where s.manufacturer_id=mid order by case when s.status='pending' then 0 else 1 end,s.execute_at desc;
end
$$;

create or replace function private.process_due_content_schedules()
returns integer language plpgsql security definer set search_path=''
as $$
declare job public.content_schedules%rowtype; processed integer:=0;
begin
  for job in select * from public.content_schedules where status='pending' and execute_at<=now() order by execute_at for update skip locked loop
    begin
      if job.content_type='product' then update public.products set status=case when job.action='publish' then 'published' else 'archived' end,updated_at=now() where id=job.content_id and manufacturer_id=job.manufacturer_id;
      elsif job.content_type='quiz' then update public.quizzes set status=case when job.action='publish' then 'published' else 'archived' end,is_published=job.action='publish',archived_at=case when job.action='archive' then now() else null end,updated_at=now() where id=job.content_id and manufacturer_id=job.manufacturer_id;
      else update public.courses set status=case when job.action='publish' then 'published' else 'archived' end,updated_at=now() where id=job.content_id and manufacturer_id=job.manufacturer_id; end if;
      if not found then raise exception 'Content no longer exists.'; end if;
      update public.content_schedules set status='completed',completed_at=now(),error=null where id=job.id;
      processed:=processed+1;
    exception when others then
      update public.content_schedules set status='failed',completed_at=now(),error=sqlerrm where id=job.id;
    end;
  end loop;
  return processed;
end
$$;

revoke all on function private.process_due_content_schedules() from public,anon,authenticated;
revoke all on function public.schedule_content_action(text,uuid,text,timestamptz) from public,anon;
grant execute on function public.schedule_content_action(text,uuid,text,timestamptz) to authenticated;
revoke all on function public.cancel_content_schedule(uuid) from public,anon;
grant execute on function public.cancel_content_schedule(uuid) to authenticated;
revoke all on function public.manufacturer_content_schedules() from public,anon;
grant execute on function public.manufacturer_content_schedules() to authenticated;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname='process-content-schedules';
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule('process-content-schedules','* * * * *','select private.process_due_content_schedules();');
end
$$;
