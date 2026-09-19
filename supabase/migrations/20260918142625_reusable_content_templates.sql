create table public.content_templates (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid references public.manufacturers(id) on delete cascade,
  content_type text not null check(content_type in ('product','quiz','course')),
  name text not null,
  description text,
  snapshot jsonb not null,
  is_platform_template boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check((is_platform_template and manufacturer_id is null) or (not is_platform_template and manufacturer_id is not null))
);
create index content_templates_manufacturer_idx on public.content_templates(manufacturer_id,content_type,updated_at desc);
create index content_templates_platform_idx on public.content_templates(content_type,updated_at desc) where is_platform_template;
alter table public.content_templates enable row level security;
revoke all on table public.content_templates from public,anon,authenticated;

create or replace function public.save_content_as_template(content_type text,target_content_id uuid,template_name text,template_description text default null,make_platform boolean default false)
returns uuid language plpgsql security definer set search_path=''
as $$
declare mid uuid; current_status text; payload jsonb; template_id uuid;
begin
  select i.mid,i.current_status into mid,current_status from private.content_identity(content_type,target_content_id) i;
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Content management access required.' using errcode='42501'; end if;
  if nullif(trim(template_name),'') is null then raise exception 'Template name is required.'; end if;
  if make_platform and not private.is_platform_owner() then raise exception 'Platform owner access required.' using errcode='42501'; end if;
  payload:=private.content_snapshot(content_type,target_content_id);
  if content_type='product' and coalesce((payload->>'is_family')::boolean,false) then
    payload:=payload||jsonb_build_object('variations',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at) from public.products p where p.parent_product_id=target_content_id),'[]'::jsonb));
  end if;
  insert into public.content_templates(manufacturer_id,content_type,name,description,snapshot,is_platform_template,created_by)
  values(case when make_platform then null else mid end,content_type,trim(template_name),nullif(trim(template_description),''),payload,make_platform,(select auth.uid())) returning id into template_id;
  return template_id;
end
$$;

create or replace function public.manufacturer_content_templates()
returns table(template_id uuid,content_type text,template_name text,template_description text,is_platform_template boolean,source_manufacturer_name text,created_by_email text,updated_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
declare mid uuid;
begin
  select active_manufacturer_id into mid from public.profiles where id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager','viewer']::public.manufacturer_role[]) then raise exception 'Manufacturer access required.' using errcode='42501'; end if;
  return query select t.id,t.content_type,t.name,t.description,t.is_platform_template,m.name::text,u.email::text,t.updated_at
  from public.content_templates t left join public.manufacturers m on m.id=t.manufacturer_id left join auth.users u on u.id=t.created_by
  where t.manufacturer_id=mid or t.is_platform_template order by t.is_platform_template desc,t.updated_at desc;
end
$$;

create or replace function public.content_template_detail(target_template_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare mid uuid; result jsonb;
begin
  select active_manufacturer_id into mid from public.profiles where id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager','viewer']::public.manufacturer_role[]) then raise exception 'Manufacturer access required.' using errcode='42501'; end if;
  select jsonb_build_object('template_id',t.id,'content_type',t.content_type,'template_name',t.name,'template_description',t.description,'is_platform_template',t.is_platform_template,'snapshot',t.snapshot,'updated_at',t.updated_at)
  into result from public.content_templates t where t.id=target_template_id and (t.manufacturer_id=mid or t.is_platform_template);
  if result is null then raise exception 'Template not found.'; end if;
  return result;
end
$$;

create or replace function public.use_content_template(target_template_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare t public.content_templates%rowtype; mid uuid; new_id uuid:=gen_random_uuid(); new_parent uuid; item jsonb; child jsonb; question_id uuid; module_id uuid; same_tenant boolean;
begin
  select active_manufacturer_id into mid from public.profiles where id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Content management access required.' using errcode='42501'; end if;
  select * into t from public.content_templates where id=target_template_id and (manufacturer_id=mid or is_platform_template);
  if t.id is null then raise exception 'Template not found.'; end if;
  same_tenant:=t.manufacturer_id=mid;
  if t.content_type='product' then
    insert into public.products(id,manufacturer_id,category_id,name,slug,model_sku,tagline,description,images,features,specs,compatibility,videos,downloads,product_url,status,parent_product_id,is_family,variation_label,variation_options,content_owner_id)
    values(new_id,mid,case when same_tenant then (t.snapshot->>'category_id')::uuid else null end,(t.snapshot->>'name')||' Copy',lower(regexp_replace(t.snapshot->>'slug','[^a-zA-Z0-9]+','-','g'))||'-'||substr(new_id::text,1,8),t.snapshot->>'model_sku',t.snapshot->>'tagline',t.snapshot->>'description',coalesce(t.snapshot->'images','[]'),coalesce(t.snapshot->'features','[]'),coalesce(t.snapshot->'specs','[]'),t.snapshot->>'compatibility',coalesce(t.snapshot->'videos','[]'),coalesce(t.snapshot->'downloads','[]'),t.snapshot->>'product_url','draft',null,coalesce((t.snapshot->>'is_family')::boolean,false),null,coalesce(t.snapshot->'variation_options','{}'),(select auth.uid()));
    for item in select value from jsonb_array_elements(coalesce(t.snapshot->'variations','[]')) loop
      new_parent:=gen_random_uuid();
      insert into public.products(id,manufacturer_id,name,slug,model_sku,tagline,description,images,features,specs,compatibility,videos,downloads,product_url,status,parent_product_id,is_family,variation_label,variation_options,content_owner_id)
      values(new_parent,mid,item->>'name',lower(regexp_replace(item->>'slug','[^a-zA-Z0-9]+','-','g'))||'-'||substr(new_parent::text,1,8),item->>'model_sku',item->>'tagline',item->>'description',coalesce(item->'images','[]'),coalesce(item->'features','[]'),coalesce(item->'specs','[]'),item->>'compatibility',coalesce(item->'videos','[]'),coalesce(item->'downloads','[]'),item->>'product_url','draft',new_id,false,item->>'variation_label',coalesce(item->'variation_options','{}'),(select auth.uid()));
    end loop;
  elsif t.content_type='quiz' then
    insert into public.quizzes(id,title,description,is_published,manufacturer_id,status,passing_score,content_owner_id) values(new_id,(t.snapshot->>'title')||' Copy',t.snapshot->>'description',false,mid,'draft',(t.snapshot->>'passing_score')::integer,(select auth.uid()));
    for item in select value from jsonb_array_elements(coalesce(t.snapshot->'questions','[]')) loop
      question_id:=gen_random_uuid(); insert into public.quiz_questions(id,quiz_id,position,prompt,question_type,image_url) values(question_id,new_id,(item->>'position')::integer,item->>'prompt',coalesce(item->>'question_type','single_choice'),item->>'image_url');
      for child in select value from jsonb_array_elements(coalesce(item->'choices','[]')) loop insert into public.quiz_choices(question_id,position,label,is_correct) values(question_id,(child->>'position')::integer,child->>'label',(child->>'is_correct')::boolean); end loop;
    end loop;
  else
    insert into public.courses(id,manufacturer_id,title,description,status,content_owner_id) values(new_id,mid,(t.snapshot->>'title')||' Copy',t.snapshot->>'description','draft',(select auth.uid()));
    for item in select value from jsonb_array_elements(coalesce(t.snapshot->'modules','[]')) loop
      module_id:=gen_random_uuid(); insert into public.course_modules(id,course_id,title,position) values(module_id,new_id,item->>'title',(item->>'position')::integer);
      for child in select value from jsonb_array_elements(coalesce(item->'blocks','[]')) loop
        insert into public.course_blocks(module_id,block_type,title,content,quiz_id,position,required) values(module_id,child->>'block_type',child->>'title',case when same_tenant then coalesce(child->'content','{}') else coalesce(child->'content','{}')-'product_id' end,case when same_tenant then (child->>'quiz_id')::uuid else null end,(child->>'position')::integer,coalesce((child->>'required')::boolean,true));
      end loop;
    end loop;
  end if;
  return new_id;
end
$$;

create or replace function public.delete_content_template(target_template_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare t public.content_templates%rowtype;
begin
 select * into t from public.content_templates where id=target_template_id;
 if t.id is null then return; end if;
 if t.is_platform_template then if not private.is_platform_owner() then raise exception 'Platform owner access required.' using errcode='42501'; end if;
 elsif not private.has_manufacturer_role(t.manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[]) then raise exception 'Content management access required.' using errcode='42501'; end if;
 delete from public.content_templates where id=target_template_id;
end
$$;

revoke all on function public.save_content_as_template(text,uuid,text,text,boolean) from public,anon;
grant execute on function public.save_content_as_template(text,uuid,text,text,boolean) to authenticated;
revoke all on function public.manufacturer_content_templates() from public,anon;
grant execute on function public.manufacturer_content_templates() to authenticated;
revoke all on function public.content_template_detail(uuid) from public,anon;
grant execute on function public.content_template_detail(uuid) to authenticated;
revoke all on function public.use_content_template(uuid) from public,anon;
grant execute on function public.use_content_template(uuid) to authenticated;
revoke all on function public.delete_content_template(uuid) from public,anon;
grant execute on function public.delete_content_template(uuid) to authenticated;
