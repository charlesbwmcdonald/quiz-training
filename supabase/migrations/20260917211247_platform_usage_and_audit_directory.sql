create or replace function public.platform_manufacturer_usage()
returns table (
  manufacturer_id uuid,
  product_count bigint,
  course_count bigint,
  quiz_count bigint,
  learner_count bigint,
  attempts_30d bigint,
  certificates_issued bigint,
  last_activity_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_owner() then
    raise exception 'Platform owner access required.' using errcode = '42501';
  end if;

  return query
  with product_totals as (
    select p.manufacturer_id, count(*)::bigint as total, max(greatest(p.created_at, p.updated_at)) as latest
    from public.products p
    where p.status <> 'archived'
    group by p.manufacturer_id
  ), course_totals as (
    select c.manufacturer_id, count(*)::bigint as total, max(greatest(c.created_at, c.updated_at)) as latest
    from public.courses c
    where c.status <> 'archived'
    group by c.manufacturer_id
  ), quiz_totals as (
    select q.manufacturer_id, count(*)::bigint as total, max(greatest(q.created_at, q.updated_at)) as latest
    from public.quizzes q
    where q.status <> 'archived'
    group by q.manufacturer_id
  ), learner_totals as (
    select mc.manufacturer_id, count(distinct cm.user_id)::bigint as total, max(cm.joined_at) as latest
    from public.manufacturer_companies mc
    join public.company_members cm on cm.company_id = mc.company_id and cm.status = 'active'
    where mc.status = 'active'
    group by mc.manufacturer_id
  ), attempt_totals as (
    select qa.manufacturer_id,
      count(*) filter (where qa.started_at >= now() - interval '30 days')::bigint as total,
      max(coalesce(qa.submitted_at, qa.started_at)) as latest
    from public.quiz_attempts qa
    where qa.manufacturer_id is not null
    group by qa.manufacturer_id
  ), certificate_totals as (
    select c.manufacturer_id, count(*)::bigint as total, max(c.issued_at) as latest
    from public.certificates c
    group by c.manufacturer_id
  )
  select
    m.id,
    coalesce(pt.total, 0),
    coalesce(ct.total, 0),
    coalesce(qt.total, 0),
    coalesce(lt.total, 0),
    coalesce(at.total, 0),
    coalesce(cert.total, 0),
    greatest(pt.latest, ct.latest, qt.latest, lt.latest, at.latest, cert.latest)
  from public.manufacturers m
  left join product_totals pt on pt.manufacturer_id = m.id
  left join course_totals ct on ct.manufacturer_id = m.id
  left join quiz_totals qt on qt.manufacturer_id = m.id
  left join learner_totals lt on lt.manufacturer_id = m.id
  left join attempt_totals at on at.manufacturer_id = m.id
  left join certificate_totals cert on cert.manufacturer_id = m.id
  order by m.name;
end
$$;

create or replace function public.platform_audit_directory()
returns table (
  id bigint,
  actor_email text,
  action text,
  entity_type text,
  entity_id text,
  manufacturer_name text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_owner() then
    raise exception 'Platform owner access required.' using errcode = '42501';
  end if;

  return query
  select
    a.id,
    u.email::text,
    a.action,
    a.entity_type,
    a.entity_id,
    m.name,
    a.details,
    a.created_at
  from public.platform_audit_log a
  left join auth.users u on u.id = a.actor_user_id
  left join public.manufacturers m on m.id::text = coalesce(
    a.details ->> 'manufacturer_id',
    case when a.entity_type = 'manufacturer' then a.entity_id end
  )
  order by a.created_at desc
  limit 500;
end
$$;

revoke all on function public.platform_manufacturer_usage() from public, anon;
grant execute on function public.platform_manufacturer_usage() to authenticated;

revoke all on function public.platform_audit_directory() from public, anon;
grant execute on function public.platform_audit_directory() to authenticated;
