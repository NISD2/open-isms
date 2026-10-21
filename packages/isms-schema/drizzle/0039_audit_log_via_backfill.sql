-- Marks the rows assistants wrote before audit_log.via existed. Their user agent carries the
-- prefix lib/mcp/agent.ts gives every key's calls; a browser's user agent that starts the same way
-- is stored behind "browser: ", so the prefix comes only from a key. Rows whose user agent erasure
-- has already cleared cannot be told apart and stay "app".
UPDATE "audit_log" SET "via" = 'mcp' WHERE "user_agent" LIKE 'mcp: %';
