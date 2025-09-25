-- Fix infinite recursion by creating security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop and recreate the problematic RLS policy
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
USING (
  (id = auth.uid()) OR 
  (public.get_current_user_role() = ANY(ARRAY['bd_admin'::text, 'admin'::text, 'superadmin'::text]))
);

-- Also ensure the profiles table has proper policies for INSERT
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Update the rpc_create_profile function to be more robust
CREATE OR REPLACE FUNCTION public.rpc_create_profile(_full_name text, _role text, _cluster text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  _user_id uuid;
  _user_email text;
BEGIN
  -- Get current user ID
  _user_id := auth.uid();
  
  -- If no user ID, raise an error
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create profile';
  END IF;
  
  -- Get user email from auth metadata
  SELECT email INTO _user_email 
  FROM auth.users 
  WHERE id = _user_id;
  
  -- Insert or update profile
  INSERT INTO profiles (id, full_name, email, role, cluster, created_at)
  VALUES (_user_id, _full_name, _user_email, _role, _cluster, now())
  ON CONFLICT (id) 
  DO UPDATE SET 
    full_name = excluded.full_name, 
    role = excluded.role, 
    cluster = excluded.cluster;
END;
$function$;