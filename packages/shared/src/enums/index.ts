export enum ReferralStatus {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
  Declined = 'declined',
}

export enum ParticipantStatus {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive',
  Completed = 'completed',
}

export enum AssessmentType {
  CurrentWorkProfile = 'current_work_profile',
  WorkstyleStrengths = 'workstyle_strengths',
  SupportNeeds       = 'support_needs',
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PlanStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
}

export enum MatchStatus {
  Interested = 'interested',
  Applied = 'applied',
  Interviewing = 'interviewing',
  Offered = 'offered',
}

export enum MatchOutcome {
  Hired = 'hired',
  NotHired = 'not_hired',
  InTraining = 'in_training',
  Withdrawn = 'withdrawn',
}

export enum DataZone {
  Protected = 'protected',
  Application = 'application',
}

export enum OwnerType {
  Staff = 'staff',
  Participant = 'participant',
}

export enum VerticalTemplate {
  General = 'general',
  TsrgWorkforce = 'tsrg_workforce',
  Youth = 'youth',
  Housing = 'housing',
}

export enum TraineeReadiness {
  Yes = 'yes',
  Limited = 'limited',
  No = 'no',
}
export enum ServiceType {
  ApplicationAssistance = 'application_assistance',
  BenefitsCounseling = 'benefits_counseling',
  CareerCoaching = 'career_coaching',
  CaseManagement = 'case_management',
  ChildcareAssistance = 'childcare_assistance',
  DigitalLiteracyTraining = 'digital_literacy_training',
  EducationalAdvising = 'educational_advising',
  EmployerEngagementActivity = 'employer_engagement_activity',
  FinancialLiteracyTraining = 'financial_literacy_training',
  InterviewPreparation = 'interview_preparation',
  IpsServices = 'ips_services',
  JobReadinessTraining = 'job_readiness_training',
  JobSearchAssistance = 'job_search_assistance',
  PeerSupport = 'peer_support',
  RecoverySupport = 'recovery_support',
  ReferralToHousing = 'referral_to_housing',
  ReferralToLegalSupport = 'referral_to_legal_support',
  ReferralToTreatment = 'referral_to_treatment',
  ResumeAssistance = 'resume_assistance',
  SupportedEmployment = 'supported_employment',
  TransportationAssistance = 'transportation_assistance',
  WorkClothingEquipmentSupport = 'work_clothing_equipment_support',
  NextStepRecommended = 'next_step_recommended',
}

export enum ServiceLocation {
  Office = 'office',
  Field = 'field',
  PartnerSite = 'partner_site',
  Home = 'home',
  Other = 'other',
}

export enum ServiceDeliveryMode {
  InPerson = 'in_person',
  Virtual = 'virtual',
  Phone = 'phone',
}

export enum ServiceFormat {
  Individual = 'individual',
  Group = 'group',
}

export enum RecoveryStatus {
  InRecovery = 'in_recovery',
  NotStarted = 'not_started',
  Relapsed = 'relapsed',
  Unknown = 'unknown',
}

export enum RecoveryStage {
  Early = 'early',
  Middle = 'middle',
  Late = 'late',
  Maintenance = 'maintenance',
  PreContemplation = 'pre_contemplation',
  Contemplation = 'contemplation',
  Preparation = 'preparation',
  Action = 'action',
}

export enum BenefitsCounselingType {
  SocialSecurity = 'social_security',
  Medicaid = 'medicaid',
  Snap = 'snap',
  Tanf = 'tanf',
  HousingSubsidy = 'housing_subsidy',
  Other = 'other',
}

export enum CareerCoachingType {
  CareerExploration = 'career_exploration',
  GoalSetting = 'goal_setting',
  JobSearchStrategy = 'job_search_strategy',
  LaborMarketInfo = 'labor_market_info',
  Other = 'other',
}

export enum CaseManagementType {
  Intake = 'intake',
  ServicePlanning = 'service_planning',
  ReferralLinkage = 'referral_linkage',
  Monitoring = 'monitoring',
  Other = 'other',
}

export enum InterviewPreparationType {
  MockInterview = 'mock_interview',
  ElevatorPitch = 'elevator_pitch',
  AsweringToughQuestions = 'answering_tough_questions',
  Other = 'other',
}

export enum JobSearchAssistanceType {
  JobLeads = 'job_leads',
  ApplicationHelp = 'application_help',
  EmployerFollowUp = 'employer_follow_up',
  Other = 'other',
}
