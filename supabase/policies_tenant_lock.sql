-- =============================================================================
-- TENANT LOCK: Activate real multi-tenant isolation
-- STATUS: DO NOT EXECUTE — reference file for FUTURE activation
--
-- PREREQUISITE: Verify ALL rows have company_id NOT NULL before running:
--   SELECT table_name, count(*) as null_rows
--   FROM information_schema.columns c
--   JOIN LATERAL (
--     SELECT count(*) FROM public.<table> WHERE company_id IS NULL
--   ) ON true
--   WHERE c.column_name = 'company_id' AND c.table_schema = 'public';
--
-- TO ACTIVATE: Copy desired blocks to a new migration file and execute.
-- TO ROLLBACK: Re-create _pilot_open policies (see multi_tenant_pilot.sql)
-- =============================================================================

-- Template for EACH operational table:
-- Replace {TABLE} with actual table name

/*
-- Step 1: Drop pilot policy
DROP POLICY IF EXISTS {TABLE}_pilot_open ON public.{TABLE};

-- Step 2: Create tenant-scoped policies
CREATE POLICY {TABLE}_tenant_select ON public.{TABLE}
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY {TABLE}_tenant_insert ON public.{TABLE}
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY {TABLE}_tenant_update ON public.{TABLE}
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id());

-- Delete restricted to encargado+
CREATE POLICY {TABLE}_tenant_delete ON public.{TABLE}
  FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id() AND public.user_has_role('encargado'));
*/
