'use client';

import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Assessment {
  id: string;
  assessment_type: string;
  completed_at: string | null;
  computed_summary: any;
  [key: string]: unknown;
}

interface Aptitude {
  category: string;
  score: number;
  level: string;
}

interface Barrier {
  category: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

export interface AssessmentIntelligencePanelProps {
  assessments: Assessment[];
}

/* ------------------------------------------------------------------ */
/* Score Derivation Helpers                                            */
/* ------------------------------------------------------------------ */

/**
 * Job Readiness Score (0–100)
 * Mirrors the weighted composite in CurrentWorkProfileScorer:
 *   work picture 25% · work history 30% · education 25% · transport 20%
 * Aptitude scores come from computed_summary.aptitudes[] (0–5 each).
 */
function deriveJobReadinessScore(cwp: Assessment | null): number {
  const aptitudes: Aptitude[] = cwp?.computed_summary?.aptitudes ?? [];
  if (!aptitudes.length) return 0;

  const get = (cat: string) => aptitudes.find((a) => a.category === cat)?.score ?? 0;

  const workPicture = get('Current Work Picture');
  const workHistory = get('Work History');
  const education   = get('Learning Foundation');
  const transport   = get('Commuting & Getting to Work');

  const composite =
    (workPicture / 5) * 0.25 +
    (workHistory / 5) * 0.30 +
    (education   / 5) * 0.25 +
    (transport   / 5) * 0.20;

  return Math.round(composite * 100);
}

/**
 * Employability Score (0–100)
 * Average of the top-3 RIASEC aptitude scores from workstyle_strengths,
 * normalised to 0–100.
 */
function deriveEmployabilityScore(ws: Assessment | null): number {
  const aptitudes: Aptitude[] = ws?.computed_summary?.aptitudes ?? [];
  if (!aptitudes.length) return 0;

  const top3 = aptitudes.slice(0, 3);
  const avg  = top3.reduce((s, a) => s + a.score, 0) / top3.length;
  return Math.round((avg / 5) * 100);
}

/**
 * Self-Efficacy Score (0–100)
 * Base from overallReadiness + a small boost from the top RIASEC score.
 */
function deriveSelfEfficacyScore(ws: Assessment | null): number {
  if (!ws?.computed_summary) return 0;

  const readiness = ws.computed_summary.overallReadiness as string;
  const baseMap: Record<string, number> = {
    highly_ready: 88,
    ready:        72,
    developing:   52,
    not_ready:    30,
  };
  const base = baseMap[readiness] ?? 50;

  const aptitudes: Aptitude[] = ws.computed_summary.aptitudes ?? [];
  const topScore = aptitudes[0]?.score ?? 0;
  const boost = Math.round((topScore / 5) * 10); // up to +10 pts

  return Math.min(100, base + boost);
}

/**
 * Acuity Level (Tier 1 / 2 / 3)
 * Derived from support_needs.computed_summary.barriers[] severity counts
 * plus the explicit high-acuity flag rules defined in the spec.
 */
function deriveAcuityLevel(sn: Assessment | null): {
  tier: 1 | 2 | 3;
  label: string;
  reason: string;
} {
  const barriers: Barrier[] = sn?.computed_summary?.barriers ?? [];

  if (!barriers.length) {
    return { tier: 1, label: 'Tier 1 — Low Acuity', reason: 'Support Needs assessment not yet completed.' };
  }

  const highCount = barriers.filter((b) => b.severity === 'high').length;
  const medCount  = barriers.filter((b) => b.severity === 'medium').length;

  // Specific Tier-3 flag categories per spec
  const hasHousingHigh   = barriers.some((b) => b.category === 'Housing'    && b.severity === 'high');
  const hasLegalHigh     = barriers.some((b) => b.category === 'Legal'      && b.severity === 'high');
  const hasChildcareHigh = barriers.some((b) => b.category === 'Childcare'  && b.severity === 'high');

  if (highCount >= 3 || (highCount >= 2 && (hasHousingHigh || hasLegalHigh || hasChildcareHigh))) {
    const triggers = [
      hasHousingHigh   && 'housing instability',
      hasLegalHigh     && 'active legal barriers',
      hasChildcareHigh && 'childcare gap',
    ]
      .filter(Boolean)
      .join(', ');
    return {
      tier: 3,
      label: 'Tier 3 — High Acuity',
      reason: `Triggered by: ${triggers || `${highCount} critical barriers`}.`,
    };
  }

  if (highCount >= 2 || (highCount === 1 && medCount >= 2) || medCount >= 4) {
    const highCats = barriers.filter((b) => b.severity === 'high').map((b) => b.category);
    return {
      tier: 2,
      label: 'Tier 2 — Moderate Acuity',
      reason: `${highCount} high-severity and ${medCount} medium-severity barrier(s)${highCats.length ? ` (${highCats.join(', ')})` : ''}.`,
    };
  }

  if (highCount === 1 || medCount >= 2) {
    return {
      tier: 2,
      label: 'Tier 2 — Moderate Acuity',
      reason: `${medCount} logistical barrier(s) requiring moderate case management support.`,
    };
  }

  return {
    tier: 1,
    label: 'Tier 1 — Low Acuity',
    reason: 'Minimal barriers identified. Self-directed support appropriate.',
  };
}

/**
 * Job Retention Risk
 * Cross-references barrier severity counts with current_work_profile readiness.
 */
function deriveRetentionRisk(
  cwp: Assessment | null,
  sn:  Assessment | null,
): { level: 'low' | 'low-medium' | 'medium' | 'high'; label: string; reason: string } {
  const barriers: Barrier[] = sn?.computed_summary?.barriers ?? [];
  const highCount  = barriers.filter((b) => b.severity === 'high').length;
  const medCount   = barriers.filter((b) => b.severity === 'medium').length;
  const readiness  = (cwp?.computed_summary?.overallReadiness as string) ?? '';

  if (highCount >= 2) {
    return {
      level: 'high',
      label: 'High',
      reason: 'Multiple critical support barriers present — may impact employment stability.',
    };
  }
  if (highCount === 1 || medCount >= 3) {
    return {
      level: 'medium',
      label: 'Medium',
      reason: 'Active barriers that require case management to prevent job loss.',
    };
  }
  if (readiness === 'highly_ready' && highCount === 0 && medCount <= 1) {
    return {
      level: 'low',
      label: 'Low',
      reason: 'Strong readiness indicators and minimal barriers. Stable placement expected.',
    };
  }
  if (medCount >= 1 || readiness === 'developing') {
    return {
      level: 'low-medium',
      label: 'Low–Medium',
      reason: 'Positive momentum with minor logistical barriers to monitor.',
    };
  }
  return {
    level: 'low',
    label: 'Low',
    reason: 'No significant risk indicators identified.',
  };
}

/* ------------------------------------------------------------------ */
/* Score Band                                                          */
/* ------------------------------------------------------------------ */

function scoreBand(score: number): { label: string; barColor: string; textColor: string } {
  if (score >= 80) return { label: 'High',          barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
  if (score >= 65) return { label: 'Moderate-High', barColor: 'bg-blue-500',    textColor: 'text-blue-600'    };
  if (score >= 45) return { label: 'Moderate',      barColor: 'bg-amber-400',   textColor: 'text-amber-600'   };
  return               { label: 'Low',             barColor: 'bg-red-400',     textColor: 'text-red-600'     };
}

/* ------------------------------------------------------------------ */
/* Mini UI Components                                                  */
/* ------------------------------------------------------------------ */

function ScoreRow({
  label,
  score,
  source,
  available,
}: {
  label: string;
  score: number;
  source: string;
  available: boolean;
}) {
  const band = scoreBand(score);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {available ? (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {score}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </span>
            <span className={`text-xs font-bold ${band.textColor}`}>{band.label}</span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400">Pending assessment</span>
        )}
      </div>
      {available && (
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${band.barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
      <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{source}</p>
    </div>
  );
}

function TierBadge({ tier, label }: { tier: 1 | 2 | 3; label: string }) {
  const styles: Record<number, string> = {
    1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    2: 'bg-amber-50  text-amber-700  border-amber-200',
    3: 'bg-red-50    text-red-700    border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${styles[tier]}`}>
      {label}
    </span>
  );
}

function RiskBadge({ level, label }: { level: string; label: string }) {
  const styles: Record<string, string> = {
    low:          'bg-emerald-50 text-emerald-700 border-emerald-200',
    'low-medium': 'bg-blue-50    text-blue-700    border-blue-200',
    medium:       'bg-amber-50   text-amber-700   border-amber-200',
    high:         'bg-red-50     text-red-700     border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${styles[level] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Assessment Metadata                                                 */
/* ------------------------------------------------------------------ */

const ASSESSMENT_META = [
  {
    type:    'current_work_profile',
    label:   'Work Profile & History Status',
    trigger: 'Auto-triggered by Work Profile form submission',
  },
  {
    type:    'workstyle_strengths',
    label:   'Work Interest Inventory Status',
    trigger: 'Auto-triggered by Workstyle Strengths form submission',
  },
  {
    type:    'support_needs',
    label:   'Support Service Assessment Status',
    trigger: 'Auto-triggered by Support Needs form submission',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Card Header                                                         */
/* ------------------------------------------------------------------ */

function CardHeader({
  icon,
  title,
  accentClass,
}: {
  icon: React.ReactNode;
  title: string;
  accentClass: string; // e.g. 'border-blue-400'
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 border-l-4 ${accentClass}`}>
      <span className="flex-shrink-0 text-slate-500">{icon}</span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Panel Component                                                */
/* ------------------------------------------------------------------ */

export function AssessmentIntelligencePanel({ assessments }: AssessmentIntelligencePanelProps) {
  const byType = (type: string) => assessments.find((a) => a.assessment_type === type) ?? null;
  const cwp = byType('current_work_profile');
  const ws  = byType('workstyle_strengths');
  const sn  = byType('support_needs');

  // Derived scores
  const jobReadiness  = deriveJobReadinessScore(cwp);
  const employability = deriveEmployabilityScore(ws);
  const selfEfficacy  = deriveSelfEfficacyScore(ws);
  const acuity        = deriveAcuityLevel(sn);
  const risk          = deriveRetentionRisk(cwp, sn);

  // Career planning data
  const careerPathways: string[] = ws?.computed_summary?.interests ?? [];
  const overallReadiness: string = ws?.computed_summary?.overallReadiness ?? '';

  // Aggregate recommendations across all 3 assessments (max 6)
  const recommendations: string[] = [
    ...(cwp?.computed_summary?.recommendations ?? []),
    ...(ws?.computed_summary?.recommendations  ?? []),
    ...(sn?.computed_summary?.recommendations  ?? []),
  ].slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-5">

      {/* ── Card 1: Assessment Completion Status ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <CardHeader
          accentClass="border-blue-400"
          title="Assessment Completion Status"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <div className="divide-y divide-slate-100">
          {ASSESSMENT_META.map(({ type, label, trigger }) => {
            const a    = byType(type);
            const done = !!a?.completed_at;
            return (
              <div key={type} className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0 mr-4">
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{trigger}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                      done
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {done ? '✅ Completed' : '⏳ Pending'}
                  </span>
                  {done && a?.completed_at && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Card 2: Scoring & Intake Analytics ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <CardHeader
          accentClass="border-indigo-400"
          title="Scoring & Intake Analytics"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <div className="px-5 py-5 space-y-5">
          {/* Score rows */}
          <ScoreRow
            label="Job Readiness Score"
            score={jobReadiness}
            source="Weighted composite: work history 30%, education 25%, current work picture 25%, transportation 20%."
            available={!!cwp}
          />
          <ScoreRow
            label="Employability Score"
            score={employability}
            source="Cross-references RIASEC interest strength against top industry aptitude alignment."
            available={!!ws}
          />
          <ScoreRow
            label="Self-Efficacy Score"
            score={selfEfficacy}
            source="Derived from positive RIASEC engagement and career direction clarity."
            available={!!ws}
          />

          {/* Acuity + Risk */}
          <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Case Management Acuity Level
              </p>
              <TierBadge tier={acuity.tier} label={acuity.label} />
              <p className="mt-2 text-[11px] leading-snug text-slate-400">{acuity.reason}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Job Retention Risk
              </p>
              <RiskBadge level={risk.level} label={risk.label} />
              <p className="mt-2 text-[11px] leading-snug text-slate-400">{risk.reason}</p>
            </div>
          </div>

          {/* Barrier breakdown */}
          {sn?.computed_summary?.barriers?.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                Barrier Breakdown
              </p>
              <div className="space-y-2">
                {(sn?.computed_summary?.barriers as Barrier[]).map((b, i) => {
                  const severityStyles: Record<string, string> = {
                    high:   'bg-red-50    text-red-600    border-red-100',
                    medium: 'bg-amber-50  text-amber-600  border-amber-100',
                    low:    'bg-emerald-50 text-emerald-600 border-emerald-100',
                  };
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`flex-shrink-0 mt-0.5 inline-flex px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${severityStyles[b.severity] ?? ''}`}>
                        {b.severity}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-700">{b.category}:</span>
                        <span className="text-xs text-slate-500 ml-1 leading-snug">{b.details}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Card 3: Career Planning & Matching Benchmarks ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <CardHeader
          accentClass="border-emerald-400"
          title="Career Planning & Matching Benchmarks"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          }
        />
        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Career pathways */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Career Pathway Identified
              </p>
              {careerPathways.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {careerPathways.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">—</p>
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">
                Auto-populated from top RIASEC results and checked Career Directions.
              </p>
            </div>

            {/* Overall Readiness */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Overall Readiness
              </p>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {overallReadiness.replace(/_/g, ' ') || '—'}
              </p>
              <p className="mt-1.5 text-[10px] text-slate-400">
                Composite readiness across all submitted assessments.
              </p>
            </div>
          </div>

          {/* System Recommendations */}
          {recommendations.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">
                System-Generated Recommendations
              </p>
              <ul className="space-y-2.5">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-[9px] font-bold text-blue-600">
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600">{rec}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!cwp && !ws && !sn && (
            <p className="text-sm text-center text-slate-400 py-4">
              No assessments completed yet. Career planning data will populate automatically once assessments are submitted.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

