'use client';

import { StatusBadge } from '@/components/status-badge';

interface Aptitude {
  category: string;
  level: string;
  score: number;
}

interface Barrier {
  category: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

interface ScoredResult {
  interests: string[];
  aptitudes: Aptitude[];
  barriers: Barrier[];
  overallReadiness: string;
  recommendations: string[];
}

interface AssessmentResultsProps {
  type: string;
  scores: ScoredResult;
  completedAt?: string;
}

const readinessColors: Record<string, string> = {
  not_ready: 'declined',
  developing: 'pending',
  ready: 'active',
  highly_ready: 'consented',
};

const severityColors: Record<string, string> = {
  low: 'active',
  medium: 'pending',
  high: 'declined',
};

function formatLabel(s: string): string {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AssessmentResults({ type, scores, completedAt }: AssessmentResultsProps) {
  if (!scores) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {formatLabel(type)} Results
          </h3>
          {completedAt && (
            <p className="text-sm text-slate-500">
              Completed {new Date(completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <StatusBadge
          status={formatLabel(scores.overallReadiness)}
          variant={readinessColors[scores.overallReadiness] || 'pending'}
        />
      </div>

      {/* Interests */}
      {scores.interests.length > 0 && (
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Top Interests</h4>
          <div className="flex flex-wrap gap-2">
            {scores.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
              >
                {formatLabel(interest)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Aptitudes */}
      {scores.aptitudes.length > 0 && (
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Skills & Aptitudes</h4>
          <div className="space-y-3">
            {scores.aptitudes.map((apt) => (
              <div key={apt.category} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{formatLabel(apt.category)}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(apt.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 w-24 text-right">
                    {formatLabel(apt.level)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barriers */}
      {scores.barriers.length > 0 && (
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Identified Barriers</h4>
          <div className="space-y-2">
            {scores.barriers.map((barrier) => (
              <div
                key={barrier.category}
                className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    {formatLabel(barrier.category)}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">{barrier.details}</p>
                </div>
                <StatusBadge
                  status={formatLabel(barrier.severity)}
                  variant={severityColors[barrier.severity]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {scores.recommendations.length > 0 && (
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {scores.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
