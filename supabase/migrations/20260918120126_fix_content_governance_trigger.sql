create or replace function private.apply_content_governance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.content_owner_id := coalesce(new.content_owner_id, (select auth.uid()));
  if new.status = 'review' and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status is distinct from 'review')) then
    new.review_requested_at := now();
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status is distinct from 'published')) then
    new.published_at := now();
  end if;
  return new;
end
$$;

revoke all on function private.apply_content_governance() from public, anon, authenticated;
