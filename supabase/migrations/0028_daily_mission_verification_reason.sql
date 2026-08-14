-- Post-audit P1 fix: Daily Mission never reacted to real project
-- verification blockers (failed tests/security/accessibility/performance/
-- AI-eval/deployment checks). Add the reason value so the mission can
-- surface a real, specific blocker instead of only course/module/exercise
-- state.
alter table public.daily_missions drop constraint daily_missions_reason_check;
alter table public.daily_missions add constraint daily_missions_reason_check
  check (reason in ('next_incomplete_module', 'unfinished_exercise', 'skill_gap_practice', 'catchup', 'capstone_progress', 'verification_blocker'));
