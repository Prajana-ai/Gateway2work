'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useApiQuery } from '@/hooks/use-api';
import { AssessmentResults } from '@/components/assessments/assessment-results';

interface AssessmentRecord {
  id: string;
  tenant_id: string;
  participant_id: string;
  assessment_type: string;
  raw_responses?: Record<string, any>;
  computed_summary?: Record<string, any>;
  scores?: Record<string, any>;
  completed_at?: string | null;
  created_at: string;
}

const ASSESSMENT_TYPES = [
  {
    type: 'current_work_profile',
    title: '🏢 Current Work Profile',
    description: 'Let us celebrate your starting point! Sharing where you stand today helps us tailor the right opportunities for your day one.',
    href: '/horizon/assessments/current_work_profile',
    hoverStyle: 'hover:border-blue-200 hover:shadow-blue-100/50',
    borderColor: 'border-slate-200',
    accentColor: 'blue',
  },
  {
    type: 'workstyle_strengths',
    title: '✨ Workstyle Strengths',
    description: 'What makes you thrive? This explores your natural work personality and the unique strengths you bring to a team.',
    href: '/horizon/assessments/workstyle_strengths',
    hoverStyle: 'hover:border-purple-200 hover:shadow-purple-100/50',
    borderColor: 'border-slate-200',
    accentColor: 'purple',
  },
  {
    type: 'support_needs',
    title: '🤝 Support Needs',
    description: 'We are here to back you up. Let us know what tools, flexibility, or accommodations you need to feel confident and succeed.',
    href: '/horizon/assessments/support_needs',
    hoverStyle: 'hover:border-amber-200 hover:shadow-amber-100/50',
    borderColor: 'border-slate-200',
    accentColor: 'amber',
  },
];

function normalizeScores(summary?: Record<string, any>) {
  if (!summary) {
    return {
      interests: [],
      aptitudes: [],
      barriers: [],
      overallReadiness: 'developing',
      recommendations: [],
    };
  }

  return {
    interests: Array.isArray(summary.interests)
      ? summary.interests
      : typeof summary.interests === 'object' && summary.interests !== null
        ? Object.entries(summary.interests).map(([code, score]) => ({
          code,
          score: Number(score) || 0,
        }))
        : [],
    aptitudes: Array.isArray(summary.aptitudes)
      ? summary.aptitudes
      : typeof summary.aptitudes === 'object' && summary.aptitudes !== null
        ? Object.entries(summary.aptitudes).map(([name, level]) => ({
          name,
          level: String(level),
        }))
        : [],
    barriers: Array.isArray(summary.barriers)
      ? summary.barriers
      : typeof summary.barriers === 'object' && summary.barriers !== null
        ? Object.entries(summary.barriers).map(([category, severity]) => ({
          category,
          severity: String(severity),
        }))
        : [],
    overallReadiness: summary.overallReadiness || 'developing',
    recommendations: Array.isArray(summary.recommendations) ? summary.recommendations : [],
  };
}

export default function HorizonPage() {
  const user = useAuthStore((s) => s.user);
  const participantId = user?.id ?? '';

  // Track expanded assessment type card
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const { data: assessmentsRaw, isLoading } = useApiQuery<AssessmentRecord[] | null>(
    ['participant-assessments', participantId],
    `/assessments/participant/${participantId}`,
    { enabled: !!participantId },
  );

  const latestAssessmentsByType = useMemo(() => {
    if (!Array.isArray(assessmentsRaw)) return {};
    const map: Record<string, AssessmentRecord> = {};
    for (const record of assessmentsRaw) {
      if (!map[record.assessment_type]) {
        map[record.assessment_type] = record;
      } else {
        const existingDate = new Date(map[record.assessment_type].completed_at || map[record.assessment_type].created_at).getTime();
        const currentDate = new Date(record.completed_at || record.created_at).getTime();
        if (currentDate > existingDate) {
          map[record.assessment_type] = record;
        }
      }
    }
    return map;
  }, [assessmentsRaw]);

  const completedCount = Object.keys(latestAssessmentsByType).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header section outside card matching /plan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">My Horizon</h1>
          <p className="text-sm text-slate-600 font-medium mt-0.5">
            Where I want to go — Assessments, interests, and strengths
          </p>
        </div>

        {!isLoading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold shrink-0">
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{completedCount} of 3 Assessments Completed</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Main Content: 3 Horizontal Cards Grid */}
      {!isLoading && (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ASSESSMENT_TYPES.map((item) => {
              const record = latestAssessmentsByType[item.type];
              const isCompleted = !!record?.completed_at || !!record?.computed_summary;
              const isExpanded = expandedType === item.type;

              return (
                <div
                  key={item.type}
                  className={`rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 flex flex-col justify-between ${item.borderColor} ${item.hoverStyle}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Completed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setExpandedType(isExpanded ? null : item.type)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Results' : 'View Results'}
                        <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="btn-primary text-xs py-2 px-4 w-full text-center"
                      >
                        Start Assessment
                      </Link>
                    )}
                  </div>

                  {/* Expandable Results directly underneath if clicked */}
                  {isCompleted && isExpanded && record && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <AssessmentResults type={item.type} scores={normalizeScores(record.computed_summary)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
