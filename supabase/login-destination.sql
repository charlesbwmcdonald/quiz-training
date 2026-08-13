create or replace function public.get_post_login_destination()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  active_slug text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if private.is_platform_owner() then
    return '/platform';
  end if;

  select m.slug into active_slug
  from public.profiles p
  join public.manufacturers m
    on m.id = p.active_manufacturer_id
   and m.status = 'active'
  where p.id = (select auth.uid())
  limit 1;

  if active_slug is not null then
    return '/m/' || active_slug || '/app';
  end if;

  return '/app';
end
$$;

revoke all on function public.get_post_login_destination() from public, anon;
grant execute on function public.get_post_login_destination() to authenticated;
