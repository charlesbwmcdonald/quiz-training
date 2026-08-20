create or replace function public.manufacturer_training_report()
returns jsonb
language plpgsql stable security definer set search_path=''
as $function$
#variable_conflict use_variable
declare manufacturer_id uuid; report jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select p.active_manufacturer_id into manufacturer_id from public.profiles p where p.id=(select auth.uid());
  if manufacturer_id is null or not private.has_manufacturer_role(manufacturer_id,array['owner','admin','content_manager']::public.manufacturer_role[]) then
    raise exception 'You do not have permission to view this report';
  end if;

  with linked_companies as (
    select c.id,c.name from public.manufacturer_companies mc join public.companies c on c.id=mc.company_id
    where mc.manufacturer_id=manufacturer_id and mc.status='active'
  ), retailer_learners as (
    select cm.company_id,cm.user_id,u.email from public.company_members cm join linked_companies lc on lc.id=cm.company_id
    join auth.users u on u.id=cm.user_id where cm.status='active'
  ), team_learners as (
    select mm.user_id,u.email from public.manufacturer_members mm join auth.users u on u.id=mm.user_id
    where mm.manufacturer_id=manufacturer_id and mm.status='active'
  ), block_counts as (
    select m.course_id,count(b.id)::int total from public.course_modules m left join public.course_blocks b on b.module_id=m.id group by m.course_id
  ), retailer_course_done as (
    select p.company_id,p.course_id,p.user_id,count(*)::int done,max(p.completed_at) completed_at
    from public.course_block_progress p group by p.company_id,p.course_id,p.user_id
  ), team_course_done as (
    select p.course_id,p.user_id,count(*)::int done,max(p.completed_at) completed_at
    from public.manufacturer_course_progress p where p.manufacturer_id=manufacturer_id group by p.course_id,p.user_id
  ), latest_retailer_quiz as (
    select distinct on(a.company_id,a.quiz_id,a.user_id) a.company_id,a.quiz_id,a.user_id,a.score,a.submitted_at
    from public.quiz_attempts a where a.status='completed' order by a.company_id,a.quiz_id,a.user_id,a.submitted_at desc
  ), latest_team_quiz as (
    select distinct on(a.quiz_id,a.user_id) a.quiz_id,a.user_id,a.score,a.submitted_at
    from public.quiz_attempts a where a.status='completed' and a.manufacturer_id=manufacturer_id order by a.quiz_id,a.user_id,a.submitted_at desc
  ), assignment_rows as (
    select 'retailer'::text audience_type,lc.name audience_name,rl.user_id,rl.email,'quiz'::text content_type,q.id content_id,q.title,
      a.created_at assigned_at,a.due_at,case when l.score is null then 0 else 100 end progress,l.score is not null completed,
      case when l.score is null then null else l.score>=q.passing_score end passed,l.score,l.submitted_at completed_at
    from public.company_quiz_assignments a join linked_companies lc on lc.id=a.company_id join retailer_learners rl on rl.company_id=a.company_id
    join public.quizzes q on q.id=a.quiz_id and q.manufacturer_id=manufacturer_id
    left join latest_retailer_quiz l on l.company_id=a.company_id and l.quiz_id=a.quiz_id and l.user_id=rl.user_id
    union all
    select 'manufacturer_team', 'Manufacturer team',tl.user_id,tl.email,'quiz',q.id,q.title,a.created_at,a.due_at,
      case when l.score is null then 0 else 100 end,l.score is not null,case when l.score is null then null else l.score>=q.passing_score end,l.score,l.submitted_at
    from public.manufacturer_quiz_assignments a cross join team_learners tl join public.quizzes q on q.id=a.quiz_id
    left join latest_team_quiz l on l.quiz_id=a.quiz_id and l.user_id=tl.user_id where a.manufacturer_id=manufacturer_id
    union all
    select 'retailer',lc.name,rl.user_id,rl.email,'course',c.id,c.title,a.created_at,a.due_at,
      case when coalesce(bc.total,0)=0 then 0 else round(coalesce(d.done,0)::numeric/bc.total*100)::int end,
      coalesce(bc.total,0)>0 and coalesce(d.done,0)>=bc.total,null,null,
      case when coalesce(bc.total,0)>0 and coalesce(d.done,0)>=bc.total then d.completed_at end
    from public.company_course_assignments a join linked_companies lc on lc.id=a.company_id join retailer_learners rl on rl.company_id=a.company_id
    join public.courses c on c.id=a.course_id and c.manufacturer_id=manufacturer_id left join block_counts bc on bc.course_id=c.id
    left join retailer_course_done d on d.company_id=a.company_id and d.course_id=c.id and d.user_id=rl.user_id
    union all
    select 'manufacturer_team','Manufacturer team',tl.user_id,tl.email,'course',c.id,c.title,a.created_at,a.due_at,
      case when coalesce(bc.total,0)=0 then 0 else round(coalesce(d.done,0)::numeric/bc.total*100)::int end,
      coalesce(bc.total,0)>0 and coalesce(d.done,0)>=bc.total,null,null,
      case when coalesce(bc.total,0)>0 and coalesce(d.done,0)>=bc.total then d.completed_at end
    from public.manufacturer_course_assignments a cross join team_learners tl join public.courses c on c.id=a.course_id
    left join block_counts bc on bc.course_id=c.id left join team_course_done d on d.course_id=c.id and d.user_id=tl.user_id
    where a.manufacturer_id=manufacturer_id
  ), enriched as (
    select *,case when completed then 'completed' when due_at<now() then 'overdue' when progress>0 then 'in_progress' else 'assigned' end status
    from assignment_rows
  )
  select jsonb_build_object(
    'assignments',coalesce((select jsonb_agg(to_jsonb(e) order by e.assigned_at desc,e.title,e.email) from enriched e),'[]'::jsonb),
    'summary',jsonb_build_object(
      'retailers',(select count(*) from linked_companies),'retailer_learners',(select count(*) from retailer_learners),
      'team_learners',(select count(*) from team_learners),'assigned',(select count(*) from enriched),
      'completed',(select count(*) from enriched where completed),'overdue',(select count(*) from enriched where status='overdue'),
      'completion_rate',coalesce((select round(count(*) filter(where completed)::numeric/nullif(count(*),0)*100)::int from enriched),0),
      'pass_rate',coalesce((select round(count(*) filter(where passed)::numeric/nullif(count(*) filter(where score is not null),0)*100)::int from enriched),0)
    )
  ) into report;
  return report;
end $function$;

revoke all on function public.manufacturer_training_report() from public;
grant execute on function public.manufacturer_training_report() to authenticated;
