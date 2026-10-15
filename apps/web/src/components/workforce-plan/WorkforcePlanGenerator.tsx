'use client';

import React, { useMemo, useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/status-badge';

interface Assessment {
  id: string;
  assessment_type: string;
  completed_at: string | null;
  computed_summary: any;
  raw_responses?: any;
}

interface WorkforcePlan {
  id: string;
  participant_id: string;
  long_term_goal: string;
  short_term_goals: any;
  status: string;
  created_at: string;
}

interface WorkforcePlanGeneratorProps {
  participantId: string;
  assessments: Assessment[];
}

const REQUIRED_ASSESSMENTS = [
  { type: 'current_work_profile', label: 'Current Work Profile' },
  { type: 'workstyle_strengths', label: 'Workstyle Strengths' },
  { type: 'support_needs', label: 'Support Needs' },
];

export function WorkforcePlanGenerator({ participantId, assessments }: WorkforcePlanGeneratorProps) {
  const queryClient = useQueryClient();

  // 1. Local state hook (Hook #1)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (stepKey: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  };

  // 2. Query Existing Workforce Plan (Hook #2)
  const { data: plansRaw, isLoading: planLoading } = useApiQuery<WorkforcePlan[] | null>(
    ['workforce-plan', participantId],
    `/workforce-plans/participant/${participantId}`,
    { enabled: !!participantId }
  );

  const existingPlan = Array.isArray(plansRaw) && plansRaw.length > 0 ? plansRaw[0] : null;

  // 3. Completed map (Hook #3)
  const completedMap = useMemo(() => {
    const map: Record<string, Assessment> = {};
    for (const a of assessments) {
      if (a.completed_at || a.computed_summary) {
        map[a.assessment_type] = a;
      }
    }
    return map;
  }, [assessments]);

  const missingAssessments = REQUIRED_ASSESSMENTS.filter(
    (req) => !completedMap[req.type]
  );
  const isFullyCompleted = missingAssessments.length === 0;

  // 4. Derived plan data (Hook #4)
  const derivedPlanData = useMemo(() => {
    const rawWork = completedMap['current_work_profile']?.raw_responses || {};
    const rawStrengths = completedMap['workstyle_strengths']?.raw_responses || {};
    const rawSupport = completedMap['support_needs']?.raw_responses || {};

    const targetFields = rawStrengths.fields_of_choice || ['Technology & Digital Support', 'Office Administration'];
    const superpowers = rawStrengths.top_superpowers || ['Problem Solving', 'Teamwork'];
    const primaryTarget = targetFields[0] || 'Target Industry';

    // Phase 1 Steps
    const phase1Steps: string[] = [];

    if (rawSupport.housing?.housing_status_at_intake === 'homeless' || rawSupport.housing?.housing_status_at_intake === 'shelter') {
      phase1Steps.push(`Address Housing Need: Secure emergency housing voucher & rapid re-housing support (${rawSupport.housing.housing_status_at_intake}).`);
    } else if (rawSupport.housing?.housing_status_at_intake) {
      phase1Steps.push(`Address Housing Need: Maintain stable housing (${rawSupport.housing.housing_status_at_intake}).`);
    } else {
      phase1Steps.push('Address Housing Need: Verify permanent residential stability & safe shelter environment.');
    }

    if (rawSupport.health?.has_mental_health_diagnosis) {
      phase1Steps.push('Address Health Need: Connect with behavioral healthcare, mental health navigation & peer recovery support.');
    }
    if (rawSupport.health?.substance_use_in_recovery) {
      phase1Steps.push('Address Recovery Need: Support ongoing substance recovery meetings & peer specialist check-ins.');
    }
    if (rawSupport.legal?.background_steps?.length) {
      phase1Steps.push(`Address Legal Need: Connect with Legal Aid for background check navigation (${rawSupport.legal.background_steps.join(', ')}).`);
    }
    if (rawSupport.childcare?.has_childcare_barriers) {
      phase1Steps.push('Address Childcare Need: Apply for subsidized childcare vouchers & family care referral.');
    }

    const missingIDs: string[] = [];
    if (!rawSupport.identification?.has_state_id) missingIDs.push('State Driver’s License / Photo ID');
    if (!rawSupport.identification?.has_social_security_card) missingIDs.push('Social Security Card');
    if (!rawSupport.identification?.has_birth_certificate) missingIDs.push('Birth Certificate');

    if (missingIDs.length > 0) {
      phase1Steps.push(`Verify Right-to-Work IDs: Obtain required identification documents (${missingIDs.join(', ')}).`);
    } else {
      phase1Steps.push('Verify Right-to-Work IDs: Confirm valid State Photo ID and Social Security card on file.');
    }

    if (rawSupport.commuting_getting_to_work?.drivers_license_status === 'valid') {
      phase1Steps.push('Secure Transportation Vouchers: Provide personal vehicle fuel assistance vouchers for commute.');
    } else {
      phase1Steps.push('Secure Transportation Vouchers: Provide monthly city public transit bus passes & route schedule.');
    }

    phase1Steps.push('Establish Baseline Stability: Secure reliable contact phone number, permanent mailing address, and emergency contact.');

    // Phase 2 Steps
    const phase2Steps = [
      `Refine professional resume highlighting top superpowers (${superpowers.slice(0, 3).join(', ')}) targeting ${primaryTarget}.`,
      `Practice interview skills through 2 mock interview sessions focused on ${targetFields.slice(0, 2).join(' & ')}.`,
      `Complete target vocational training: Enroll in workforce development certificate program for ${primaryTarget}.`,
    ];

    // Phase 3 Steps
    const phase3Steps = [
      `Submit 5 job applications weekly to verified employers in ${targetFields.slice(0, 2).join(' & ')}.`,
      `Attend scheduled job interviews with workforce specialist accompaniment & coaching.`,
      `Secure employment placement and complete 30-day, 60-day, and 90-day retention support milestone check-ins.`,
    ];

    return {
      primaryTarget,
      targetFields,
      phase1Steps,
      phase2Steps,
      phase3Steps,
    };
  }, [completedMap]);

  // 5. Mutation to Initialize Plan (Hook #5)
  const createPlanMutation = useApiMutation<any, any>('/workforce-plans', 'post', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-plan', participantId] });
    },
  });

  // 6. Parsed short term goals (Hook #6 - ALL HOOKS CALLED UNCONDITIONALLY BEFORE ANY IF/RETURN)
  const parsedShortTermGoals = useMemo(() => {
    if (!existingPlan?.short_term_goals) return null;
    if (typeof existingPlan.short_term_goals === 'object') return existingPlan.short_term_goals;
    try {
      return JSON.parse(existingPlan.short_term_goals);
    } catch {
      return null;
    }
  }, [existingPlan]);

  const handleInitializePlan = () => {
    if (!isFullyCompleted) return;

    const payload = {
      participantId,
      longTermGoal: `Achieve sustainable competitive employment in ${derivedPlanData.primaryTarget} within 90 days.`,
      shortTermGoals: {
        phase1: derivedPlanData.phase1Steps,
        phase2: derivedPlanData.phase2Steps,
        phase3: derivedPlanData.phase3Steps,
        targetFields: derivedPlanData.targetFields,
      },
    };

    createPlanMutation.mutate(payload);
  };

  // Conditional early return AFTER all hooks have executed
  if (planLoading) {
    return <div className="p-6 animate-pulse text-slate-500">Loading Workforce Plan data...</div>;
  }

  const activePhase1 = parsedShortTermGoals?.phase1 || derivedPlanData.phase1Steps;
  const activePhase2 = parsedShortTermGoals?.phase2 || derivedPlanData.phase2Steps;
  const activePhase3 = parsedShortTermGoals?.phase3 || derivedPlanData.phase3Steps;

  return (
    <div className="space-y-6">
      {/* ── UNINITIALIZED STATE ── */}
      {!existingPlan && (
        <div className="card p-8 border-2 border-dashed border-slate-200 text-center space-y-4 bg-slate-50/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M10.5 3v1.5m3 0V3m-3 1.5h3m-3 18.75h3M10.5 21v-1.5m3 0V21m-9-6h1.5m0-3H3m1.5 6H3m16.5-6h1.5m-1.5 3H21m-1.5 6H21M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5z" />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Customized Workforce Plan</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
              Initialize a customized, 3-phase workforce plan generated directly from the participant’s assessment responses.
            </p>
          </div>

          {!isFullyCompleted && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium max-w-md mx-auto space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>Cannot Initialize Plan</span>
              </div>
              <p>The following assessment(s) must be completed before generating a workforce plan:</p>
              <ul className="list-disc list-inside pt-1 font-semibold text-amber-900">
                {missingAssessments.map((m) => (
                  <li key={m.type}>{m.label}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            disabled={!isFullyCompleted || createPlanMutation.isPending}
            onClick={handleInitializePlan}
            className={`btn-primary px-6 py-2.5 text-sm font-bold shadow-md transition-all ${!isFullyCompleted
                ? 'opacity-50 cursor-not-allowed bg-slate-300 border-slate-300 text-slate-500 shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {createPlanMutation.isPending ? 'Generating Plan...' : '⚡ Initialize Plan'}
          </button>
        </div>
      )}

      {/* ── INITIALIZED STATE: Interactive Phased Steps with Checkboxes ── */}
      {existingPlan && (
        <div className="space-y-6">
          <div className="card p-6 border-l-4 border-l-blue-600 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Customized Plan Summary</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {existingPlan.long_term_goal || `Employment Goal: ${derivedPlanData.primaryTarget}`}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Plan Initialized on {new Date(existingPlan.created_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={existingPlan.status || 'Active'} />
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Interactive Action Plan Steps
            </h3>

            <div className="space-y-6">
              {/* Phase 1 Card */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs">1</span>
                    Phase 1: Stabilization & Foundation (Days 1–30)
                  </h4>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Days 1–30</span>
                </div>
                <div className="space-y-3 pt-1">
                  {Array.isArray(activePhase1) && activePhase1.map((step: string, idx: number) => {
                    const key = `p1-${idx}`;
                    const isChecked = !!completedSteps[key];
                    return (
                      <label key={key} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStep(key)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                        />
                        <span className={`text-xs font-medium leading-relaxed transition-colors ${isChecked ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {step}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Phase 2 Card */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs">2</span>
                    Phase 2: Preparation & Exploration (Days 31–60)
                  </h4>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">Days 31–60</span>
                </div>
                <div className="space-y-3 pt-1">
                  {Array.isArray(activePhase2) && activePhase2.map((step: string, idx: number) => {
                    const key = `p2-${idx}`;
                    const isChecked = !!completedSteps[key];
                    return (
                      <label key={key} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStep(key)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                        />
                        <span className={`text-xs font-medium leading-relaxed transition-colors ${isChecked ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {step}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Phase 3 Card */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">3</span>
                    Phase 3: Placement & Retention (Days 61+)
                  </h4>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Days 61+</span>
                </div>
                <div className="space-y-3 pt-1">
                  {Array.isArray(activePhase3) && activePhase3.map((step: string, idx: number) => {
                    const key = `p3-${idx}`;
                    const isChecked = !!completedSteps[key];
                    return (
                      <label key={key} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStep(key)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                        />
                        <span className={`text-xs font-medium leading-relaxed transition-colors ${isChecked ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {step}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
