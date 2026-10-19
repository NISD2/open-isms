-- The NIS2 to ISO/IEC 27001 links are rebuilt from ENISA's mapping table v1.2
-- (packages/grc-data-model/src/mappings/enisa-iso27001.ts). The framework syncs only insert and
-- update, so the 31 hand-written overlaps ENISA does not list are removed here. An overlap credits
-- nothing, so no sign-off, status or history row rests on any of them.
DELETE FROM "requirement_satisfaction" AS rs
USING "requirement" AS a, "requirement" AS b
WHERE rs."requirement_a_id" = a."id"
  AND rs."requirement_b_id" = b."id"
  AND rs."equivalence_kind" = 'overlapping'
  AND (a."code", b."code") IN (VALUES
    ('IS-5.1', '1.4'), ('IS-5.2', '1.2'), ('A.5.1', '1.2'), ('A.5.31', '1.2'), ('A.5.31', '12.1'),
    ('A.8.1', '2.2'), ('A.8.10', '2.2'), ('A.5.12', '2.3'), ('A.5.13', '2.3'), ('A.8.14', '4.3'),
    ('A.8.6', '4.5'), ('A.5.22', '5.3'), ('A.5.22', '5.4'), ('A.5.23', '5.2'), ('A.5.7', '6.2'),
    ('A.5.5', '6.2'), ('A.8.25', '6.5'), ('A.8.29', '6.5'), ('A.8.31', '6.5'), ('A.5.36', '7.1'),
    ('A.6.3', '8.1'), ('A.5.10', '8.1'), ('A.8.5', '9.2'), ('A.8.3', '9.2'), ('A.5.17', '10.2'),
    ('A.8.2', '11.1'), ('A.5.16', '11.2'), ('A.5.14', '11.2'), ('A.8.20', '11.2'), ('A.8.21', '11.2'),
    ('A.8.22', '11.2')
  );
