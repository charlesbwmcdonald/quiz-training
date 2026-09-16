alter table public.reward_items
  add column image_urls text[] not null default '{}'::text[];

alter table public.manufacturer_reward_settings
  add column rewards_started_at timestamptz;

update public.manufacturer_reward_settings set rewards_started_at=updated_at where enabled and rewards_started_at is null;

update public.reward_items
set image_urls = array[image_url]
where image_url is not null and trim(image_url) <> '';

create or replace function public.save_reward_item(target_id uuid, item_name text, item_description text, item_image_url text, item_points_cost integer, item_inventory integer, item_limit integer, item_status text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  mid uuid:=private.active_rewards_manufacturer();
  saved_id uuid;
  cleaned_images text[];
begin
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  if nullif(trim(item_name),'') is null or item_points_cost<1 or item_status not in('draft','live','archived') then raise exception 'Enter a reward name, valid point cost, and status'; end if;
  select coalesce(array_agg(trim(image)) filter(where trim(image) <> ''),'{}'::text[])
  into cleaned_images
  from unnest(regexp_split_to_array(coalesce(item_image_url,''), E'[\\n\\r,]+')) image;
  if target_id is null then
    insert into public.reward_items(manufacturer_id,name,description,image_url,image_urls,points_cost,inventory_quantity,per_user_limit,status)
    values(mid,trim(item_name),nullif(trim(item_description),''),cleaned_images[1],cleaned_images,item_points_cost,item_inventory,item_limit,item_status)
    returning id into saved_id;
  else
    update public.reward_items set name=trim(item_name),description=nullif(trim(item_description),''),image_url=cleaned_images[1],image_urls=cleaned_images,points_cost=item_points_cost,inventory_quantity=item_inventory,per_user_limit=item_limit,status=item_status,updated_at=now()
    where id=target_id and manufacturer_id=mid returning id into saved_id;
    if saved_id is null then raise exception 'Reward not found'; end if;
  end if;
  return saved_id;
end $$;

revoke all on function public.save_reward_item(uuid,text,text,text,integer,integer,integer,text) from public,anon;
grant execute on function public.save_reward_item(uuid,text,text,text,integer,integer,integer,text) to authenticated;

create or replace function private.sync_reward_points(target_manufacturer_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare settings public.manufacturer_reward_settings%rowtype;
begin
  select * into settings from public.manufacturer_reward_settings s where s.manufacturer_id=target_manufacturer_id and s.enabled;
  if not found or settings.rewards_started_at is null then return; end if;
  insert into public.reward_point_ledger(manufacturer_id,user_id,amount,event_type,source_id,description,dedupe_key)
  select c.manufacturer_id,c.user_id,case when c.content_type='course' then settings.course_points else settings.quiz_points end,case when c.content_type='course' then 'course_completion' else 'quiz_completion' end,c.id::text,c.title||' completed','completion:'||c.id::text
  from public.certificates c where c.manufacturer_id=target_manufacturer_id and c.user_id=target_user_id and c.issued_at>=settings.rewards_started_at and case when c.content_type='course' then settings.course_points else settings.quiz_points end>0
  on conflict(dedupe_key) do nothing;
  insert into public.reward_point_ledger(manufacturer_id,user_id,amount,event_type,source_id,description,dedupe_key)
  select p.manufacturer_id,target_user_id,settings.certification_bonus_points,'certification_bonus',p.id::text,p.name||' certification completed','certification:'||p.id::text||':'||a.company_id::text||':'||target_user_id::text
  from public.company_certification_assignments a join public.certification_programs p on p.id=a.program_id and p.manufacturer_id=target_manufacturer_id and p.status='active' join public.company_members cm on cm.company_id=a.company_id and cm.user_id=target_user_id and cm.status='active'
  where settings.certification_bonus_points>0
    and not exists(select 1 from public.certification_requirements r where r.program_id=p.id and not exists(select 1 from public.certificates c where c.manufacturer_id=target_manufacturer_id and c.user_id=target_user_id and c.content_type=r.content_type and c.content_id=r.content_id and c.audience_key=a.company_id::text))
    and exists(select 1 from public.certification_requirements r join public.certificates c on c.manufacturer_id=target_manufacturer_id and c.user_id=target_user_id and c.content_type=r.content_type and c.content_id=r.content_id and c.audience_key=a.company_id::text where r.program_id=p.id and c.issued_at>=settings.rewards_started_at)
  on conflict(dedupe_key) do nothing;
end $$;

create or replace function public.save_reward_settings(rewards_enabled boolean, default_course_points integer, default_quiz_points integer, default_certification_bonus integer, target_fulfillment_email text)
returns void language plpgsql security definer set search_path='' as $$
declare mid uuid:=private.active_rewards_manufacturer();
begin
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  insert into public.manufacturer_reward_settings(manufacturer_id,enabled,course_points,quiz_points,certification_bonus_points,fulfillment_email,rewards_started_at)
  values(mid,rewards_enabled,greatest(default_course_points,0),greatest(default_quiz_points,0),greatest(default_certification_bonus,0),nullif(trim(target_fulfillment_email),''),case when rewards_enabled then now() else null end)
  on conflict(manufacturer_id) do update set enabled=excluded.enabled,course_points=excluded.course_points,quiz_points=excluded.quiz_points,certification_bonus_points=excluded.certification_bonus_points,fulfillment_email=excluded.fulfillment_email,rewards_started_at=case when excluded.enabled and not manufacturer_reward_settings.enabled then now() when not excluded.enabled then null else manufacturer_reward_settings.rewards_started_at end,updated_at=now();
end $$;

create or replace function public.archive_reward_item(target_reward_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare mid uuid:=private.active_rewards_manufacturer();
begin
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Rewards management access required'; end if;
  update public.reward_items set status='archived',updated_at=now() where id=target_reward_id and manufacturer_id=mid;
  if not found then raise exception 'Reward not found'; end if;
end $$;

revoke all on function public.archive_reward_item(uuid) from public,anon;
grant execute on function public.archive_reward_item(uuid) to authenticated;
