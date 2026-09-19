create or replace function public.update_platform_manufacturer_operations(
  target_manufacturer_id uuid,
  next_lifecycle_status text,
  next_service_tier text,
  next_onboarding_stage text,
  next_launch_date date default null,
  next_account_owner text default null,
  next_action text default null,
  next_follow_up_date date default null,
  next_support_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_owner() then
    raise exception 'Platform owner access required.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.manufacturers where id = target_manufacturer_id) then
    raise exception 'Manufacturer not found.';
  end if;

  insert into public.manufacturer_operations (
    manufacturer_id,
    lifecycle_status,
    service_tier,
    onboarding_stage,
    launch_date,
    account_owner,
    next_action,
    follow_up_date,
    support_notes,
    updated_by
  ) values (
    target_manufacturer_id,
    next_lifecycle_status,
    next_service_tier,
    next_onboarding_stage,
    next_launch_date,
    nullif(trim(next_account_owner), ''),
    nullif(trim(next_action), ''),
    next_follow_up_date,
    nullif(trim(next_support_notes), ''),
    (select auth.uid())
  )
  on conflict (manufacturer_id) do update set
    lifecycle_status = excluded.lifecycle_status,
    service_tier = excluded.service_tier,
    onboarding_stage = excluded.onboarding_stage,
    launch_date = excluded.launch_date,
    account_owner = excluded.account_owner,
    next_action = excluded.next_action,
    follow_up_date = excluded.follow_up_date,
    support_notes = excluded.support_notes,
    updated_at = now(),
    updated_by = excluded.updated_by;

  update public.manufacturers
  set status = case
    when next_lifecycle_status in ('trial', 'active') then 'active'
    else 'suspended'
  end
  where id = target_manufacturer_id;

  insert into public.platform_audit_log (actor_user_id, action, entity_type, entity_id, details)
  values (
    (select auth.uid()),
    'manufacturer_operations_updated',
    'manufacturer',
    target_manufacturer_id::text,
    jsonb_build_object(
      'lifecycle_status', next_lifecycle_status,
      'service_tier', next_service_tier,
      'onboarding_stage', next_onboarding_stage,
      'follow_up_date', next_follow_up_date
    )
  );
end
$$;

revoke all on function public.update_platform_manufacturer_operations(uuid,text,text,text,date,text,text,date,text) from public, anon;
grant execute on function public.update_platform_manufacturer_operations(uuid,text,text,text,date,text,text,date,text) to authenticated;
