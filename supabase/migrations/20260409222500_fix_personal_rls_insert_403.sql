-- Fix 403 on INSERT into public.personal caused by strict/legacy RLS + static company_id default.
-- Keep tenant isolation by scoping access to the authenticated user's company.

-- Ensure company_id defaults to the current authenticated user's company.
ALTER TABLE public.personal
  ALTER COLUMN company_id SET DEFAULT public.current_user_company_id();

-- Replace legacy policy (admin-only + self-select against user_profiles)
-- with helper-function based policies to avoid brittle checks.
DROP POLICY IF EXISTS personal_admin ON public.personal;
DROP POLICY IF EXISTS personal_select ON public.personal;

CREATE POLICY personal_select
ON public.personal
FOR SELECT
USING (company_id = public.current_user_company_id());

CREATE POLICY personal_write
ON public.personal
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());
