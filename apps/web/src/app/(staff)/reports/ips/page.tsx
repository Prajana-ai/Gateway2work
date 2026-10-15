'use client';

import { useApiQuery } from '@/hooks/use-api';
import Link from 'next/link';

// ── Types ──

interface IpsMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  description: string;
  [key: string]: unknown;
}

interface WorkRequirementParticipant {
  id: string;
  name: string;
  hoursWorked: number;
  threshold: number;
  gap: number;
  [key: string]: unknown;
}

interface WorkRequirementData {
  threshold: number;
  meetingCount: number;
  belowCount: number;
  totalCount: number;
  projectedComplianceRate: number;
  participantsBelow: WorkRequirementParticipant[];
  [key: string]: unknown;
}

// ── Helpers ──

function TrendIndicator({ trend, value }: { trend: string; value: string }) {
  if (trend === 'up') {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-green-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
        {value}
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-red-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
        </svg>
        {value}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
      </svg>
      {value}
    </span>
  );
}

// ── Page ──

export default function IpsMetricsPage() {
  const { data: metrics, isLoading: metricsLoading } = useApiQuery<IpsMetric[]>(
    ['ips-metrics'],
    '/reports/ips-metrics',
  );

  const { data: workReq, isLoading: workReqLoading } = useApiQuery<WorkRequirementData>(
    ['work-requirement'],
    '/reports/work-requirement',
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">IPS Metrics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Individual Placement and Support fidelity metrics and 2027 work requirement tracking.
          </p>
        </div>
        <Link href="/ips/reviews" className="btn-secondary">
          View Formal Reviews
        </Link>
      </div>

      {/* ── IPS Fidelity Metrics ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          IPS Fidelity Metrics
        </h2>
        {metricsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse p-6">
                <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
                <div className="h-10 w-20 rounded bg-slate-200 mb-2" />
                <div className="h-3 w-16 rounded bg-slate-200 mb-3" />
                <div className="h-3 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : metrics && metrics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="card p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {metric.label}
                </p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {metric.unit === '%'
                      ? `${metric.value}%`
                      : metric.unit === 'days'
                        ? metric.value
                        : metric.value}
                  </span>
                  {metric.unit !== '%' && metric.unit && (
                    <span className="text-sm text-slate-400 mb-1">{metric.unit}</span>
                  )}
                </div>
                <TrendIndicator trend={metric.trend} value={metric.trendValue} />
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No IPS metrics available.</p>
        )}
      </section>

      {/* ── 2027 Work Requirement ── */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          2027 Work Requirement
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Tracking participant progress toward the 80 hour/month work threshold.
        </p>

        {workReqLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="h-4 rounded-full bg-slate-200" />
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="h-48 rounded bg-slate-200" />
          </div>
        ) : workReq ? (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-700 font-medium">Meeting Threshold</p>
                <p className="text-2xl font-bold text-green-800">
                  {workReq.meetingCount}
                  <span className="text-sm font-normal text-green-600 ml-1">
                    / {workReq.totalCount} participants
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-sm text-yellow-700 font-medium">Below Threshold</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {workReq.belowCount}
                  <span className="text-sm font-normal text-yellow-600 ml-1">
                    participants
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700 font-medium">Projected Compliance</p>
                <p className="text-2xl font-bold text-blue-800">
                  {(workReq.projectedComplianceRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Overall Compliance
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {workReq.totalCount > 0
                    ? ((workReq.meetingCount / workReq.totalCount) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-200">
                <div
                  className="h-4 rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${
                      workReq.totalCount > 0
                        ? (workReq.meetingCount / workReq.totalCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Participants below threshold */}
            {workReq.participantsBelow && workReq.participantsBelow.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Participants Below Threshold
                </h3>
                <div className="space-y-3">
                  {workReq.participantsBelow.map((participant) => {
                    const percent = (participant.hoursWorked / participant.threshold) * 100;
                    return (
                      <div key={participant.id} className="rounded-lg bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            {participant.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {participant.hoursWorked}h / {participant.threshold}h
                            <span className="ml-2 text-red-500 font-medium">
                              ({participant.gap}h gap)
                            </span>
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              percent >= 75
                                ? 'bg-yellow-400'
                                : percent >= 50
                                  ? 'bg-orange-400'
                                  : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Unable to load work requirement data.</p>
        )}
      </section>
    </div>
  );
}
