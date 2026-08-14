alter table public.products
  add column if not exists parent_product_id uuid,
  add column if not exists is_family boolean not null default false,
  add column if not exists variation_label text,
  add column if not exists variation_options jsonb not null default '{}'::jsonb;

alter table public.products
  add constraint products_id_manufacturer_unique unique (id, manufacturer_id),
  add constraint products_parent_manufacturer_fkey
    foreign key (parent_product_id, manufacturer_id)
    references public.products (id, manufacturer_id)
    on delete set null (parent_product_id),
  add constraint products_not_own_parent check (parent_product_id is null or parent_product_id <> id),
  add constraint products_child_not_family check (parent_product_id is null or is_family = false),
  add constraint products_variation_options_object check (jsonb_typeof(variation_options) = 'object');

create index products_parent_product_id_idx
  on public.products (parent_product_id)
  where parent_product_id is not null;

create index products_manufacturer_family_status_idx
  on public.products (manufacturer_id, is_family, status)
  where parent_product_id is null;

create or replace function public.save_manufacturer_product_v2(
  target_id uuid,
  product_name text,
  product_slug text,
  category_name text,
  model_sku text,
  tagline text,
  description text,
  images jsonb,
  features jsonb,
  specs jsonb,
  compatibility text,
  videos jsonb,
  downloads jsonb,
  product_url text,
  product_status text,
  product_is_family boolean default false,
  product_parent_id uuid default null,
  product_variation_label text default null,
  product_variation_options jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  mid uuid;
  cid uuid;
  pid uuid;
  parent_mid uuid;
  parent_is_family boolean;
begin
  select active_manufacturer_id into mid
  from public.profiles
  where id = (select auth.uid());

  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Product management access required';
  end if;

  if product_status not in ('draft','published','archived') then
    raise exception 'Invalid product status';
  end if;

  if jsonb_typeof(coalesce(product_variation_options, '{}'::jsonb)) <> 'object' then
    raise exception 'Variation options must be an object';
  end if;

  if product_parent_id is not null then
    select manufacturer_id, is_family
      into parent_mid, parent_is_family
    from public.products
    where id = product_parent_id;

    if parent_mid is distinct from mid or not coalesce(parent_is_family, false) then
      raise exception 'Choose a product family from the active manufacturer';
    end if;

    product_is_family := false;
  end if;

  if target_id is not null and target_id = product_parent_id then
    raise exception 'A product cannot be its own parent';
  end if;

  if nullif(trim(category_name), '') is not null then
    insert into public.product_categories (manufacturer_id, name, slug)
    values (
      mid,
      trim(category_name),
      regexp_replace(lower(trim(category_name)), '[^a-z0-9]+', '-', 'g')
    )
    on conflict (manufacturer_id, slug)
    do update set name = excluded.name
    returning id into cid;
  end if;

  if target_id is null then
    insert into public.products (
      manufacturer_id, category_id, name, slug, model_sku, tagline, description,
      images, features, specs, compatibility, videos, downloads, product_url, status,
      parent_product_id, is_family, variation_label, variation_options
    ) values (
      mid, cid, product_name, product_slug, nullif(model_sku, ''), nullif(tagline, ''),
      nullif(description, ''), coalesce(images, '[]'::jsonb), coalesce(features, '[]'::jsonb),
      coalesce(specs, '[]'::jsonb), nullif(compatibility, ''), coalesce(videos, '[]'::jsonb),
      coalesce(downloads, '[]'::jsonb), nullif(product_url, ''), product_status,
      product_parent_id, coalesce(product_is_family, false),
      nullif(trim(product_variation_label), ''), coalesce(product_variation_options, '{}'::jsonb)
    ) returning id into pid;
  else
    update public.products
    set category_id = cid,
        name = product_name,
        slug = product_slug,
        model_sku = nullif(model_sku, ''),
        tagline = nullif(tagline, ''),
        description = nullif(description, ''),
        images = coalesce(images, '[]'::jsonb),
        features = coalesce(features, '[]'::jsonb),
        specs = coalesce(specs, '[]'::jsonb),
        compatibility = nullif(compatibility, ''),
        videos = coalesce(videos, '[]'::jsonb),
        downloads = coalesce(downloads, '[]'::jsonb),
        product_url = nullif(product_url, ''),
        status = product_status,
        parent_product_id = product_parent_id,
        is_family = coalesce(product_is_family, false),
        variation_label = nullif(trim(product_variation_label), ''),
        variation_options = coalesce(product_variation_options, '{}'::jsonb),
        updated_at = now()
    where id = target_id and manufacturer_id = mid
    returning id into pid;
  end if;

  if pid is null then
    raise exception 'Product could not be saved';
  end if;

  return pid;
end
$$;

revoke all on function public.save_manufacturer_product_v2(
  uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,text,jsonb,jsonb,text,text,boolean,uuid,text,jsonb
) from public, anon;
grant execute on function public.save_manufacturer_product_v2(
  uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,text,jsonb,jsonb,text,text,boolean,uuid,text,jsonb
) to authenticated;

create or replace function public.manufacturer_products_v2()
returns table (
  product_id uuid,
  name text,
  slug text,
  category_name text,
  model_sku text,
  tagline text,
  status text,
  primary_image text,
  course_count bigint,
  parent_product_id uuid,
  is_family boolean,
  variation_label text,
  variation_options jsonb,
  variation_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.slug,
    c.name,
    p.model_sku,
    p.tagline,
    p.status,
    p.images->0->>'url',
    (select count(*) from public.course_blocks b where b.content->>'product_id' = p.id::text),
    p.parent_product_id,
    p.is_family,
    p.variation_label,
    p.variation_options,
    (select count(*) from public.products child where child.parent_product_id = p.id and child.status <> 'archived')
  from public.profiles pr
  join public.products p on p.manufacturer_id = pr.active_manufacturer_id
  left join public.product_categories c on c.id = p.category_id
  where pr.id = (select auth.uid())
    and private.is_manufacturer_member(p.manufacturer_id)
  order by p.parent_product_id nulls first, p.updated_at desc;
$$;

revoke all on function public.manufacturer_products_v2() from public, anon;
grant execute on function public.manufacturer_products_v2() to authenticated;

create or replace function public.get_manufacturer_product(target_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(p)
    || jsonb_build_object(
      'category_name', c.name,
      'parent_name', parent.name,
      'variations', coalesce((
        select jsonb_agg(
          to_jsonb(child) || jsonb_build_object('category_name', child_category.name)
          order by child.variation_label nulls last, child.name
        )
        from public.products child
        left join public.product_categories child_category on child_category.id = child.category_id
        where child.parent_product_id = p.id and child.status <> 'archived'
      ), '[]'::jsonb)
    )
  from public.products p
  left join public.product_categories c on c.id = p.category_id
  left join public.products parent on parent.id = p.parent_product_id
  where p.id = target_id
    and (private.is_manufacturer_member(p.manufacturer_id) or p.status = 'published')
  limit 1;
$$;

create or replace function public.get_public_product_v2(manufacturer_slug text, product_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(p)
    || jsonb_build_object(
      'category_name', c.name,
      'manufacturer_name', m.name,
      'manufacturer_slug', m.slug,
      'primary_color', m.primary_color,
      'secondary_color', m.secondary_color,
      'logo_url', m.logo_url,
      'variations', coalesce((
        select jsonb_agg(
          to_jsonb(child) || jsonb_build_object('category_name', child_category.name)
          order by child.variation_label nulls last, child.name
        )
        from public.products child
        left join public.product_categories child_category on child_category.id = child.category_id
        where child.parent_product_id = p.id and child.status = 'published'
      ), '[]'::jsonb)
    )
  from public.products p
  join public.manufacturers m on m.id = p.manufacturer_id
  left join public.product_categories c on c.id = p.category_id
  where m.slug = manufacturer_slug
    and p.slug = product_slug
    and p.parent_product_id is null
    and p.status = 'published'
    and m.status = 'active'
  limit 1;
$$;

revoke all on function public.get_public_product_v2(text,text) from public;
grant execute on function public.get_public_product_v2(text,text) to anon, authenticated;

create or replace function public.archive_manufacturer_product(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
begin
  select manufacturer_id into mid from public.products where id = target_id;
  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Product management access required';
  end if;

  update public.products
  set status = 'archived', updated_at = now()
  where id = target_id or parent_product_id = target_id;
end
$$;

create or replace function public.duplicate_manufacturer_product(target_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
  pid uuid;
  suffix text := floor(extract(epoch from clock_timestamp()))::bigint::text;
begin
  select manufacturer_id into mid from public.products where id = target_id;
  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Product management access required';
  end if;

  insert into public.products (
    manufacturer_id, category_id, name, slug, model_sku, tagline, description,
    images, features, specs, compatibility, videos, downloads, product_url, status,
    is_family, variation_label, variation_options
  )
  select
    manufacturer_id, category_id, name || ' (Copy)', slug || '-copy-' || suffix,
    model_sku, tagline, description, images, features, specs, compatibility,
    videos, downloads, product_url, 'draft', is_family, variation_label, variation_options
  from public.products
  where id = target_id
  returning id into pid;

  insert into public.products (
    manufacturer_id, category_id, name, slug, model_sku, tagline, description,
    images, features, specs, compatibility, videos, downloads, product_url, status,
    parent_product_id, is_family, variation_label, variation_options
  )
  select
    manufacturer_id, category_id, name, slug || '-copy-' || suffix,
    model_sku, tagline, description, images, features, specs, compatibility,
    videos, downloads, product_url, 'draft', pid, false, variation_label, variation_options
  from public.products
  where parent_product_id = target_id;

  return pid;
end
$$;

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
      where p.manufacturer_id = m.id
        and p.status = 'published'
        and p.parent_product_id is null
    ), '[]'::jsonb)
  )
  from public.manufacturers m
  where m.slug = manufacturer_slug and m.status = 'active'
  limit 1;
$$;

revoke all on function public.get_manufacturer_product(uuid) from public, anon;
grant execute on function public.get_manufacturer_product(uuid) to authenticated;
revoke all on function public.archive_manufacturer_product(uuid) from public, anon;
grant execute on function public.archive_manufacturer_product(uuid) to authenticated;
revoke all on function public.duplicate_manufacturer_product(uuid) from public, anon;
grant execute on function public.duplicate_manufacturer_product(uuid) to authenticated;
