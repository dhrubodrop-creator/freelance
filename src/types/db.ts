export type UserRole = "student" | "admin";
export type CareerGoal = "freelance_income" | "career_switch" | "side_income";
export type EnrollmentStatus = "pending" | "active" | "cancelled" | "refunded";
export type SessionStatus = "scheduled" | "completed" | "cancelled";
export type SupportTicketStatus = "open" | "in_progress" | "resolved";

export interface UserRow {
  id: string;
  clerk_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  profile_completed: boolean;
  created_at: string;
}

export type WorkPreference = "full_time" | "contract" | "freelance" | "consulting" | "remote_only";

export interface ProfileRow {
  id: string;
  user_id: string;
  occupation: string | null;
  years_experience: number | null;
  industry: string | null;
  career_goal: CareerGoal | null;
  hours_per_week: number | null;
  cv_file_url: string | null;
  created_at: string;
  location: string | null;
  bio: string | null;
  preferred_language: string | null;
  income_goal_inr: number | null;
  work_preference: WorkPreference | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  website_url: string | null;
}

export interface WorkExperienceRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  achievements: string[];
  skills_used: string[];
  created_at: string;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface SkillCategoryRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface SkillRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserSkillRow {
  id: string;
  user_id: string;
  skill_id: string;
  self_level: SkillLevel;
  created_at: string;
}

export interface PortfolioItemRow {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  tools_used: string[];
  outcome: string | null;
  links: string[];
  architecture_note: string | null;
  created_at: string;
}

export interface PortfolioItemSkillRow {
  portfolio_item_id: string;
  skill_id: string;
}

export interface SuggestedMonetisationPath {
  name: string;
  reasoning: string;
  skillsPresent: string[];
  skillsNeeded: string[];
}

export interface MonetisationPlanRow {
  id: string;
  user_id: string;
  summary: string;
  suggested_paths: SuggestedMonetisationPath[];
  readiness_score: number;
  generated_at: string;
}

export interface MonetisationActionRow {
  id: string;
  plan_id: string;
  week_number: number;
  task: string;
  done: boolean;
  created_at: string;
}

export type SignalDirection = "rising" | "declining" | "stable";
export type SignalConfidence = "verified" | "estimated";

export interface MarketSignalRow {
  id: string;
  category_id: string;
  signal: string;
  direction: SignalDirection;
  source: string;
  source_url: string | null;
  confidence: SignalConfidence;
  region: string;
  observed_at: string;
  created_at: string;
}

export type OpportunityType = "job" | "freelance" | "consulting" | "training" | "partnership" | "business_lead";
export type OpportunitySource = "curated" | "partner_feed" | "external_api";

export interface OpportunityRow {
  id: string;
  title: string;
  type: OpportunityType;
  description: string | null;
  category_id: string | null;
  source: OpportunitySource;
  source_url: string | null;
  location: string | null;
  is_remote: boolean;
  compensation_range: string | null;
  posted_at: string;
  created_at: string;
}

export interface OpportunitySkillRow {
  opportunity_id: string;
  skill_id: string;
}

export interface OpportunityMatchRow {
  id: string;
  user_id: string;
  opportunity_id: string;
  match_score: number;
  computed_at: string;
}

export interface AnalyticsEventRow {
  id: string;
  user_id: string | null;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminAuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export type PlaybookSectionType =
  | "the_field"
  | "mental_models"
  | "decision_framework"
  | "workflow"
  | "failure_modes"
  | "debugging_playbook"
  | "checklist"
  | "template"
  | "resources";

export interface ModulePlaybookSectionRow {
  id: string;
  module_id: string;
  section_type: PlaybookSectionType;
  title: string;
  content: string;
  order_index: number;
  version: number;
  updated_at: string;
  created_at: string;
}

export type ExerciseLevel = "guided" | "semi_guided" | "independent" | "capstone";

export interface ExerciseRow {
  id: string;
  module_id: string;
  level: ExerciseLevel;
  title: string;
  problem_statement: string;
  starter_context: string | null;
  hints: string[];
  solution_notes: string | null;
  order_index: number;
  created_at: string;
}

export type InterviewQuestionCategory =
  | "fundamentals"
  | "applied"
  | "scenario"
  | "debugging"
  | "system_design"
  | "project_defence"
  | "behavioural";

export interface InterviewQuestionRow {
  id: string;
  module_id: string;
  category: InterviewQuestionCategory;
  question: string;
  what_is_tested: string;
  strong_answer_structure: string;
  weak_answer_example: string | null;
  follow_up_question: string | null;
  order_index: number;
  created_at: string;
}

export type DiagnosticExperienceLevel = "new" | "some_exposure" | "practiced" | "professional";
export type DiagnosticSkillRating = "unfamiliar" | "aware" | "practiced" | "confident";
export type ModuleGuidanceDepth = "review" | "full" | "foundation_plus_practice" | "advanced_challenge";

export interface ModuleGuidance {
  depth: ModuleGuidanceDepth;
  reason: string;
}

export interface PortfolioCaseStudyRow {
  id: string;
  portfolio_item_id: string;
  case_study: string;
  short_version: string;
  resume_bullets: string[];
  interview_story: string;
  approved: boolean;
  generated_at: string;
}

export interface ProjectDecisionRow {
  id: string;
  portfolio_item_id: string;
  decision: string;
  alternatives: string | null;
  reasoning: string;
  tradeoff: string | null;
  order_index: number;
  created_at: string;
}

export interface CourseCapstoneRow {
  id: string;
  course_id: string;
  title: string;
  brief: string;
  requirements: string[];
  scoring_dimensions: string[];
  created_at: string;
}

export type CapstoneSubmissionStatus =
  | "in_progress"
  | "awaiting_defence_answers"
  | "submitted_for_review"
  | "reviewed";

export interface CapstoneSubmissionRow {
  id: string;
  user_id: string;
  capstone_id: string;
  portfolio_item_id: string;
  status: CapstoneSubmissionStatus;
  created_at: string;
  updated_at: string;
}

export interface DefenceQuestion {
  question: string;
  probes: string;
}

export interface DefenceAnswer {
  question: string;
  answer: string;
}

export interface DimensionScore {
  score: number;
  note: string;
}

export interface CapstoneReviewRow {
  id: string;
  submission_id: string;
  defence_questions: DefenceQuestion[];
  defence_answers: DefenceAnswer[];
  dimension_scores: Record<string, DimensionScore>;
  overall_feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  missing: string[];
  improvements: string[];
  generated_at: string;
}

export interface ExerciseCompletionRow {
  id: string;
  user_id: string;
  exercise_id: string;
  completed_at: string;
}

export type MasteryLevel = "not_started" | "learning" | "practicing" | "demonstrated" | "strong";

export interface SkillMastery {
  skillId: string;
  level: MasteryLevel;
  evidence: {
    studied: boolean;
    practiced: boolean;
    project: boolean;
  };
}

export interface CourseDiagnosticRow {
  id: string;
  user_id: string;
  course_id: string;
  experience_level: DiagnosticExperienceLevel;
  confidence_rating: number;
  skill_ratings: Record<string, DiagnosticSkillRating>;
  module_guidance: Record<string, ModuleGuidance>;
  starting_point: string;
  created_at: string;
  updated_at: string;
}

export type DailyMissionStatus = "pending" | "in_progress" | "completed" | "skipped";
export type DailyMissionReason =
  | "next_incomplete_module"
  | "unfinished_exercise"
  | "skill_gap_practice"
  | "catchup"
  | "capstone_progress";

export interface DailyMissionRow {
  id: string;
  user_id: string;
  mission_date: string;
  course_id: string;
  module_id: string | null;
  exercise_id: string | null;
  objective: string;
  why_it_matters: string;
  estimated_minutes: number;
  acceptance_criteria: string[];
  status: DailyMissionStatus;
  reason: DailyMissionReason;
  generated_via: "deterministic" | "ai";
  completed_at: string | null;
  created_at: string;
}

export interface LearnerCheckpointRow {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string | null;
  active_tab: "overview" | "playbook" | "practice" | "interview" | null;
  exercise_id: string | null;
  video_position_seconds: number | null;
  updated_at: string;
}

export interface ConceptRescueRequestRow {
  id: string;
  user_id: string;
  module_id: string;
  exercise_id: string | null;
  question: string | null;
  simple_explanation: string;
  visual_example: string;
  analogy: string;
  code_example: string | null;
  five_minute_practice: string;
  created_at: string;
}

export interface CatchupWeekPlan {
  weekNumber: number;
  moduleTitles: string[];
  note: string;
}

export interface CatchupPlanRow {
  id: string;
  user_id: string;
  course_id: string;
  days_inactive: number;
  remaining_modules: number;
  recommended_weekly_minutes: number;
  weekly_plan: CatchupWeekPlan[];
  target_completion_date: string | null;
  generated_at: string;
}

export interface IdeaUserStory {
  role: string;
  want: string;
  soThat: string;
}

export interface IdeaMilestone {
  name: string;
  description: string;
}

export interface ProjectIdeaPlanRow {
  id: string;
  user_id: string;
  course_id: string | null;
  portfolio_item_id: string | null;
  idea: string;
  target_user: string;
  problem: string;
  desired_outcome: string;
  optional_features: string[];
  prd: string;
  user_stories: IdeaUserStory[];
  acceptance_criteria: string[];
  architecture_proposal: string;
  data_model: string;
  milestones: IdeaMilestone[];
  course_mapping: string | null;
  suggested_repo_name: string;
  readme_content: string;
  env_template: string;
  branch_strategy: string;
  approved: boolean;
  approved_at: string | null;
  created_at: string;
}

export interface ProjectCheckpointRow {
  id: string;
  portfolio_item_id: string;
  label: string;
  task: string | null;
  learner_note: string | null;
  commit_sha: string | null;
  state_snapshot: Record<string, unknown>;
  created_at: string;
}

export type VerificationCheckType =
  | "code_review"
  | "architecture_drift"
  | "test_generation"
  | "visual_qa"
  | "accessibility"
  | "security"
  | "performance"
  | "ai_evaluation"
  | "failure_replay";

export interface ProjectVerificationRunRow {
  id: string;
  user_id: string;
  portfolio_item_id: string | null;
  check_type: VerificationCheckType;
  input_summary: string;
  results: Record<string, unknown>;
  score: number | null;
  blockers: string[];
  created_at: string;
}

export type AcceptanceCheckType = "manual" | "http_200" | "http_auth_rejects" | "deployment_live";

export interface AcceptanceCheckRow {
  id: string;
  portfolio_item_id: string;
  description: string;
  check_type: AcceptanceCheckType;
  target_url: string | null;
  last_result: "pass" | "fail" | null;
  last_checked_at: string | null;
  self_attested: boolean;
  order_index: number;
  created_at: string;
}

export interface GitHubConnectionRow {
  id: string;
  user_id: string;
  github_username: string;
  access_token: string;
  scopes: string[];
  connected_at: string;
  updated_at: string;
}

export interface GitHubRepoLinkRow {
  id: string;
  portfolio_item_id: string;
  user_id: string;
  repo_full_name: string;
  default_branch: string;
  connected_at: string;
}

export type GitHubEventType = "push" | "pull_request" | "workflow_run" | "deployment_status";

export interface GitHubEventRow {
  id: string;
  user_id: string;
  repo_full_name: string;
  event_type: GitHubEventType;
  summary: string;
  meaningful: boolean;
  external_id: string | null;
  received_at: string;
}

export interface ModuleSkillRow {
  module_id: string;
  skill_id: string;
}

export interface EducationRow {
  id: string;
  user_id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface LeadRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  created_at: string;
}

export interface CourseRow {
  id: string;
  slug: string;
  title: string;
  price: number;
  description: string | null;
  track: string | null;
  created_at: string;
}

export interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  order_index: number;
  created_at: string;
  topics: string[];
  build_deliverable: string | null;
  outcome: string | null;
  video_source_label: string | null;
}

export interface RecommendationRow {
  id: string;
  user_id: string;
  course_id: string | null;
  rationale: string | null;
  created_at: string;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  payment_id: string | null;
  status: EnrollmentStatus;
  created_at: string;
}

export interface ProgressRow {
  id: string;
  user_id: string;
  module_id: string;
  completed_at: string | null;
}

export interface TemplateRow {
  id: string;
  module_id: string;
  file_url: string;
  title: string;
}

export interface PlaybookRow {
  id: string;
  course_id: string;
  file_url: string;
  title: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  calendly_event_id: string | null;
  scheduled_at: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface CaseStudyRow {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
}

export interface SupportTicketRow {
  id: string;
  user_id: string;
  message: string;
  status: SupportTicketStatus;
  created_at: string;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface ContentChunkRow {
  id: string;
  course_id: string | null;
  module_id: string | null;
  source_type: "transcript" | "playbook" | "template" | "faq";
  content: string;
  created_at: string;
}

export interface MentorMessageRow {
  id: string;
  user_id: string;
  course_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: Partial<UserRow>; Update: Partial<UserRow> };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      leads: { Row: LeadRow; Insert: Partial<LeadRow>; Update: Partial<LeadRow> };
      courses: { Row: CourseRow; Insert: Partial<CourseRow>; Update: Partial<CourseRow> };
      modules: { Row: ModuleRow; Insert: Partial<ModuleRow>; Update: Partial<ModuleRow> };
      recommendations: {
        Row: RecommendationRow;
        Insert: Partial<RecommendationRow>;
        Update: Partial<RecommendationRow>;
      };
      enrollments: { Row: EnrollmentRow; Insert: Partial<EnrollmentRow>; Update: Partial<EnrollmentRow> };
      progress: { Row: ProgressRow; Insert: Partial<ProgressRow>; Update: Partial<ProgressRow> };
      templates: { Row: TemplateRow; Insert: Partial<TemplateRow>; Update: Partial<TemplateRow> };
      playbooks: { Row: PlaybookRow; Insert: Partial<PlaybookRow>; Update: Partial<PlaybookRow> };
      sessions: { Row: SessionRow; Insert: Partial<SessionRow>; Update: Partial<SessionRow> };
      case_studies: { Row: CaseStudyRow; Insert: Partial<CaseStudyRow>; Update: Partial<CaseStudyRow> };
      support_tickets: {
        Row: SupportTicketRow;
        Insert: Partial<SupportTicketRow>;
        Update: Partial<SupportTicketRow>;
      };
      announcements: { Row: AnnouncementRow; Insert: Partial<AnnouncementRow>; Update: Partial<AnnouncementRow> };
      content_chunks: { Row: ContentChunkRow; Insert: Partial<ContentChunkRow>; Update: Partial<ContentChunkRow> };
      mentor_messages: { Row: MentorMessageRow; Insert: Partial<MentorMessageRow>; Update: Partial<MentorMessageRow> };
      work_experiences: {
        Row: WorkExperienceRow;
        Insert: Partial<WorkExperienceRow>;
        Update: Partial<WorkExperienceRow>;
      };
      education: { Row: EducationRow; Insert: Partial<EducationRow>; Update: Partial<EducationRow> };
      skill_categories: {
        Row: SkillCategoryRow;
        Insert: Partial<SkillCategoryRow>;
        Update: Partial<SkillCategoryRow>;
      };
      skills: { Row: SkillRow; Insert: Partial<SkillRow>; Update: Partial<SkillRow> };
      user_skills: { Row: UserSkillRow; Insert: Partial<UserSkillRow>; Update: Partial<UserSkillRow> };
      portfolio_items: {
        Row: PortfolioItemRow;
        Insert: Partial<PortfolioItemRow>;
        Update: Partial<PortfolioItemRow>;
      };
      portfolio_item_skills: {
        Row: PortfolioItemSkillRow;
        Insert: Partial<PortfolioItemSkillRow>;
        Update: Partial<PortfolioItemSkillRow>;
      };
      monetisation_plans: {
        Row: MonetisationPlanRow;
        Insert: Partial<MonetisationPlanRow>;
        Update: Partial<MonetisationPlanRow>;
      };
      monetisation_actions: {
        Row: MonetisationActionRow;
        Insert: Partial<MonetisationActionRow>;
        Update: Partial<MonetisationActionRow>;
      };
      market_signals: {
        Row: MarketSignalRow;
        Insert: Partial<MarketSignalRow>;
        Update: Partial<MarketSignalRow>;
      };
      opportunities: { Row: OpportunityRow; Insert: Partial<OpportunityRow>; Update: Partial<OpportunityRow> };
      opportunity_skills: {
        Row: OpportunitySkillRow;
        Insert: Partial<OpportunitySkillRow>;
        Update: Partial<OpportunitySkillRow>;
      };
      opportunity_matches: {
        Row: OpportunityMatchRow;
        Insert: Partial<OpportunityMatchRow>;
        Update: Partial<OpportunityMatchRow>;
      };
      analytics_events: {
        Row: AnalyticsEventRow;
        Insert: Partial<AnalyticsEventRow>;
        Update: Partial<AnalyticsEventRow>;
      };
      admin_audit_logs: {
        Row: AdminAuditLogRow;
        Insert: Partial<AdminAuditLogRow>;
        Update: Partial<AdminAuditLogRow>;
      };
      notifications: { Row: NotificationRow; Insert: Partial<NotificationRow>; Update: Partial<NotificationRow> };
      module_playbook_sections: {
        Row: ModulePlaybookSectionRow;
        Insert: Partial<ModulePlaybookSectionRow>;
        Update: Partial<ModulePlaybookSectionRow>;
      };
      exercises: { Row: ExerciseRow; Insert: Partial<ExerciseRow>; Update: Partial<ExerciseRow> };
      interview_questions: {
        Row: InterviewQuestionRow;
        Insert: Partial<InterviewQuestionRow>;
        Update: Partial<InterviewQuestionRow>;
      };
      module_skills: { Row: ModuleSkillRow; Insert: Partial<ModuleSkillRow>; Update: Partial<ModuleSkillRow> };
      course_diagnostics: {
        Row: CourseDiagnosticRow;
        Insert: Partial<CourseDiagnosticRow>;
        Update: Partial<CourseDiagnosticRow>;
      };
      exercise_completions: {
        Row: ExerciseCompletionRow;
        Insert: Partial<ExerciseCompletionRow>;
        Update: Partial<ExerciseCompletionRow>;
      };
      project_decisions: {
        Row: ProjectDecisionRow;
        Insert: Partial<ProjectDecisionRow>;
        Update: Partial<ProjectDecisionRow>;
      };
      course_capstones: {
        Row: CourseCapstoneRow;
        Insert: Partial<CourseCapstoneRow>;
        Update: Partial<CourseCapstoneRow>;
      };
      capstone_submissions: {
        Row: CapstoneSubmissionRow;
        Insert: Partial<CapstoneSubmissionRow>;
        Update: Partial<CapstoneSubmissionRow>;
      };
      capstone_reviews: {
        Row: CapstoneReviewRow;
        Insert: Partial<CapstoneReviewRow>;
        Update: Partial<CapstoneReviewRow>;
      };
      portfolio_case_studies: {
        Row: PortfolioCaseStudyRow;
        Insert: Partial<PortfolioCaseStudyRow>;
        Update: Partial<PortfolioCaseStudyRow>;
      };
      daily_missions: { Row: DailyMissionRow; Insert: Partial<DailyMissionRow>; Update: Partial<DailyMissionRow> };
      learner_checkpoints: {
        Row: LearnerCheckpointRow;
        Insert: Partial<LearnerCheckpointRow>;
        Update: Partial<LearnerCheckpointRow>;
      };
      concept_rescue_requests: {
        Row: ConceptRescueRequestRow;
        Insert: Partial<ConceptRescueRequestRow>;
        Update: Partial<ConceptRescueRequestRow>;
      };
      catchup_plans: { Row: CatchupPlanRow; Insert: Partial<CatchupPlanRow>; Update: Partial<CatchupPlanRow> };
      project_idea_plans: {
        Row: ProjectIdeaPlanRow;
        Insert: Partial<ProjectIdeaPlanRow>;
        Update: Partial<ProjectIdeaPlanRow>;
      };
      project_checkpoints: {
        Row: ProjectCheckpointRow;
        Insert: Partial<ProjectCheckpointRow>;
        Update: Partial<ProjectCheckpointRow>;
      };
      github_connections: {
        Row: GitHubConnectionRow;
        Insert: Partial<GitHubConnectionRow>;
        Update: Partial<GitHubConnectionRow>;
      };
      github_repo_links: {
        Row: GitHubRepoLinkRow;
        Insert: Partial<GitHubRepoLinkRow>;
        Update: Partial<GitHubRepoLinkRow>;
      };
      github_events: { Row: GitHubEventRow; Insert: Partial<GitHubEventRow>; Update: Partial<GitHubEventRow> };
      project_verification_runs: {
        Row: ProjectVerificationRunRow;
        Insert: Partial<ProjectVerificationRunRow>;
        Update: Partial<ProjectVerificationRunRow>;
      };
      acceptance_checks: {
        Row: AcceptanceCheckRow;
        Insert: Partial<AcceptanceCheckRow>;
        Update: Partial<AcceptanceCheckRow>;
      };
    };
  };
}
