create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  company text not null check (char_length(company) between 2 and 180),
  job_title text,
  website text,
  retailer_count text,
  current_process text,
  primary_goal text not null check (char_length(primary_goal) between 10 and 2000),
  launch_timeline text,
  service_tier text,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed'))
);

alter table public.contact_inquiries enable row level security;
revoke all on table public.contact_inquiries from public, anon, authenticated;
grant insert on table public.contact_inquiries to anon, authenticated;

drop policy if exists "Public can submit contact inquiries" on public.contact_inquiries;
create policy "Public can submit contact inquiries"
on public.contact_inquiries
for insert
to anon, authenticated
with check (
  status = 'new'
  and char_length(name) between 2 and 120
  and char_length(email) between 5 and 254
  and char_length(company) between 2 and 180
  and char_length(primary_goal) between 10 and 2000
);

create or replace function public.platform_contact_inquiries()
returns table (
  id uuid,
  created_at timestamptz,
  name text,
  email text,
  company text,
  job_title text,
  website text,
  retailer_count text,
  current_process text,
  primary_goal text,
  launch_timeline text,
  service_tier text,
  status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.is_platform_owner() then raise exception 'Platform owner access required'; end if;
  return query select i.id,i.created_at,i.name,i.email,i.company,i.job_title,i.website,i.retailer_count,i.current_process,i.primary_goal,i.launch_timeline,i.service_tier,i.status
  from public.contact_inquiries i order by i.created_at desc limit 100;
end;
$$;

revoke all on function public.platform_contact_inquiries() from public, anon;
grant execute on function public.platform_contact_inquiries() to authenticated;
