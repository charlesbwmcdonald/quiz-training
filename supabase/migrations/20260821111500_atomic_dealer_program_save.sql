create or replace function public.save_dealer_program(
  target_program_id uuid,
  program_title text,
  program_summary text,
  program_offer_details text,
  program_eligibility text,
  program_terms text,
  program_flyer_path text,
  program_contact_name text,
  program_contact_email text,
  program_contact_phone text,
  program_cta_label text,
  program_starts_at timestamptz,
  program_ends_at timestamptz,
  program_status text,
  program_audience_mode text,
  target_company_ids uuid[],
  related_product_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
  saved_id uuid := coalesce(target_program_id,gen_random_uuid());
begin
  select active_manufacturer_id into mid from public.profiles where id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Training management access required'; end if;
  if target_program_id is not null and not exists(select 1 from public.dealer_programs where id=target_program_id and manufacturer_id=mid) then raise exception 'Dealer program not found'; end if;
  if program_status not in ('draft','active','archived') or program_audience_mode not in ('all','selected') then raise exception 'Invalid program status or audience'; end if;
  if program_audience_mode='selected' and coalesce(cardinality(target_company_ids),0)=0 then raise exception 'Choose at least one eligible retailer'; end if;
  if program_ends_at is not null and program_starts_at is not null and program_ends_at<=program_starts_at then raise exception 'End date must be after start date'; end if;
  if exists(select 1 from unnest(coalesce(target_company_ids,'{}'::uuid[])) cid where not exists(select 1 from public.manufacturer_companies mc where mc.manufacturer_id=mid and mc.company_id=cid and mc.status='active')) then raise exception 'Invalid retailer selection'; end if;
  if exists(select 1 from unnest(coalesce(related_product_ids,'{}'::uuid[])) pid where not exists(select 1 from public.products p where p.manufacturer_id=mid and p.id=pid)) then raise exception 'Invalid product selection'; end if;

  insert into public.dealer_programs(id,manufacturer_id,title,summary,offer_details,eligibility,terms,flyer_path,contact_name,contact_email,contact_phone,cta_label,starts_at,ends_at,status,audience_mode,created_by)
  values(saved_id,mid,trim(program_title),trim(program_summary),trim(program_offer_details),nullif(trim(program_eligibility),''),nullif(trim(program_terms),''),nullif(trim(program_flyer_path),''),nullif(trim(program_contact_name),''),nullif(trim(program_contact_email),''),nullif(trim(program_contact_phone),''),coalesce(nullif(trim(program_cta_label),''),'I''m interested'),program_starts_at,program_ends_at,program_status,program_audience_mode,(select auth.uid()))
  on conflict(id) do update set title=excluded.title,summary=excluded.summary,offer_details=excluded.offer_details,eligibility=excluded.eligibility,terms=excluded.terms,flyer_path=excluded.flyer_path,contact_name=excluded.contact_name,contact_email=excluded.contact_email,contact_phone=excluded.contact_phone,cta_label=excluded.cta_label,starts_at=excluded.starts_at,ends_at=excluded.ends_at,status=excluded.status,audience_mode=excluded.audience_mode,updated_at=now();

  delete from public.dealer_program_targets where program_id=saved_id;
  if program_audience_mode='selected' then
    insert into public.dealer_program_targets(program_id,company_id) select saved_id,cid from unnest(target_company_ids) cid;
  end if;
  delete from public.dealer_program_products where program_id=saved_id;
  insert into public.dealer_program_products(program_id,product_id,position)
  select saved_id,pid,ordinality-1 from unnest(coalesce(related_product_ids,'{}'::uuid[])) with ordinality as selected(pid,ordinality);
  return saved_id;
end;
$$;

revoke all on function public.save_dealer_program(uuid,text,text,text,text,text,text,text,text,text,text,timestamptz,timestamptz,text,text,uuid[],uuid[]) from public,anon;
grant execute on function public.save_dealer_program(uuid,text,text,text,text,text,text,text,text,text,text,timestamptz,timestamptz,text,text,uuid[],uuid[]) to authenticated;
