'use client';

import { useApiQuery } from '@/hooks/use-api';
import { RecommendedReportingVariablesDto } from '@impactforge/shared';

export function ReportingTable() {
  const { data: wfdVars, isLoading } = useApiQuery<RecommendedReportingVariablesDto>(
    ['reports-wfd-vars'],
    '/reports/recommended-variables',
  );

  if (isLoading) {
    return (
      <div className="card animate-pulse p-6">
        <div className="h-6 w-48 bg-slate-200 rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-slate-100 pb-2">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!wfdVars) {
    return (
      <div className="card p-8 text-center text-slate-500">
        Unable to load reporting variables.
      </div>
    );
  }

  const rows = [
    { label: 'Total Enrolled', value: wfdVars.totalEnrolled },
    { label: 'Total Active Participants', value: wfdVars.totalActiveParticipants },
    { label: 'Total Exited', value: wfdVars.totalExited },
    { label: 'Number receiving case management', value: wfdVars.numberReceivingCaseManagement },
    { label: 'Number receiving training', value: wfdVars.numberReceivingTraining },
    { label: 'Number earning credentials', value: wfdVars.numberEarningCredentials },
    { label: 'Number placed in employment', value: wfdVars.numberPlacedInEmployment },
    { label: 'Median wage at placement', value: `$${wfdVars.medianWageAtPlacement.toFixed(2)}` },
    { label: 'Retention at 90 days', value: wfdVars.retentionAt90Days },
    { label: 'Retention at 6 months', value: wfdVars.retentionAt6Months },
    { label: 'Average time from intake to placement', value: `${wfdVars.averageTimeIntakeToPlacement} days` },
    { label: 'Average number of services per participant', value: wfdVars.averageServicesPerParticipant },
  ];

  const topLists = [
    { 
      label: 'Top Barriers', 
      items: wfdVars.topBarriers.map(b => `${b.barrier} (${b.count})`).join(', ') || 'None' 
    },
    { 
      label: 'Top Referral Sources', 
      items: wfdVars.topReferralSources.map(s => `${s.source} (${s.count})`).join(', ') || 'None' 
    },
    { 
      label: 'Top Industries for Placement', 
      items: wfdVars.topIndustriesForPlacement.map(i => `${i.industry} (${i.count})`).join(', ') || 'None' 
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900">Performance Indicators</h2>
      </div>
      <div className="divide-y divide-slate-100">
        <table className="min-w-full divide-y divide-slate-200">
          <tbody className="bg-white divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-slate-600 w-2/3">
                  {row.label}
                </td>
                <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">
                  {row.value}
                </td>
              </tr>
            ))}
            {topLists.map((list) => (
              <tr key={list.label} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-slate-600 align-top">
                  {list.label}
                </td>
                <td className="px-6 py-3 text-sm text-slate-700 text-right">
                  <div className="max-w-[240px] ml-auto leading-relaxed">
                    {list.items}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
