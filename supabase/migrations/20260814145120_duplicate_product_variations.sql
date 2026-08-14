create or replace function public.duplicate_manufacturer_product(target_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
  parent_id uuid;
  target_is_family boolean;
  pid uuid;
  suffix text := floor(extract(epoch from clock_timestamp()))::bigint::text;
begin
  select manufacturer_id, parent_product_id, is_family
    into mid, parent_id, target_is_family
  from public.products
  where id = target_id;

  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Product management access required';
  end if;

  if parent_id is not null then
    insert into public.products (
      manufacturer_id, category_id, name, slug, model_sku, tagline, description,
      images, features, specs, compatibility, videos, downloads, product_url, status,
      parent_product_id, is_family, variation_label, variation_options
    )
    select
      manufacturer_id, category_id, name, slug || '-copy-' || suffix,
      model_sku, tagline, description, images, features, specs, compatibility,
      videos, downloads, product_url, 'draft', parent_product_id, false,
      coalesce(nullif(variation_label, ''), name) || ' (Copy)', variation_options
    from public.products
    where id = target_id
    returning id into pid;

    return pid;
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

  if target_is_family then
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
  end if;

  return pid;
end
$$;

revoke all on function public.duplicate_manufacturer_product(uuid) from public, anon;
grant execute on function public.duplicate_manufacturer_product(uuid) to authenticated;
