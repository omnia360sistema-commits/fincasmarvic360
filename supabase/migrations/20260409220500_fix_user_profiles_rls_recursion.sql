-- Fix RLS infinite recursion on public.user_profiles.
-- Previous policies queried public.user_profiles inside their own USING clauses,
-- which can trigger "infinite recursion detected in policy" errors.

-- Helper functions executed as postgres (SECURITY DEFINER) to avoid RLS recursion.
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.company_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
    AND up.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND up.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS profiles_admin_all ON public.user_profiles;
DROP POLICY IF EXISTS profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS profiles_own_select ON public.user_profiles;

-- Read access: users can read profiles from their own company.
CREATE POLICY profiles_select
ON public.user_profiles
FOR SELECT
USING (company_id = public.current_user_company_id());

-- Write/admin access: admin users can manage profiles in their own company.
CREATE POLICY profiles_admin_all
ON public.user_profiles
FOR ALL
USING (
  public.current_user_is_admin()
  AND company_id = public.current_user_company_id()
)
WITH CHECK (
  public.current_user_is_admin()
  AND company_id = public.current_user_company_id()
);
