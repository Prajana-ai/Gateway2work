'use client';

import { useState, Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, type Column } from '@/components/data-table';
import { EnrollmentList } from '@/components/EnrollmentList';
import { EnrollmentForm } from '@/components/EnrollmentForm';
import { TrainingList } from '@/components/TrainingList';
import { TrainingForm } from '@/components/TrainingForm';
import { FollowUpList } from '@/components/FollowUpList';
import { FollowUpForm } from '@/components/FollowUpForm';
import { useFollowUps } from '@/hooks/use-follow-ups';
import { EmploymentOutcomeList } from '@/components/EmploymentOutcomeList';
import { EmploymentOutcomeForm } from '@/components/EmploymentOutcomeForm';
import { useEmploymentOutcomes } from '@/hooks/use-employment-outcomes';
import { useDischarges } from '@/hooks/use-discharges';
import { TrainingDto } from '@impactforge/shared';
import { ParticipantEditForm } from '@/components/ParticipantEditForm';
import { EncounterForm } from '@/components/EncounterForm';
import { DischargeForm } from '@/components/DischargeForm';
import { AssessmentIntelligencePanel } from '@/components/assessments/AssessmentIntelligencePanel';
import { AssessmentResults } from '@/components/assessments/assessment-results';
import { WorkforcePlanGenerator } from '@/components/workforce-plan/WorkforcePlanGenerator';

/* ------------------------------------------------------------------ */
/* Types & Interfaces                                                  */
/* ------------------------------------------------------------------ */

interface Participant360 {
  participant: {
    id: string;
    participant_id: string | null;
    demographics: {
      first_name: string;
      last_name: string;
      preferred_name?: string;
      date_of_birth: string;
      primary_language?: string;
      email: string;
      phone: string;
      preferred_contact_method?: string;
      address: string;
      city?: string;
      county?: string;
      zip_code?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      
      // Category 3
      gender?: string;
      pronouns?: string;
      race?: string;
      ethnicity?: string;
      veteran_status?: string;
      disability_status?: string;
      citizenship_status?: string;
      household_size?: number;
      dependents_count?: number;
      parenting_status?: string;
      marital_status?: string;
    };
    legal_info: {
      consent_signed?: boolean;
      consent_date?: string;
      roi_signed?: boolean;
      roi_expiration_date?: string;
      staff_assigned?: string;
      case_manager_assigned?: string;
    };
    socioeconomic: {
      housing_status_at_intake?: string;
      residence_type?: string;
      transportation_access?: string;
      needs_drivers_license?: boolean;
      internet_access?: string;
      device_access?: string;
    };
    status: string;
    consent_42cfr: boolean;
    consent_expires_at: string;
    referral_source: string;
    external_ehr_id: string;
    created_at: string;
    updated_at: string;
  };
  timeline: TimelineEvent[];
  assessments: Assessment[];
  workforcePlan: WorkforcePlan | null;
  encounters: Encounter[];
  matches: EmployerMatch[];
  enrollments?: Enrollment[];
  referrals: Array<{ id: string; participant_id: string; referral_status: string }>;
  }

interface Enrollment {
  id: string;
  participant_id: string;
  referral_id?: string | null;
  program_enrolled_in?: string | null;
  enrollment_date?: string | null;
  intake_completion_date?: string | null;
  eligibility_determination?: string | null;
  eligibility_date?: string | null;
  reason_not_eligible?: string | null;
  cohort_number?: string | null;
  funding_source_tied_to_participant?: string | null;
  recruitment_source?: string | null;
  assessment_date?: string | null;
  ips_participant_established_date?: string | null;
  case_management_established_participant_date?: string | null;
  status?: string | null; // Assuming status might be present
}


interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  [key: string]: unknown;
}

interface Assessment {
  id: string;
  assessment_type: string;
  completed_at: string;
  computed_summary: any;
  [key: string]: unknown;
}

interface WorkforcePlan {
  id: string;
  status: string;
  goals: PlanGoal[];
  tasks: PlanTask[];
}

interface PlanGoal {
  id: string;
  description: string;
  targetDate: string;
  status: string;
}

interface PlanTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Encounter {
  id: string;
  type: string;
  date: string;
  provider: string;
  notes: string;
  [key: string]: unknown;
}

interface EmployerMatch {
  id: string;
  employerName: string;
  position: string;
  status: string;
  matchedAt: string;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Tab definitions                                                     */
/* ------------------------------------------------------------------ */

// Added 'enrollments' tab
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'workforce', label: 'Workforce Plan' },
  { key: 'encounters', label: 'Encounters' },
  { key: 'matches', label: 'Matches' },
  { key: 'enrollments', label: 'Enrollments' },
  { key: 'follow-ups', label: 'Follow-Up' },
  { key: 'employment-outcomes', label: 'Employment Outcomes' },
  { key: 'discharges', label: 'Exit & Discharge' },
  ] as const;

type TabKey = (typeof tabs)[number]['key'];

/* ------------------------------------------------------------------ */
/* Main Component Wrapper with Suspense                                */
/* ------------------------------------------------------------------ */

export default function ParticipantDetailPage() {
  return (
    <Suspense fallback={<div className="animate-pulse py-12 text-center">Loading participant data...</div>}>
      <ParticipantDetailContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/* Content Component                                                   */
/* ------------------------------------------------------------------ */

const ASSESSMENT_DISPLAY_NAMES: Record<string, string> = {
  current_work_profile: 'Current Work Profile',
  workstyle_strengths:  'Workstyle Strengths',
  support_needs:        'Support Needs',
};

const formatLabel = (s: string) => s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '--';
const formatAssessmentType = (type: string) => ASSESSMENT_DISPLAY_NAMES[type] ?? formatLabel(type);

// Helper to format date string without timezone shift
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { timeZone: 'UTC' });
  } catch {
    return '--';
  }
};

function ParticipantDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { followUps, createFollowUp, isCreating } = useFollowUps(id);
  const { outcomes, createOutcome, isCreating: isSavingOutcome } = useEmploymentOutcomes(id);
  const { discharges, createDischarge, isCreating: isDischarging, refetch: refetchDischarges } = useDischarges(id);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showSuccess, setShowSuccess] = useState(searchParams.get('created') === 'true');
  const [successMessage, setSuccessMessage] = useState('Participant record created successfully.');
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [activeReferralId, setActiveReferralId] = useState<string | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isEmploymentModalOpen, setIsEmploymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Partial<Enrollment> | undefined>(undefined);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Partial<TrainingDto> | undefined>(undefined);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ email: string; temporaryPassword: string; message: string } | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const provisionMutation = useApiMutation<{ success: boolean; email: string; temporaryPassword: string; message: string }>(
    `/participants/${id}/provision-login`,
    'post',
    {
      onSuccess: (res: any) => {
        setProvisionResult(res);
        setProvisionError(null);
      },
      onError: (err: any) => {
        setProvisionError(err?.message || 'Failed to provision login credentials.');
      },
    },
  );

  // Fetch participant data and enrollments
  const { data, isLoading, isError, refetch } = useApiQuery<Participant360>(
    ['participant-360', id],
    `/participants/${id}/360`,
  );

  // Function to handle successful enrollment submission
  const handleEnrollmentSubmitSuccess = () => {
    setIsEnrollmentModalOpen(false); // Close modal
    setEditingEnrollment(undefined); // Clear editing state
    setSuccessMessage('Enrollment record created successfully.');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000); // Auto-hide after 5s
    refetch(); // Refetch participant data to show updated enrollments
  };

  const handleCloseEnrollmentModal = () => {
    setIsEnrollmentModalOpen(false);
    setEditingEnrollment(undefined); // Clear editing state
  };

  const handleOpenAddEnrollmentModal = () => {
    setEditingEnrollment(undefined); // Ensure no data is pre-filled for editing
    // Find active referral
    const active = data?.referrals?.find(r => r.referral_status !== 'completed');
    setActiveReferralId(active?.id || null);
    setIsEnrollmentModalOpen(true);
  };

  const handleTrainingSubmitSuccess = () => {
    setIsTrainingModalOpen(false);
    setEditingTraining(undefined);
    refetch();
  };

  const handleOpenAddTrainingModal = () => {
    setEditingTraining(undefined);
    setIsTrainingModalOpen(true);
  };

  const handleEditTraining = (training: TrainingDto) => {
    setEditingTraining(training);
    setIsTrainingModalOpen(true);
  };
  
  // This might need refinement if the API endpoint needs to be explicitly for enrollments
  // For now, assuming the /participants/:id/360 endpoint returns enrollments if available.
  // If not, a separate useApiQuery for enrollments might be needed.
  const enrollments = data?.participant ? data.enrollments : [];

  /* Loading state */
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-14 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 rounded-xl bg-slate-100" />
          <div className="h-96 rounded-xl bg-slate-100" />
          <div className="h-96 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Failed to load profile</h2>
        <p className="text-slate-500 mt-1">There was an error retrieving the participant data.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/participants')}
            className="btn-secondary"
          >
            Back to participants
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.participant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Participant not found.</p>
        <button
          type="button"
          onClick={() => router.push('/participants')}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Back to participants
        </button>
      </div>
    );
  }

  const { participant, timeline, assessments, workforcePlan, encounters, matches } = data;
  
  // Ensure nested objects exist to prevent crashes
  const safeParticipant = {
    ...(participant || {}),
    demographics: participant?.demographics || {},
    legal_info: participant?.legal_info || {},
    socioeconomic: participant?.socioeconomic || {},
  };

  // Calculate Age at Intake
  const calculateAgeAtIntake = () => {
    if (!safeParticipant.demographics?.date_of_birth || !safeParticipant.created_at) return null;
    
    const birthDate = new Date(safeParticipant.demographics.date_of_birth);
    const intakeDate = new Date(safeParticipant.created_at);
    
    let age = intakeDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = intakeDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && intakeDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const ageAtIntake = calculateAgeAtIntake();

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Success Notification */}
      {showSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
              <p className="text-xs text-emerald-700">The record for {safeParticipant.demographics?.first_name} {safeParticipant.demographics?.last_name} has been established.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setShowSuccess(false);
              // Clean up URL
              const url = new URL(window.location.href);
              url.searchParams.delete('created');
              window.history.replaceState({}, '', url);
            }}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Back & Actions */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/participants')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Participants
        </button>
      </div>

      {/* ---------- Tab Navigation ---------- */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-8 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ---------- Tab Content ---------- */}

      {/* Overview - 3 Pane Layout */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Pane 1: Identity & Key Info (3/12) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card text-left">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 shadow-inner">
                {safeParticipant.demographics?.first_name?.charAt(0)}
                {safeParticipant.demographics?.last_name?.charAt(0)}
              </div>
              <div className="flex items-start justify-between">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {safeParticipant.demographics?.first_name} {safeParticipant.demographics?.last_name}
                </h1>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      setProvisionResult(null);
                      setProvisionError(null);
                      setIsProvisionModalOpen(true);
                    }}
                    className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all shadow-sm group"
                    title="Provision / Reset Login Credentials"
                  >
                    <svg className="h-5 w-5 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 11-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-full transition-all shadow-sm group"
                    title="Edit Profile"
                  >
                    <svg className="h-5 w-5 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                </div>
              </div>
              {safeParticipant.demographics?.preferred_name && (
                <p className="text-sm text-slate-500 italic">"{safeParticipant.demographics.preferred_name}"</p>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2">
                 <StatusBadge status={safeParticipant.status} />
                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${safeParticipant.consent_42cfr ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                    {safeParticipant.consent_42cfr ? 'CONSENTED' : 'NO CONSENT'}
                 </span>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participant ID</label>
                 <p className="text-sm font-mono font-bold text-blue-700 mt-0.5">{safeParticipant.participant_id || '--'}</p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Information</h3>
              <dl className="space-y-4">
                <div className="flex items-start gap-3">
                   <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                   <div className="min-w-0 flex-1">
                      <dt className="text-[11px] font-medium text-slate-500">Email</dt>
                      <dd className="text-sm text-slate-900 truncate">{safeParticipant.demographics?.email || '--'}</dd>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                   <div className="min-w-0 flex-1">
                      <dt className="text-[11px] font-medium text-slate-500">Phone</dt>
                      <dd className="text-sm text-slate-900">{safeParticipant.demographics?.phone || '--'}</dd>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                   <div className="min-w-0 flex-1">
                      <dt className="text-[11px] font-medium text-slate-500">Address</dt>
                      <dd className="text-sm text-slate-900 leading-snug">
                        {safeParticipant.demographics?.address}<br/>
                        {safeParticipant.demographics?.city}, {safeParticipant.demographics?.zip_code}
                      </dd>
                   </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Pane 2: Categories (6/12) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Demographic Attributes */}
            <div className="card">
               <h2 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                 <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-600 text-[10px]">3</span>
                 Demographics
               </h2>
               <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">DOB / Age at Intake</dt>
                    <dd className="text-sm text-slate-900">
                      {formatDate(safeParticipant.demographics?.date_of_birth)}
                      {ageAtIntake !== null && (
                        <span className="ml-2 text-slate-500 text-xs">(Age: {ageAtIntake})</span>
                      )}
                    </dd>
                  </div>
                   <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Primary Language</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.demographics?.primary_language || '--'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Gender</dt>
                    <dd className="text-sm text-slate-900">
                      {safeParticipant.demographics?.gender || '--'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Race / Ethnicity</dt>
                    <dd className="text-sm text-slate-900">
                      {safeParticipant.demographics?.race || '--'} / {safeParticipant.demographics?.ethnicity || '--'}
                    </dd>
                  </div>
                   <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Veteran Status</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.demographics?.veteran_status || 'No'}</dd>
                  </div>
                   <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Citizenship</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.demographics?.citizenship_status || '--'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Household Size</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.demographics?.household_size || '--'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Dependents</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.demographics?.dependents_count || '--'}</dd>
                  </div>
               </div>
            </div>

            {/* Legal & Referral Info */}
            <div className="card">
               <h2 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                 <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-indigo-600 text-[10px]">2</span>
                 Referral & Legal
               </h2>
               <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Referral Source</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.referral_source || '--'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Staff Assigned</dt>
                    <dd className="text-sm text-slate-900">{safeParticipant.legal_info?.staff_assigned || '--'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Consent Signed</dt>
                    <dd className="text-sm text-slate-900 flex items-center gap-2">
                      {safeParticipant.legal_info?.consent_signed ? (
                        <>
                          <span className="text-emerald-600 font-medium">Yes</span>
                          <span className="text-slate-400 text-xs">{safeParticipant.legal_info.consent_date ? `on ${formatDate(safeParticipant.legal_info.consent_date)}` : ''}</span>
                        </>
                      ) : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">ROI Status</dt>
                    <dd className="text-sm text-slate-900 flex items-center gap-2">
                       {safeParticipant.legal_info?.roi_signed ? (
                         <>
                           <span className="text-emerald-600 font-medium">Active</span>
                           <span className="text-slate-400 text-xs">{safeParticipant.legal_info.roi_expiration_date ? `exp. ${formatDate(safeParticipant.legal_info.roi_expiration_date)}` : ''}</span>
                         </>
                       ) : 'None'}
                    </dd>
                  </div>
               </div>
            </div>

            {/* Socioeconomic Attributes */}
            <div className="card">
               <h2 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                 <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-600 text-[10px]">4</span>
                 Socioeconomic Status
               </h2>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-8">
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase">Housing Status</dt>
                      <dd className="text-sm text-slate-900 font-medium">{safeParticipant.socioeconomic?.housing_status_at_intake || '--'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase">Residence Type</dt>
                      <dd className="text-sm text-slate-900 capitalize">{safeParticipant.socioeconomic?.residence_type || '--'}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-slate-400 uppercase">Transportation Access</dt>
                    <dd className="text-sm text-slate-900 mt-0.5">{safeParticipant.socioeconomic?.transportation_access || '--'}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8">
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase">Internet Access</dt>
                      <dd className="text-sm text-slate-900 capitalize">{safeParticipant.socioeconomic?.internet_access || '--'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase">Device Access</dt>
                      <dd className="text-sm text-slate-900 capitalize">{safeParticipant.socioeconomic?.device_access || '--'}</dd>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Pane 3: Timeline & Activity (3/12) */}
          <div className="lg:col-span-3">
             <div className="card h-full">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Recent Activity</h2>
                {timeline?.length ? (
                  <div className="relative">
                    <div className="absolute left-3 top-0 h-full w-px bg-slate-100" />
                    <ul className="space-y-6 relative">
                      {timeline.map((event) => (
                        <li key={event.id} className="pl-8 relative">
                          <div className="absolute left-0 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 leading-snug">
                              {event.description}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              {formatDate(event.createdAt)} &middot; {event.type}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-sm text-slate-400">No activity logged.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Assessments Tab — Admin Intelligence Panel */}
      {activeTab === 'assessments' && (
        <div className="space-y-5">
          {/* Header row */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Assessment Intelligence</h2>
            </div>
            <button
              onClick={() => router.push(`/participants/${id}/assessments/new`)}
              className="btn-primary text-xs py-1.5"
            >
              + New Assessment
            </button>
          </div>

          {/* Intelligence Panel */}
          <AssessmentIntelligencePanel assessments={assessments ?? []} />

          {/* Raw Assessment Records (collapsed by default) */}
          <details className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <summary className="flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                <span className="text-sm font-semibold text-slate-600">Raw Assessment Records</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                  {(assessments ?? []).length}
                </span>
              </div>
            </summary>
            <div className="px-5 pb-5 pt-2">
              <DataTable<Assessment>
                columns={
                  [
                    {
                      key: 'assessment_type',
                      header: 'Assessment Type',
                      render: (row) => (
                        <button
                          type="button"
                          onClick={() => setSelectedAssessment(row)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {formatAssessmentType(row.assessment_type)}
                        </button>
                      ),
                    },
                    {
                      key: 'completed_at',
                      header: 'Completed Date',
                      render: (row) => row.completed_at ? new Date(row.completed_at).toLocaleDateString() : 'N/A',
                    },
                    {
                      key: 'score',
                      header: 'Readiness',
                      render: (row) =>
                        row.computed_summary?.overallReadiness ? (
                          <StatusBadge status={row.computed_summary.overallReadiness} />
                        ) : '--',
                    },
                    {
                      key: 'summary',
                      header: 'Top Recommendation',
                      render: (row) => row.computed_summary?.recommendations?.[0] || 'No summary available',
                    },
                  ] as Column<Assessment>[]
                }
                data={assessments ?? []}
                emptyMessage="No assessments recorded for this participant."
              />
            </div>
          </details>

          {/* Assessment Detail Results Modal */}
          {selectedAssessment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
              <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedAssessment(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <AssessmentResults
                  type={selectedAssessment.assessment_type}
                  scores={selectedAssessment.computed_summary}
                  completedAt={selectedAssessment.completed_at}
                />

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedAssessment(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workforce Tab Content */}
      {activeTab === 'workforce' && (
        <div className="space-y-6">
          <div className="card">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Training & Credentials</h2>
              <button
                onClick={handleOpenAddTrainingModal}
                className="btn-primary text-xs py-1.5"
              >
                + Add Training Record
              </button>
            </div>
            <TrainingList 
              participantId={id} 
              onEdit={handleEditTraining} 
            />
          </div>

          <div>
            <WorkforcePlanGenerator
              participantId={id}
              assessments={assessments ?? []}
            />
          </div>
        </div>
      )}

      {/* Enrollments Tab Content */}
      {activeTab === 'enrollments' && (
        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Enrollment Records</h2>
            <button
              onClick={handleOpenAddEnrollmentModal}
              className="btn-primary text-xs py-1.5"
            >
              + Add Enrollment
            </button>
          </div>
          <EnrollmentList participantId={id} />
        </div>
      )}

      {/* Follow-Up Tab Content */}
      {activeTab === 'follow-ups' && (
        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Follow-Up Records</h2>
            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="btn-primary text-xs py-1.5"
            >
              + Add Follow-Up
            </button>
          </div>
          <FollowUpList followUps={followUps} />
        </div>
      )}

      {/* Employment Outcomes Tab Content */}
      {activeTab === 'employment-outcomes' && (
        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Employment Outcomes</h2>
            <button
              onClick={() => setIsEmploymentModalOpen(true)}
              className="btn-primary text-xs py-1.5"
            >
              + Log Placement
            </button>
          </div>
          <EmploymentOutcomeList outcomes={outcomes} />
        </div>
      )}

      {/* Exit & Discharge Tab Content */}
      {activeTab === 'discharges' && (
        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Exit & Discharge History</h2>
            {(!discharges || discharges.length === 0) && (
              <button
                onClick={() => setIsDischargeModalOpen(true)}
                className="btn-primary text-xs py-1.5"
              >
                + Process Exit & Discharge
              </button>
            )}
          </div>
          <DataTable
            columns={[
              { key: 'exit_date', header: 'Exit Date', render: (row) => new Date(row.exit_date).toLocaleDateString() },
              { key: 'discharge_type', header: 'Type', render: (row) => <span className="capitalize">{row.discharge_type}</span> },
              { key: 'employment_status_at_exit', header: 'Employment Status' },
              { 
                key: 'outcomes', 
                header: 'Outcomes', 
                render: (row: any) => (
                  <div className="flex flex-wrap gap-1">
                    {row.completed_successfully && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Completed</span>}
                    {row.incarcerated && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">Incarcerated</span>}
                    {row.lost_contact && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">Lost Contact</span>}
                  </div>
                )
              },
              { key: 'notes_at_exit', header: 'Notes', render: (row) => <span className="truncate max-w-xs block">{row.notes_at_exit || '--'}</span> }
            ]}
            data={discharges ?? []}
            emptyMessage="No exit or discharge records found."
          />
        </div>
      )}

      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">New Follow-Up</h3>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="text-gray-400 hover:text-gray-500 p-1">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <FollowUpForm
                participantId={id}
                onSubmitSuccess={() => setIsFollowUpModalOpen(false)}
                onCancel={() => setIsFollowUpModalOpen(false)}
                createFollowUp={createFollowUp}
                isSaving={isCreating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Encounters Tab Content */}
      {activeTab === 'encounters' && (
        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Participant Encounters</h2>
            <button
              onClick={() => setIsEncounterModalOpen(true)}
              className="btn-primary text-xs py-1.5"
            >
              + New Encounter
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'encounter_date', header: 'Date', render: (row) => `${new Date(row.encounter_date as string).toLocaleString()}` },
              { key: 'service_type', header: 'Service Type', render: (row) => `${row.service_type || '--'}` },
              { key: 'duration_minutes', header: 'Duration', render: (row) => `${row.duration_minutes} min` },
              { key: 'notes', header: 'Notes', render: (row) => `${row.notes || '--'}` }
            ]}
            data={data?.encounters ?? []}
            emptyMessage="No encounters found for this participant."
          />
        </div>
      )}

      {/* Matches Tab Content */}
      {activeTab === 'matches' && (
        <div className="card">
          <h2 className="text-base font-bold text-slate-900 mb-4">Employment Matches</h2>
          <DataTable
            columns={[
              { key: 'employer_name', header: 'Employer' },
              { key: 'application_status', header: 'Status' },
              { key: 'outcome', header: 'Outcome' },
              { key: 'created_at', header: 'Date', render: (row) => `${new Date(row.created_at as string).toLocaleDateString()}` }
            ]}
            data={data?.matches ?? []}
            emptyMessage="No employment matches found."
          />
        </div>
      )}

      {/* Enrollment Modal */}
      {isEnrollmentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEnrollment ? 'Edit Enrollment' : 'New Enrollment'}
              </h3>
              <button
                onClick={handleCloseEnrollmentModal}
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <EnrollmentForm
                participantId={id}
                referralId={activeReferralId || undefined}
                // If editing, pass the enrollment data. For new, it's undefined.
                initialData={editingEnrollment as any} 
                onSubmitSuccess={handleEnrollmentSubmitSuccess}
                onCancel={handleCloseEnrollmentModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTraining ? 'Edit Training Record' : 'New Training Record'}
              </h3>
              <button
                onClick={() => setIsTrainingModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <TrainingForm
                participantId={id}
                initialData={editingTraining}
                onSubmitSuccess={handleTrainingSubmitSuccess}
                onCancel={() => setIsTrainingModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Employment Outcomes Modal */}
      {isEmploymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">Log Employment Outcome</h3>
              <button onClick={() => setIsEmploymentModalOpen(false)} className="text-gray-400 hover:text-gray-500 p-1">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <EmploymentOutcomeForm
                participantId={id}
                onSubmitSuccess={() => setIsEmploymentModalOpen(false)}
                onCancel={() => setIsEmploymentModalOpen(false)}
                createOutcome={createOutcome}
                isSaving={isSavingOutcome}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900 text-center flex-1">Edit Participant Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500 p-1">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <ParticipantEditForm
                participant={participant}
                onSubmitSuccess={() => setIsEditModalOpen(false)}
                onCancel={() => setIsEditModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* New Encounter Modal */}
      {isEncounterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900 text-center flex-1">Record New Encounter</h3>
              <button onClick={() => setIsEncounterModalOpen(false)} className="text-gray-400 hover:text-gray-500 p-1">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <EncounterForm
                participantId={id}
                onSuccess={() => {
                  setIsEncounterModalOpen(false);
                  refetch();
                }}
                onCancel={() => setIsEncounterModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Exit & Discharge Modal */}
      {isDischargeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">Exit & Discharge Participant</h3>
              <button onClick={() => setIsDischargeModalOpen(false)} className="text-gray-400 hover:text-gray-500 p-1">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <DischargeForm
                participantId={id}
                onSubmitSuccess={() => {
                  setIsDischargeModalOpen(false);
                  refetchDischarges();
                  refetch(); // Refetch participant data to see status change
                }}
                onCancel={() => setIsDischargeModalOpen(false)}
                createDischarge={createDischarge}
                isSaving={isDischarging}
              />
            </div>
          </div>
        </div>
      )}

      {/* Provision / Reset Login Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">Provision / Reset Login</h3>
              <button 
                onClick={() => {
                  setIsProvisionModalOpen(false);
                  setProvisionResult(null);
                  setProvisionError(null);
                }} 
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {!provisionResult ? (
                <>
                  <p className="text-sm text-slate-600">
                    This will provision or reset the portal login account for <strong className="text-slate-900">{safeParticipant.demographics?.first_name} {safeParticipant.demographics?.last_name}</strong>.
                  </p>
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <p className="text-slate-500 font-medium">Associated Email:</p>
                    <p className="text-sm font-bold text-slate-900">{safeParticipant.demographics?.email || 'No email specified'}</p>
                  </div>

                  {provisionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      {provisionError}
                    </div>
                  )}

                  {!safeParticipant.demographics?.email ? (
                    <p className="text-xs text-amber-600 font-medium">
                      ⚠️ Please edit the participant profile and add an email address before provisioning a login.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      The account will be set up with default temporary password <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-mono font-bold">changeme123</code>.
                    </p>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsProvisionModalOpen(false)}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!safeParticipant.demographics?.email || provisionMutation.isPending}
                      onClick={() => provisionMutation.mutate({})}
                      className="btn-primary text-xs bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {provisionMutation.isPending ? 'Provisioning...' : 'Confirm Provision / Reset'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Credentials Provisioned!</h4>
                    <p className="text-xs text-slate-500">Login details are active and ready for the participant.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px] uppercase tracking-wider">Email / Username</span>
                      <span className="font-bold text-slate-900 text-sm">{provisionResult.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px] uppercase tracking-wider">Temporary Password</span>
                      <span className="font-bold text-amber-700 text-sm">{provisionResult.temporaryPassword}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${provisionResult.email}\nPassword: ${provisionResult.temporaryPassword}`);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.75v-6.75" />
                      </svg>
                      {isCopied ? 'Copied!' : 'Copy Credentials'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProvisionModalOpen(false);
                        setProvisionResult(null);
                        setProvisionError(null);
                      }}
                      className="btn-primary text-xs"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
