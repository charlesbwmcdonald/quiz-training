do $migration$
declare
  definition text;
begin
  select pg_get_functiondef(
    'public.save_manufacturer_product_v2(uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,text,jsonb,jsonb,text,text,boolean,uuid,text,jsonb)'::regprocedure
  ) into definition;

  if position('#variable_conflict use_variable' in definition) = 0 then
    execute replace(
      definition,
      'AS $function$' || chr(10),
      'AS $function$' || chr(10) || '#variable_conflict use_variable' || chr(10)
    );
  end if;
end
$migration$;
