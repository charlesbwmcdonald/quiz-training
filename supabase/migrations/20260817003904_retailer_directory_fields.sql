alter table public.companies
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists state_region text,
  add column if not exists postal_code text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists contact_name text,
  add column if not exists contact_email text;

create or replace function public.manufacturer_retailer_profiles()
returns table (
  company_id uuid,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  phone text,
  website text,
  contact_name text,
  contact_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.address_line_1, c.address_line_2, c.city, c.state_region,
    c.postal_code, c.phone, c.website, c.contact_name, c.contact_email
  from public.profiles p
  join public.manufacturer_members mm
    on mm.manufacturer_id = p.active_manufacturer_id
    and mm.user_id = p.id
    and mm.status = 'active'
    and mm.role in ('owner', 'admin', 'content_manager')
  join public.manufacturer_companies mc
    on mc.manufacturer_id = p.active_manufacturer_id
    and mc.status = 'active'
  join public.companies c on c.id = mc.company_id
  where p.id = (select auth.uid())
  order by c.name;
$$;

create or replace function public.update_manufacturer_retailer(
  target_company_id uuid,
  retailer_name text,
  retailer_address_line_1 text default null,
  retailer_address_line_2 text default null,
  retailer_city text default null,
  retailer_state_region text default null,
  retailer_postal_code text default null,
  retailer_phone text default null,
  retailer_website text default null,
  retailer_contact_name text default null,
  retailer_contact_email text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  active_manufacturer_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(retailer_name), '') is null then raise exception 'Retailer name is required'; end if;

  select p.active_manufacturer_id into active_manufacturer_id
  from public.profiles p
  join public.manufacturer_members mm
    on mm.manufacturer_id = p.active_manufacturer_id
    and mm.user_id = current_user_id
    and mm.status = 'active'
    and mm.role in ('owner', 'admin', 'content_manager')
  where p.id = current_user_id;

  if active_manufacturer_id is null or not exists (
    select 1 from public.manufacturer_companies mc
    where mc.manufacturer_id = active_manufacturer_id
      and mc.company_id = target_company_id
      and mc.status = 'active'
  ) then raise exception 'Retailer management access required'; end if;

  update public.companies set
    name = btrim(retailer_name),
    address_line_1 = nullif(btrim(retailer_address_line_1), ''),
    address_line_2 = nullif(btrim(retailer_address_line_2), ''),
    city = nullif(btrim(retailer_city), ''),
    state_region = nullif(btrim(retailer_state_region), ''),
    postal_code = nullif(btrim(retailer_postal_code), ''),
    phone = nullif(btrim(retailer_phone), ''),
    website = nullif(btrim(retailer_website), ''),
    contact_name = nullif(btrim(retailer_contact_name), ''),
    contact_email = nullif(lower(btrim(retailer_contact_email)), '')
  where id = target_company_id;
end;
$$;

revoke all on function public.manufacturer_retailer_profiles() from public, anon;
grant execute on function public.manufacturer_retailer_profiles() to authenticated;
revoke all on function public.update_manufacturer_retailer(uuid,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.update_manufacturer_retailer(uuid,text,text,text,text,text,text,text,text,text,text) to authenticated;
