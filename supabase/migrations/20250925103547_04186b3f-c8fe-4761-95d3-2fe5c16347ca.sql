-- Fix search_path for existing functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_bulk_assign(p_lead_ids integer[], p_assignee uuid, p_note text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into assignments (lead_id, assignee_id, assigned_by, assigned_at, note)
  select id, p_assignee, auth.uid(), now(), p_note from unnest(p_lead_ids) as id;
  update leads set status = 'assigned', pipeline_stage = 'Lead Qualification' where id = any(p_lead_ids);
end;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_add_activity(p_lead_id integer, p_activity_type text, p_content text, p_next_steps text)
RETURNS TABLE(id integer, lead_id integer, actor_id uuid, activity_type text, content text, next_steps text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_actor uuid := auth.uid();
begin
  insert into activities (lead_id, actor_id, activity_type, content, next_steps)
  values (p_lead_id, v_actor, p_activity_type, p_content, p_next_steps)
  returning activities.id, activities.lead_id, activities.actor_id, activities.activity_type, activities.content, activities.next_steps, activities.created_at
  into rpc_add_activity.id, rpc_add_activity.lead_id, rpc_add_activity.actor_id, rpc_add_activity.activity_type, rpc_add_activity.content, rpc_add_activity.next_steps, rpc_add_activity.created_at;
  return next;
end;
$function$;

-- Add RLS policies for tables that are missing them
-- Add policies for clusters table
CREATE POLICY "clusters_select_all"
ON public.clusters
FOR SELECT
USING (true);

-- Add policies for pipeline_stages table  
CREATE POLICY "pipeline_stages_select_all"
ON public.pipeline_stages
FOR SELECT
USING (true);