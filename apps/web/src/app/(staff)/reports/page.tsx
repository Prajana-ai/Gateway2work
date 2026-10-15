'use client';

import { useState, type ChangeEvent } from 'react';
import { useApiQuery } from '@/hooks/use-api';
import { EmployabilityGraph } from '@/components/reports/employability-graph';
import { ReportingTable } from '@/components/reports/reporting-table';

// ── Types ──

interface EmployabilityMetric {
  participantId: string;
  enrollmentDate: string;
  outcome: string;
  score: number;
  weeksInProgram: number;
  sectors: string[];
  resources: number;
  inhibitors: number;
}

// ── Page ──

export default function ReportsPage() {
  // Employability metrics
  const { data: employabilityData, isLoading: employabilityLoading } = useApiQuery<
    EmployabilityMetric[]
  >(['reports-employability'], '/reports/employability');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reporting Dashboard</h1>
        <p className="mt-2 text-base text-slate-600">
          Performance indicators and outcome projections for workforce development.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 items-start">
        {/* Left Column: Reporting Table */}
        <section>
          <ReportingTable />
        </section>

        {/* Right Column: Employability Graph */}
        <section className="space-y-6">
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Employability Projection Model
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Correlation between program engagement (weeks) and resource acquisition. 
                Top-right quadrant indicates high-readiness candidates.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-2 min-h-[500px]">
              <EmployabilityGraph 
                data={employabilityData || []} 
                isLoading={employabilityLoading} 
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wider">Note</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              Data is updated in real-time based on participant enrollments, encounters, and employment outcomes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
