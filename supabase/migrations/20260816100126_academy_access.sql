create or replace function public.academy_directory()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  result jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select u.email into current_email from auth.users u where u.id = current_user_id;

  with accessible as (
    select distinct m.id, m.name, m.slug, m.logo_url, m.primary_color, m.secondary_color,
      (p.active_manufacturer_id = m.id) as is_active,
      coalesce((select mm.role::text from public.manufacturer_members mm where mm.manufacturer_id=m.id and mm.user_id=current_user_id and mm.status='active' limit 1),'retailer') as access_type
    from public.manufacturers m
    left join public.profiles p on p.id=current_user_id
    where m.status='active' and (
      exists(select 1 from public.manufacturer_members mm where mm.manufacturer_id=m.id and mm.user_id=current_user_id and mm.status='active')
      or exists(select 1 from public.company_members cm join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=m.id and mc.status='active' where cm.user_id=current_user_id and cm.status='active')
    )
  ), pending as (
    select distinct on (pi.manufacturer_id) pi.id invitation_id, m.id, m.name, m.slug, m.logo_url, m.primary_color, m.secondary_color, pi.role, pi.expires_at
    from public.platform_invitations pi
    join public.manufacturers m on m.id=pi.manufacturer_id and m.status='active'
    where current_email is not null and lower(pi.email)=lower(current_email) and pi.status in ('pending','sent') and pi.expires_at>now() and pi.manufacturer_id is not null
      and not exists(select 1 from accessible a where a.id=pi.manufacturer_id)
    order by pi.manufacturer_id, pi.created_at desc
  )
  select jsonb_build_object(
    'academies',coalesce((select jsonb_agg(to_jsonb(a) order by a.name) from accessible a),'[]'::jsonb),
    'invitations',coalesce((select jsonb_agg(to_jsonb(i) order by i.name) from pending i),'[]'::jsonb)
  ) into result;
  return result;
end
$$;

revoke all on function public.academy_directory() from public, anon;
grant execute on function public.academy_directory() to authenticated;

create or replace function public.select_academy(target_manufacturer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare current_user_id uuid := (select auth.uid()); target_slug text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select m.slug into target_slug from public.manufacturers m
  where m.id=target_manufacturer_id and m.status='active' and (
    exists(select 1 from public.manufacturer_members mm where mm.manufacturer_id=m.id and mm.user_id=current_user_id and mm.status='active')
    or exists(select 1 from public.company_members cm join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=m.id and mc.status='active' where cm.user_id=current_user_id and cm.status='active')
  );
  if target_slug is null then raise exception 'Academy access required'; end if;
  insert into public.profiles(id,active_manufacturer_id,updated_at) values(current_user_id,target_manufacturer_id,now())
  on conflict(id) do update set active_manufacturer_id=excluded.active_manufacturer_id,updated_at=excluded.updated_at;
  return target_slug;
end
$$;

revoke all on function public.select_academy(uuid) from public, anon;
grant execute on function public.select_academy(uuid) to authenticated;

create or replace function public.get_post_login_destination()
returns text language plpgsql volatile security definer set search_path=''
as $$
declare current_user_id uuid := (select auth.uid()); active_slug text; academy_count integer; only_academy_id uuid; only_academy_slug text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if private.is_platform_owner() then return '/platform'; end if;

  select m.slug into active_slug from public.profiles p join public.manufacturers m on m.id=p.active_manufacturer_id and m.status='active'
  where p.id=current_user_id and (
    exists(select 1 from public.manufacturer_members mm where mm.manufacturer_id=m.id and mm.user_id=current_user_id and mm.status='active')
    or exists(select 1 from public.company_members cm join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=m.id and mc.status='active' where cm.user_id=current_user_id and cm.status='active')
  ) limit 1;
  if active_slug is not null then return '/m/'||active_slug||'/app'; end if;

  with accessible as (
    select distinct m.id,m.slug from public.manufacturers m where m.status='active' and (
      exists(select 1 from public.manufacturer_members mm where mm.manufacturer_id=m.id and mm.user_id=current_user_id and mm.status='active')
      or exists(select 1 from public.company_members cm join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=m.id and mc.status='active' where cm.user_id=current_user_id and cm.status='active')
    )
  ) select count(*),min(id),min(slug) into academy_count,only_academy_id,only_academy_slug from accessible;
  if academy_count=1 then
    insert into public.profiles(id,active_manufacturer_id,updated_at) values(current_user_id,only_academy_id,now())
    on conflict(id) do update set active_manufacturer_id=excluded.active_manufacturer_id,updated_at=excluded.updated_at;
    return '/m/'||only_academy_slug||'/app';
  end if;
  return '/academies';
end
$$;

revoke all on function public.get_post_login_destination() from public,anon;
grant execute on function public.get_post_login_destination() to authenticated;
