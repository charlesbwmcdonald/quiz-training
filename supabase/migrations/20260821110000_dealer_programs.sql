create table public.dealer_programs (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  summary text not null check (char_length(trim(summary)) between 10 and 600),
  offer_details text not null check (char_length(trim(offer_details)) between 10 and 5000),
  eligibility text,
  terms text,
  flyer_path text,
  contact_name text,
  contact_email text,
  contact_phone text,
  cta_label text not null default 'I''m interested' check (char_length(cta_label) between 2 and 60),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  audience_mode text not null default 'all' check (audience_mode in ('all','selected')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.dealer_program_targets (
  program_id uuid not null references public.dealer_programs(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_id, company_id)
);

create table public.dealer_program_products (
  program_id uuid not null references public.dealer_programs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  primary key (program_id, product_id)
);

create table public.dealer_program_events (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.dealer_programs(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('view','download','interest')),
  created_at timestamptz not null default now()
);

create index dealer_programs_manufacturer_status_idx on public.dealer_programs(manufacturer_id,status,starts_at,ends_at);
create index dealer_program_targets_company_idx on public.dealer_program_targets(company_id,program_id);
create index dealer_program_events_program_idx on public.dealer_program_events(program_id,event_type,created_at desc);
create unique index dealer_program_one_interest_per_company_idx on public.dealer_program_events(program_id,company_id) where event_type='interest';

alter table public.dealer_programs enable row level security;
alter table public.dealer_program_targets enable row level security;
alter table public.dealer_program_products enable row level security;
alter table public.dealer_program_events enable row level security;

create or replace function private.can_access_dealer_program(target_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dealer_programs p
    where p.id = target_program_id
      and (
        (
          p.manufacturer_id = (select pr.active_manufacturer_id from public.profiles pr where pr.id = (select auth.uid()))
          and private.has_manufacturer_role(p.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
        )
        or (
          p.status = 'active'
          and (p.starts_at is null or p.starts_at <= now())
          and (p.ends_at is null or p.ends_at > now())
          and exists (
            select 1
            from public.company_members cm
            join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=p.manufacturer_id and mc.status='active'
            where cm.user_id=(select auth.uid()) and cm.status='active'
              and (p.audience_mode='all' or exists (
                select 1 from public.dealer_program_targets t where t.program_id=p.id and t.company_id=cm.company_id
              ))
          )
        )
      )
  );
$$;

revoke all on function private.can_access_dealer_program(uuid) from public,anon;
grant execute on function private.can_access_dealer_program(uuid) to authenticated;

create policy "Accessible dealer programs"
on public.dealer_programs for select to authenticated
using (private.can_access_dealer_program(id));

create policy "Managers create dealer programs"
on public.dealer_programs for insert to authenticated
with check (
  manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
  and private.has_manufacturer_role(manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
  and created_by=(select auth.uid())
);

create policy "Managers update dealer programs"
on public.dealer_programs for update to authenticated
using (
  manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
  and private.has_manufacturer_role(manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
)
with check (
  manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
  and private.has_manufacturer_role(manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
);

create policy "Managers delete dealer programs"
on public.dealer_programs for delete to authenticated
using (
  manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
  and private.has_manufacturer_role(manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
);

create policy "Accessible dealer program targets"
on public.dealer_program_targets for select to authenticated
using (private.can_access_dealer_program(program_id));

create policy "Managers add dealer program targets"
on public.dealer_program_targets for insert to authenticated
with check (exists (
  select 1 from public.dealer_programs p where p.id=program_id
    and p.manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
    and private.has_manufacturer_role(p.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
    and exists (select 1 from public.manufacturer_companies mc where mc.manufacturer_id=p.manufacturer_id and mc.company_id=dealer_program_targets.company_id and mc.status='active')
));

create policy "Managers remove dealer program targets"
on public.dealer_program_targets for delete to authenticated
using (exists (
  select 1 from public.dealer_programs p where p.id=program_id
    and p.manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
    and private.has_manufacturer_role(p.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
));

create policy "Accessible dealer program products"
on public.dealer_program_products for select to authenticated
using (private.can_access_dealer_program(program_id));

create policy "Managers add dealer program products"
on public.dealer_program_products for insert to authenticated
with check (exists (
  select 1 from public.dealer_programs p join public.products pr on pr.id=dealer_program_products.product_id and pr.manufacturer_id=p.manufacturer_id
  where p.id=program_id
    and p.manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
    and private.has_manufacturer_role(p.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
));

create policy "Managers remove dealer program products"
on public.dealer_program_products for delete to authenticated
using (exists (
  select 1 from public.dealer_programs p where p.id=program_id
    and p.manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
    and private.has_manufacturer_role(p.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
));

create policy "Managers and participants view dealer program events"
on public.dealer_program_events for select to authenticated
using (
  user_id=(select auth.uid())
  or exists (
    select 1 from public.dealer_programs p where p.id=program_id
      and p.manufacturer_id=(select active_manufacturer_id from public.profiles where id=(select auth.uid()))
      and private.has_manufacturer_role(p.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[])
  )
);

create or replace function public.record_dealer_program_event(target_program_id uuid, target_event_type text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  participant_company_id uuid;
begin
  if (select auth.uid()) is null or target_event_type not in ('view','download','interest') then raise exception 'Invalid program event'; end if;
  if not private.can_access_dealer_program(target_program_id) then raise exception 'Program access required'; end if;

  select cm.company_id into participant_company_id
  from public.dealer_programs p
  join public.company_members cm on cm.user_id=(select auth.uid()) and cm.status='active'
  join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=p.manufacturer_id and mc.status='active'
  where p.id=target_program_id
    and (p.audience_mode='all' or exists(select 1 from public.dealer_program_targets t where t.program_id=p.id and t.company_id=cm.company_id))
  order by cm.created_at
  limit 1;

  if participant_company_id is null then return; end if;
  insert into public.dealer_program_events(program_id,company_id,user_id,event_type)
  values(target_program_id,participant_company_id,(select auth.uid()),target_event_type)
  on conflict (program_id,company_id) where event_type='interest' do nothing;
end;
$$;

revoke all on function public.record_dealer_program_event(uuid,text) from public,anon;
grant execute on function public.record_dealer_program_event(uuid,text) to authenticated;

grant select,insert,update,delete on public.dealer_programs to authenticated;
grant select,insert,delete on public.dealer_program_targets to authenticated;
grant select,insert,delete on public.dealer_program_products to authenticated;
grant select on public.dealer_program_events to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dealer-programs','dealer-programs',false,10485760,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Dealer program managers upload PDFs"
on storage.objects for insert to authenticated
with check (
  bucket_id='dealer-programs'
  and (storage.foldername(name))[1]=(select active_manufacturer_id::text from public.profiles where id=(select auth.uid()))
  and private.has_manufacturer_role((storage.foldername(name))[1]::uuid,array['owner','admin','content_manager']::public.manufacturer_role[])
  and storage.extension(name)='pdf'
);

create policy "Eligible users download dealer program PDFs"
on storage.objects for select to authenticated
using (
  bucket_id='dealer-programs'
  and exists(select 1 from public.dealer_programs p where p.flyer_path=name and private.can_access_dealer_program(p.id))
);

create policy "Dealer program managers delete PDFs"
on storage.objects for delete to authenticated
using (
  bucket_id='dealer-programs'
  and (storage.foldername(name))[1]=(select active_manufacturer_id::text from public.profiles where id=(select auth.uid()))
  and private.has_manufacturer_role((storage.foldername(name))[1]::uuid,array['owner','admin','content_manager']::public.manufacturer_role[])
);
