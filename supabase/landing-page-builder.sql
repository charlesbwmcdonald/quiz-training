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
        'image', p.images->0->>'url',
        'category_id', p.category_id,
        'category_name', c.name
      ) order by c.position nulls last, p.updated_at desc)
      from public.products p
      left join public.product_categories c on c.id = p.category_id
      where p.manufacturer_id = m.id and p.status = 'published'
    ), '[]'::jsonb)
  )
  from public.manufacturers m
  where m.slug = manufacturer_slug and m.status = 'active'
  limit 1
$$;

revoke all on function public.get_public_landing_experience(text) from public;
grant execute on function public.get_public_landing_experience(text) to anon, authenticated;
