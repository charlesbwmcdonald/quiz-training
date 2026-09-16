create table public.manufacturer_reward_settings (
  manufacturer_id uuid primary key references public.manufacturers(id) on delete cascade,
  enabled boolean not null default false,
  course_points integer not null default 100 check (course_points >= 0),
  quiz_points integer not null default 25 check (quiz_points >= 0),
  certification_bonus_points integer not null default 250 check (certification_bonus_points >= 0),
  fulfillment_email text,
  updated_at timestamptz not null default now()
);

create table public.reward_items (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 140),
  description text,
  image_url text,
  points_cost integer not null check (points_cost > 0),
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  per_user_limit integer check (per_user_limit is null or per_user_limit > 0),
  status text not null default 'draft' check (status in ('draft','live','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  reward_item_id uuid not null references public.reward_items(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_name text not null,
  points_cost integer not null check (points_cost > 0),
  status text not null default 'requested' check (status in ('requested','approved','shipped','fulfilled','declined','cancelled')),
  recipient_name text not null,
  recipient_email text not null,
  recipient_phone text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_region text not null,
  postal_code text not null,
  tracking_number text,
  admin_notes text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  shipped_at timestamptz,
  fulfilled_at timestamptz
);

create table public.reward_point_ledger (
  id bigint generated always as identity primary key,
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  event_type text not null check (event_type in ('course_completion','quiz_completion','certification_bonus','manual_adjustment','redemption_reserve','redemption_refund')),
  source_id text,
  description text not null,
  dedupe_key text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index reward_items_manufacturer_status_idx on public.reward_items(manufacturer_id,status);
create index reward_redemptions_manufacturer_status_idx on public.reward_redemptions(manufacturer_id,status,requested_at desc);
create index reward_redemptions_user_idx on public.reward_redemptions(manufacturer_id,user_id,requested_at desc);
create index reward_point_ledger_balance_idx on public.reward_point_ledger(manufacturer_id,user_id,created_at desc);

alter table public.manufacturer_reward_settings enable row level security;
alter table public.reward_items enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.reward_point_ledger enable row level security;

revoke all on public.manufacturer_reward_settings, public.reward_items, public.reward_redemptions, public.reward_point_ledger from anon, authenticated;
revoke all on sequence public.reward_point_ledger_id_seq from anon, authenticated;

create or replace function private.active_rewards_manufacturer()
returns uuid language sql stable security invoker set search_path='' as $$
  select p.active_manufacturer_id from public.profiles p where p.id=(select auth.uid())
$$;

create or replace function private.can_access_rewards(target_manufacturer_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null and (
    exists(select 1 from public.manufacturer_members mm where mm.manufacturer_id=target_manufacturer_id and mm.user_id=(select auth.uid()) and mm.status='active')
    or exists(
      select 1 from public.company_members cm
      join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.status='active'
      where cm.user_id=(select auth.uid()) and cm.status='active' and mc.manufacturer_id=target_manufacturer_id
    )
  )
$$;

create or replace function private.sync_reward_points(target_manufacturer_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare settings public.manufacturer_reward_settings%rowtype;
begin
  select * into settings from public.manufacturer_reward_settings s where s.manufacturer_id=target_manufacturer_id and s.enabled;
  if not found then return; end if;

  insert into public.reward_point_ledger(manufacturer_id,user_id,amount,event_type,source_id,description,dedupe_key)
  select c.manufacturer_id,c.user_id,
    case when c.content_type='course' then settings.course_points else settings.quiz_points end,
    case when c.content_type='course' then 'course_completion' else 'quiz_completion' end,
    c.id::text,c.title||' completed','completion:'||c.id::text
  from public.certificates c
  where c.manufacturer_id=target_manufacturer_id and c.user_id=target_user_id
    and case when c.content_type='course' then settings.course_points else settings.quiz_points end > 0
  on conflict(dedupe_key) do nothing;
end $$;

create or replace function public.rewards_learner_dashboard()
returns jsonb language plpgsql security definer set search_path='' as $$
declare mid uuid; uid uuid:=(select auth.uid()); result jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  mid:=private.active_rewards_manufacturer();
  if mid is null or not private.can_access_rewards(mid) then raise exception 'Academy access required'; end if;
  perform private.sync_reward_points(mid,uid);
  select jsonb_build_object(
    'enabled',coalesce((select s.enabled from public.manufacturer_reward_settings s where s.manufacturer_id=mid),false),
    'balance',coalesce((select sum(l.amount) from public.reward_point_ledger l where l.manufacturer_id=mid and l.user_id=uid),0),
    'lifetime_points',coalesce((select sum(l.amount) from public.reward_point_ledger l where l.manufacturer_id=mid and l.user_id=uid and l.amount>0),0),
    'items',coalesce((select jsonb_agg(to_jsonb(i) order by i.points_cost,i.name) from public.reward_items i where i.manufacturer_id=mid and i.status='live' and (i.inventory_quantity is null or i.inventory_quantity>0)),'[]'::jsonb),
    'redemptions',coalesce((select jsonb_agg(to_jsonb(r) order by r.requested_at desc) from public.reward_redemptions r where r.manufacturer_id=mid and r.user_id=uid),'[]'::jsonb),
    'activity',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select l.amount,l.event_type,l.description,l.created_at from public.reward_point_ledger l where l.manufacturer_id=mid and l.user_id=uid order by l.created_at desc limit 20)x),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.rewards_admin_dashboard()
returns jsonb language plpgsql security definer set search_path='' as $$
declare mid uuid; result jsonb;
begin
  mid:=private.active_rewards_manufacturer();
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  insert into public.manufacturer_reward_settings(manufacturer_id) values(mid) on conflict do nothing;
  select jsonb_build_object(
    'settings',(select to_jsonb(s) from public.manufacturer_reward_settings s where s.manufacturer_id=mid),
    'items',coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from public.reward_items i where i.manufacturer_id=mid),'[]'::jsonb),
    'redemptions',coalesce((select jsonb_agg(to_jsonb(x) order by x.requested_at desc) from (
      select r.*,u.email as user_email from public.reward_redemptions r join auth.users u on u.id=r.user_id where r.manufacturer_id=mid
    )x),'[]'::jsonb),
    'outstanding',coalesce((select count(*) from public.reward_redemptions r where r.manufacturer_id=mid and r.status in('requested','approved','shipped')),0),
    'points_issued',coalesce((select sum(l.amount) from public.reward_point_ledger l where l.manufacturer_id=mid and l.amount>0),0)
  ) into result;
  return result;
end $$;

create or replace function public.save_reward_settings(rewards_enabled boolean, default_course_points integer, default_quiz_points integer, default_certification_bonus integer, target_fulfillment_email text)
returns void language plpgsql security definer set search_path='' as $$
declare mid uuid:=private.active_rewards_manufacturer();
begin
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  insert into public.manufacturer_reward_settings(manufacturer_id,enabled,course_points,quiz_points,certification_bonus_points,fulfillment_email)
  values(mid,rewards_enabled,greatest(default_course_points,0),greatest(default_quiz_points,0),greatest(default_certification_bonus,0),nullif(trim(target_fulfillment_email),''))
  on conflict(manufacturer_id) do update set enabled=excluded.enabled,course_points=excluded.course_points,quiz_points=excluded.quiz_points,certification_bonus_points=excluded.certification_bonus_points,fulfillment_email=excluded.fulfillment_email,updated_at=now();
end $$;

create or replace function public.save_reward_item(target_id uuid, item_name text, item_description text, item_image_url text, item_points_cost integer, item_inventory integer, item_limit integer, item_status text)
returns uuid language plpgsql security definer set search_path='' as $$
declare mid uuid:=private.active_rewards_manufacturer(); saved_id uuid;
begin
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  if nullif(trim(item_name),'') is null or item_points_cost<1 or item_status not in('draft','live','archived') then raise exception 'Enter a reward name, valid point cost, and status'; end if;
  if target_id is null then
    insert into public.reward_items(manufacturer_id,name,description,image_url,points_cost,inventory_quantity,per_user_limit,status)
    values(mid,trim(item_name),nullif(trim(item_description),''),nullif(trim(item_image_url),''),item_points_cost,item_inventory,item_limit,item_status) returning id into saved_id;
  else
    update public.reward_items set name=trim(item_name),description=nullif(trim(item_description),''),image_url=nullif(trim(item_image_url),''),points_cost=item_points_cost,inventory_quantity=item_inventory,per_user_limit=item_limit,status=item_status,updated_at=now()
    where id=target_id and manufacturer_id=mid returning id into saved_id;
    if saved_id is null then raise exception 'Reward not found'; end if;
  end if;
  return saved_id;
end $$;

create or replace function public.redeem_reward(target_reward_id uuid, target_name text, target_email text, target_phone text, target_address_1 text, target_address_2 text, target_city text, target_state text, target_postal_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare mid uuid:=private.active_rewards_manufacturer(); uid uuid:=(select auth.uid()); item public.reward_items%rowtype; balance bigint; rid uuid; notify_email text;
begin
  if uid is null or mid is null or not private.can_access_rewards(mid) then raise exception 'Academy access required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(mid::text||':'||uid::text,0));
  perform private.sync_reward_points(mid,uid);
  select * into item from public.reward_items i where i.id=target_reward_id and i.manufacturer_id=mid and i.status='live' for update;
  if not found or item.inventory_quantity=0 then raise exception 'This reward is no longer available'; end if;
  if nullif(trim(target_name),'') is null or nullif(trim(target_email),'') is null or nullif(trim(target_address_1),'') is null or nullif(trim(target_city),'') is null or nullif(trim(target_state),'') is null or nullif(trim(target_postal_code),'') is null then raise exception 'Complete the shipping details'; end if;
  select coalesce(sum(l.amount),0) into balance from public.reward_point_ledger l where l.manufacturer_id=mid and l.user_id=uid;
  if balance<item.points_cost then raise exception 'You do not have enough points for this reward'; end if;
  if item.per_user_limit is not null and (select count(*) from public.reward_redemptions r where r.reward_item_id=item.id and r.user_id=uid and r.status not in('declined','cancelled'))>=item.per_user_limit then raise exception 'You have reached the redemption limit for this reward'; end if;
  insert into public.reward_redemptions(manufacturer_id,reward_item_id,user_id,reward_name,points_cost,recipient_name,recipient_email,recipient_phone,address_line_1,address_line_2,city,state_region,postal_code)
  values(mid,item.id,uid,item.name,item.points_cost,trim(target_name),trim(target_email),nullif(trim(target_phone),''),trim(target_address_1),nullif(trim(target_address_2),''),trim(target_city),trim(target_state),trim(target_postal_code)) returning id into rid;
  insert into public.reward_point_ledger(manufacturer_id,user_id,amount,event_type,source_id,description,dedupe_key)
  values(mid,uid,-item.points_cost,'redemption_reserve',rid::text,item.name||' redemption','redemption:'||rid::text);
  if item.inventory_quantity is not null then update public.reward_items set inventory_quantity=inventory_quantity-1,updated_at=now() where id=item.id; end if;
  select s.fulfillment_email into notify_email from public.manufacturer_reward_settings s where s.manufacturer_id=mid;
  return jsonb_build_object('id',rid,'reward_name',item.name,'fulfillment_email',notify_email);
end $$;

create or replace function public.update_reward_redemption(target_redemption_id uuid, next_status text, target_tracking text, target_notes text)
returns void language plpgsql security definer set search_path='' as $$
declare mid uuid:=private.active_rewards_manufacturer(); r public.reward_redemptions%rowtype;
begin
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  if next_status not in('approved','shipped','fulfilled','declined','cancelled') then raise exception 'Invalid redemption status'; end if;
  select * into r from public.reward_redemptions where id=target_redemption_id and manufacturer_id=mid for update;
  if not found then raise exception 'Redemption not found'; end if;
  if r.status in('declined','cancelled','fulfilled') then raise exception 'This redemption is already closed'; end if;
  if next_status in('declined','cancelled') then
    insert into public.reward_point_ledger(manufacturer_id,user_id,amount,event_type,source_id,description,dedupe_key,created_by)
    values(mid,r.user_id,r.points_cost,'redemption_refund',r.id::text,r.reward_name||' redemption refunded','refund:'||r.id::text,(select auth.uid())) on conflict(dedupe_key) do nothing;
    update public.reward_items set inventory_quantity=case when inventory_quantity is null then null else inventory_quantity+1 end,updated_at=now() where id=r.reward_item_id;
  end if;
  update public.reward_redemptions set status=next_status,tracking_number=nullif(trim(target_tracking),''),admin_notes=nullif(trim(target_notes),''),updated_at=now(),approved_at=case when next_status='approved' then now() else approved_at end,shipped_at=case when next_status='shipped' then now() else shipped_at end,fulfilled_at=case when next_status='fulfilled' then now() else fulfilled_at end where id=r.id;
end $$;

revoke all on function private.active_rewards_manufacturer() from public,anon,authenticated;
revoke all on function private.can_access_rewards(uuid) from public,anon,authenticated;
revoke all on function private.sync_reward_points(uuid,uuid) from public,anon,authenticated;
revoke all on function public.rewards_learner_dashboard() from public,anon;
revoke all on function public.rewards_admin_dashboard() from public,anon;
revoke all on function public.save_reward_settings(boolean,integer,integer,integer,text) from public,anon;
revoke all on function public.save_reward_item(uuid,text,text,text,integer,integer,integer,text) from public,anon;
revoke all on function public.redeem_reward(uuid,text,text,text,text,text,text,text,text) from public,anon;
revoke all on function public.update_reward_redemption(uuid,text,text,text) from public,anon;
grant execute on function public.rewards_learner_dashboard() to authenticated;
grant execute on function public.rewards_admin_dashboard() to authenticated;
grant execute on function public.save_reward_settings(boolean,integer,integer,integer,text) to authenticated;
grant execute on function public.save_reward_item(uuid,text,text,text,integer,integer,integer,text) to authenticated;
grant execute on function public.redeem_reward(uuid,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.update_reward_redemption(uuid,text,text,text) to authenticated;
