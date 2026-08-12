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
    };
  };
}
