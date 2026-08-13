create or replace function public.select_platform_manufacturer(target_manufacturer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_slug text;
begin
  if not private.is_platform_owner() then
    raise exception 'Platform owner access required';
  end if;

  if not exists (
    select 1
    from public.manufacturer_members mm
    where mm.manufacturer_id = target_manufacturer_id
      and mm.user_id = (select auth.uid())
      and mm.status = 'active'
  ) then
    raise exception 'You need an active manufacturer membership to open this dashboard';
  end if;

  select m.slug into target_slug
  from public.manufacturers m
  where m.id = target_manufacturer_id
    and m.status = 'active';

  if target_slug is null then
    raise exception 'Manufacturer not found or inactive';
  end if;

  update public.profiles
  set active_manufacturer_id = target_manufacturer_id,
      updated_at = now()
  where id = (select auth.uid());

  if not found then
    insert into public.profiles (id, active_manufacturer_id)
    values ((select auth.uid()), target_manufacturer_id);
  end if;

  return target_slug;
end
$$;

revoke all on function public.select_platform_manufacturer(uuid) from public, anon;
grant execute on function public.select_platform_manufacturer(uuid) to authenticated;
