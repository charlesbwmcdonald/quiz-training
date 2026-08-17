create or replace function public.import_manufacturer_retailer(
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
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  active_manufacturer_id uuid;
  retailer_id uuid;
  result text;
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
  if active_manufacturer_id is null then raise exception 'Retailer management access required'; end if;

  select c.id into retailer_id
  from public.manufacturer_companies mc
  join public.companies c on c.id = mc.company_id
  where mc.manufacturer_id = active_manufacturer_id
    and mc.status = 'active'
    and lower(btrim(c.name)) = lower(btrim(retailer_name))
  order by mc.created_at
  limit 1;

  if retailer_id is null then
    insert into public.companies(name,address_line_1,address_line_2,city,state_region,postal_code,phone,website,contact_name,contact_email)
    values(btrim(retailer_name),nullif(btrim(retailer_address_line_1),''),nullif(btrim(retailer_address_line_2),''),nullif(btrim(retailer_city),''),nullif(btrim(retailer_state_region),''),nullif(btrim(retailer_postal_code),''),nullif(btrim(retailer_phone),''),nullif(btrim(retailer_website),''),nullif(btrim(retailer_contact_name),''),nullif(lower(btrim(retailer_contact_email)),'') )
    returning id into retailer_id;
    insert into public.manufacturer_companies(manufacturer_id,company_id,status) values(active_manufacturer_id,retailer_id,'active');
    result := 'created';
  else
    update public.companies set
      name=btrim(retailer_name),
      address_line_1=nullif(btrim(retailer_address_line_1),''),
      address_line_2=nullif(btrim(retailer_address_line_2),''),
      city=nullif(btrim(retailer_city),''),
      state_region=nullif(btrim(retailer_state_region),''),
      postal_code=nullif(btrim(retailer_postal_code),''),
      phone=nullif(btrim(retailer_phone),''),
      website=nullif(btrim(retailer_website),''),
      contact_name=nullif(btrim(retailer_contact_name),''),
      contact_email=nullif(lower(btrim(retailer_contact_email)),'')
    where id=retailer_id;
    result := 'updated';
  end if;
  return result;
end;
$$;

revoke all on function public.import_manufacturer_retailer(text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.import_manufacturer_retailer(text,text,text,text,text,text,text,text,text,text) to authenticated;
