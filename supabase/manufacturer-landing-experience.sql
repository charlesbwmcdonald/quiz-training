alter table public.manufacturers
  add column if not exists landing_experience jsonb not null default '{"login":{"headline":"Welcome to your training center","description":"Sign in to continue your product training."},"announcements":[],"carousel":{"enabled":false,"autoplay":true,"product_ids":[]},"layout":"standard"}'::jsonb;

create or replace function public.get_public_landing_experience(manufacturer_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'settings', m.landing_experience,
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'tagline', p.tagline,
        'image', p.images->>0
      ) order by array_position(
        array(select jsonb_array_elements_text(coalesce(m.landing_experience->'carousel'->'product_ids', '[]'::jsonb)))::text[],
        p.id::text
      ))
      from public.products p
      where p.manufacturer_id = m.id
        and p.status = 'published'
        and p.id::text in (
          select jsonb_array_elements_text(coalesce(m.landing_experience->'carousel'->'product_ids', '[]'::jsonb))
        )
    ), '[]'::jsonb)
  )
  from public.manufacturers m
  where m.slug = manufacturer_slug and m.status = 'active'
  limit 1
$$;

revoke all on function public.get_public_landing_experience(text) from public;
grant execute on function public.get_public_landing_experience(text) to anon, authenticated;
