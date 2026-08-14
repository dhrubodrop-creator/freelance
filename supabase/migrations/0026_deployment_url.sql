-- Phase 14: Project Health Dashboard / Production Readiness / Make Me
-- Production Ready need a stored deployment URL so a one-click scan
-- doesn't have to re-ask the learner every time. Everything else this
-- phase needs (build/test/security/accessibility/performance/ai-quality/
-- deployment signals) already exists in project_verification_runs and
-- acceptance_checks from earlier migrations.
alter table public.portfolio_items add column deployment_url text;
