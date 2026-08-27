-- For every nullable column that currently has a value, blank it out in one
-- row. That manufactures the exact condition rule 3 warns about: a database
-- where a later `SET NOT NULL` finds rows it cannot accept.
--
-- Schema-derived on purpose. A hand-written list of columns would rot the
-- first time a table changed; this adapts to whatever the previous release's
-- schema actually is, including tables that did not exist when it was written.
DO $$
DECLARE r record; n int; nulled int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN pg_class p ON p.relname = c.table_name
    JOIN pg_namespace ns ON ns.oid = p.relnamespace AND ns.nspname = 'public'
    WHERE c.table_schema = 'public' AND c.is_nullable = 'YES' AND p.relkind = 'r'
  LOOP
    BEGIN
      EXECUTE format(
        'UPDATE %I SET %I = NULL WHERE ctid = (SELECT ctid FROM %I WHERE %I IS NOT NULL LIMIT 1)',
        r.table_name, r.column_name, r.table_name, r.column_name);
      GET DIAGNOSTICS n = ROW_COUNT;
      nulled := nulled + n;
    EXCEPTION WHEN others THEN
      -- A CHECK or a partial index may forbid the null. That column simply
      -- cannot hold one, so there is nothing for a later migration to trip on.
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE 'dirty-data: nulled % value(s), skipped % column(s)', nulled, skipped;
END $$;
