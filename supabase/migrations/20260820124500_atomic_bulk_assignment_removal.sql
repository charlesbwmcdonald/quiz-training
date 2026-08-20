create or replace function public.remove_training_assignments(targets jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $function$
declare
  item jsonb;
  removed_count integer := 0;
begin
  if jsonb_typeof(targets)<>'array' or jsonb_array_length(targets)=0
  then raise exception 'Choose at least one assignment'; end if;
  for item in select value from jsonb_array_elements(targets) loop
    perform public.remove_training_assignment(
      item->>'audienceType',
      (item->>'audienceId')::uuid,
      item->>'contentType',
      (item->>'contentId')::uuid
    );
    removed_count:=removed_count+1;
  end loop;
  return removed_count;
end;
$function$;

revoke all on function public.remove_training_assignments(jsonb) from public;
revoke execute on function public.remove_training_assignments(jsonb) from anon;
grant execute on function public.remove_training_assignments(jsonb) to authenticated;
