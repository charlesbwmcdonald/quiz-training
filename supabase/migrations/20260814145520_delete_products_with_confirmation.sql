create or replace function public.delete_manufacturer_product(
  target_id uuid,
  confirmation_text text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
  deleted_children integer := 0;
  deleted_parent integer := 0;
begin
  if confirmation_text <> 'DELETE' then
    raise exception 'Type DELETE exactly to permanently delete this product';
  end if;

  select manufacturer_id into mid
  from public.products
  where id = target_id;

  if mid is null or not private.has_manufacturer_role(
    mid,
    array['owner','admin','content_manager']::public.manufacturer_role[]
  ) then
    raise exception 'Product management access required';
  end if;

  if exists (
    select 1
    from public.course_blocks block
    where block.content->>'product_id' in (
      select product.id::text
      from public.products product
      where product.id = target_id or product.parent_product_id = target_id
    )
  ) then
    raise exception 'Remove this product from all courses before deleting it permanently';
  end if;

  delete from public.products
  where parent_product_id = target_id;
  get diagnostics deleted_children = row_count;

  delete from public.products
  where id = target_id and manufacturer_id = mid;
  get diagnostics deleted_parent = row_count;

  if deleted_parent = 0 then
    raise exception 'Product could not be deleted';
  end if;

  return deleted_parent + deleted_children;
end
$$;

revoke all on function public.delete_manufacturer_product(uuid,text) from public, anon;
grant execute on function public.delete_manufacturer_product(uuid,text) to authenticated;
