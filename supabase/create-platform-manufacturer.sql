create or replace function public.create_platform_manufacturer(
  manufacturer_name text,
  manufacturer_slug text,
  owner_email text default null,
  logo_url text default null,
  primary_color text default '#D90000',
  secondary_color text default '#000000'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_manufacturer_id uuid;
  new_invitation_id uuid;
  clean_name text := trim(manufacturer_name);
  clean_slug text := lower(trim(manufacturer_slug));
  clean_email text := lower(trim(owner_email));
begin
  if not private.is_platform_owner() then
    raise exception 'Platform owner access required.' using errcode = '42501';
  end if;

  if char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Manufacturer name must be between 2 and 120 characters.';
  end if;
  if clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'URL slug must use lowercase letters, numbers, and single hyphens.';
  end if;
  if primary_color !~ '^#[0-9A-Fa-f]{6}$' or secondary_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Brand colors must be six-digit hex colors.';
  end if;
  if nullif(clean_email, '') is not null and clean_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid owner email address.';
  end if;
  if exists (select 1 from public.manufacturers m where m.slug = clean_slug) then
    raise exception 'That manufacturer URL slug is already in use.';
  end if;

  insert into public.manufacturers (
    name, slug, logo_url, primary_color, secondary_color, status,
    landing_headline, landing_description
  ) values (
    clean_name,
    clean_slug,
    nullif(trim(logo_url), ''),
    upper(primary_color),
    upper(secondary_color),
    'active',
    'Know the product. Sell with confidence.',
    'Product training built for dealers, distributors, sales teams, and industry partners.'
  ) returning id into new_manufacturer_id;

  insert into public.manufacturer_members (manufacturer_id, user_id, role, status)
  values (new_manufacturer_id, (select auth.uid()), 'admin', 'active')
  on conflict (manufacturer_id, user_id) do update
  set role = 'admin', status = 'active';

  if nullif(clean_email, '') is not null then
    insert into public.platform_invitations (
      email, invitation_type, manufacturer_id, company_id, role, invited_by
    ) values (
      clean_email, 'manufacturer_owner', new_manufacturer_id, null, 'owner', (select auth.uid())
    ) returning id into new_invitation_id;
  end if;

  insert into public.platform_audit_log (actor_user_id, action, entity_type, entity_id, details)
  values (
    (select auth.uid()),
    'manufacturer_created',
    'manufacturer',
    new_manufacturer_id::text,
    jsonb_build_object('name', clean_name, 'slug', clean_slug, 'owner_email', nullif(clean_email, ''))
  );

  return jsonb_build_object(
    'manufacturer_id', new_manufacturer_id,
    'slug', clean_slug,
    'invitation_id', new_invitation_id
  );
end
$$;

revoke all on function public.create_platform_manufacturer(text,text,text,text,text,text) from public, anon;
grant execute on function public.create_platform_manufacturer(text,text,text,text,text,text) to authenticated;
