-- Outcome Engine Phase 1: "My Outcome" — a richer, ongoing goal than the
-- one-time onboarding career_goal enum (freelance_income/career_switch/
-- side_income, still used for initial course recommendation). This is a
-- separate, app-level-validated text column on the SAME profiles table
-- (not a new table) since it's genuinely a different concept: an ongoing,
-- learner-editable outcome that drives Next Best Move / Make Me Ready /
-- opportunity relevance, not a one-time onboarding input.
alter table public.profiles add column outcome_goal text;
alter table public.profiles add column outcome_goal_custom text;
