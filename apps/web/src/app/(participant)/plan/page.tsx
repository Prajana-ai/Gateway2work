'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useApiQuery } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';

export default function ParticipantPlanPage() {
  const user = useAuthStore((s) => s.user);
  const participantId = user?.id ?? '';

  const { data: planRaw, isLoading: planLoading } = useApiQuery<
    Record<string, any>[] | null
  >(
    ['participant-plan', participantId],
    `/workforce-plans/participant/${participantId}`,
    { enabled: !!participantId },
  );

  const plan = React.useMemo(() => {
    const raw = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    if (!raw) return null;
    return raw;
  }, [planRaw]);

  // Extract short_term_goals safely
  const parsedShortTermGoals = React.useMemo(() => {
    if (!plan?.short_term_goals) return null;
    if (typeof plan.short_term_goals === 'object') return plan.short_term_goals;
    try {
      return JSON.parse(plan.short_term_goals);
    } catch {
      return null;
    }
  }, [plan]);

  const phase1Steps: string[] = parsedShortTermGoals?.phase1 || [
    'Address key support needs, verify IDs, secure transportation vouchers, and establish baseline stability.',
  ];
  const phase2Steps: string[] = parsedShortTermGoals?.phase2 || [
    'Refine resume based on strengths, practice interview skills, and complete target vocational training.',
  ];
  const phase3Steps: string[] = parsedShortTermGoals?.phase3 || [
    'Submit applications to target fields, attend interviews, secure job placement, and complete 90-day retention support.',
  ];

  if (planLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="h-48 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight mb-1">My Plan</h1>
          <p className="text-sm text-slate-600 font-medium">
            My safe, steady path forward — roadmap, goals, and core milestones.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center space-y-2">
          <p className="text-base font-bold text-slate-700">No Active Workforce Plan</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your customized workforce plan will appear here once all assessment requirements are completed and initialized by your case manager.
          </p>
        </div>
      </div>
    );
  }

  const primaryGoal = plan.long_term_goal || plan.longTermGoal;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Title outside the card matching 'My Action Steps' styling */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">My Plan</h1>
          <p className="text-sm text-slate-600 font-medium mt-0.5">
            {primaryGoal ? primaryGoal : 'My safe, steady path forward — roadmap, goals, and core milestones.'}
          </p>
        </div>
        <StatusBadge status={plan.status || 'Active'} />
      </div>

      {/* Sequenced Roadmap Phases */}
      <div className="space-y-6 pt-2">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">My Action Steps</h3>

        <div className="grid grid-cols-1 gap-6">
          {/* Phase 1 */}
          <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-blue-50 pb-3">
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Phase 1: Stabilization & Foundation</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">Days 1–30</span>
            </div>
            <ul className="space-y-2 pt-1">
              {phase1Steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="rounded-2xl bg-white border border-purple-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wider">Phase 2: Preparation & Career Exploration</span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">Days 31–60</span>
            </div>
            <ul className="space-y-2 pt-1">
              {phase2Steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 3 */}
          <div className="rounded-2xl bg-white border border-emerald-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Phase 3: Placement & Supported Retention</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">Days 61+</span>
            </div>
            <ul className="space-y-2 pt-1">
              {phase3Steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
