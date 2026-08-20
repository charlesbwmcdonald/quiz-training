create or replace function public.get_active_manufacturer_brand()
returns table(
  id uuid, name text, slug text, logo_url text, primary_color text, secondary_color text,
  landing_headline text, landing_description text, hero_image_url text, hero_overlay integer,
  hero_alignment text, hero_height text, hero_cta_text text, promo_enabled boolean,
  promo_text text, promo_link_url text, promo_link_text text, banner_image_url text,
  banner_link_url text, custom_html text, can_manage_brand boolean,
  can_manage_training boolean, can_view_reports boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id,m.name,m.slug,m.logo_url,m.primary_color,m.secondary_color,
    m.landing_headline,m.landing_description,m.hero_image_url,m.hero_overlay,
    m.hero_alignment,m.hero_height,m.hero_cta_text,m.promo_enabled,m.promo_text,
    m.promo_link_url,m.promo_link_text,m.banner_image_url,m.banner_link_url,m.custom_html,
    private.has_manufacturer_role(m.id,array['owner','admin']::public.manufacturer_role[]),
    private.has_manufacturer_role(m.id,array['owner','admin','content_manager']::public.manufacturer_role[]),
    private.has_manufacturer_role(m.id,array['owner','admin','content_manager']::public.manufacturer_role[])
  from public.profiles p
  join public.manufacturers m on m.id=p.active_manufacturer_id and m.status='active'
  where p.id=(select auth.uid()) and (
    private.is_manufacturer_member(m.id)
    or exists(
      select 1 from public.company_members cm
      join public.manufacturer_companies mc on mc.company_id=cm.company_id
        and mc.manufacturer_id=m.id and mc.status='active'
      where cm.user_id=(select auth.uid()) and cm.status='active'
    )
  )
  limit 1
$$;

do $$
declare
  report_definition text;
  original_check text := 'if manufacturer_id is null or not private.is_manufacturer_member(manufacturer_id) then';
  restricted_check text := 'if manufacturer_id is null or not private.has_manufacturer_role(manufacturer_id,array[''owner'',''admin'',''content_manager'']::public.manufacturer_role[]) then';
begin
  select pg_get_functiondef(p.oid) into report_definition
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='manufacturer_training_report'
  limit 1;

  if report_definition is null or position(original_check in report_definition)=0 then
    raise exception 'manufacturer_training_report permission check was not found';
  end if;

  execute replace(report_definition,original_check,restricted_check);
end
$$;
