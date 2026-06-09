-- 019_secure_os_knowledge.sql
-- Security fix: public.os_knowledge had RLS disabled AND full anon/authenticated
-- table grants (SELECT/INSERT/UPDATE/DELETE/TRUNCATE). This table is the Mindmaker OS
-- fleet knowledge base (revenue/BD/org context written by service_role n8n agents and
-- the context-archiver). It is referenced by no client code. Anyone holding the public
-- anon key could read internal business context or wipe the table.
--
-- Fix: enable RLS (no policies -> only service_role, which bypasses RLS, retains access)
-- and revoke the erroneous anon/authenticated grants. Idempotent.

alter table public.os_knowledge enable row level security;

revoke all on public.os_knowledge from anon;
revoke all on public.os_knowledge from authenticated;
