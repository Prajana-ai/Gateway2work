'use client';

import { useApiQuery } from '@/hooks/use-api';
import Link from 'next/link';

interface AutomatedStats {
  competitiveWorkRate: number;
  averageCaseload: number;
  averageDaysToFirstContact: number;
  averageWeeklyEmployerContacts: number;
}

export function FidelitySnapshot() {
  const { data: stats, isLoading } = useApiQuery<AutomatedStats>(
    ['ips-auto-stats'],
    '/ips/automated-stats',
  );

  if (isLoading) return <div className="card animate-pulse h-48" />;
  if (!stats) return null;

  const alerts = [];
  if (stats.averageCaseload > 25) {
    alerts.push({
      label: 'Caseload Warning',
      message: `Average caseload is ${stats.averageCaseload.toFixed(1)} (Max 25 for Item 313)`,
      type: 'error'
    });
  }
  if (stats.averageDaysToFirstContact > 30) {
    alerts.push({
      label: 'Timeline Warning',
      message: `Average time to first contact is ${stats.averageDaysToFirstContact} days (Max 30 for Item 327)`,
      type: 'warning'
    });
  }

  return (
    <div className="card space-y-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">IPS Fidelity Snapshot</h2>
        <Link href="/ips/reviews" className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">
          View All Reviews
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-grow content-start">
        {/* Employment */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v14.25A2.25 2.25 0 005.25 19.5h13.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75V19.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75h6m-6 3h6m-6 3h6m-6 3h6" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{stats.competitiveWorkRate.toFixed(0)}%</p>
        </div>

        {/* Avg Caseload */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Caseload</p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stats.averageCaseload > 25 ? 'bg-red-100' : 'bg-blue-100'}`}>
              <svg className={`h-5 w-5 ${stats.averageCaseload > 25 ? 'text-red-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <p className={`mt-2 text-xl font-black ${stats.averageCaseload > 25 ? 'text-red-600' : 'text-slate-900'}`}>
            {stats.averageCaseload.toFixed(1)}
          </p>
        </div>

        {/* Contact Days */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Days</p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stats.averageDaysToFirstContact > 30 ? 'bg-orange-100' : 'bg-purple-100'}`}>
              <svg className={`h-5 w-5 ${stats.averageDaysToFirstContact > 30 ? 'text-orange-600' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className={`mt-2 text-xl font-black ${stats.averageDaysToFirstContact > 30 ? 'text-orange-600' : 'text-slate-900'}`}>
            {stats.averageDaysToFirstContact}
          </p>
        </div>

        {/* Weekly Contacts */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Contacts</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875c-.621 0-1.125-.504-1.125-1.125v-4.25c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 9.75h7.5M8.25 12.75h7.5" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{stats.averageWeeklyEmployerContacts.toFixed(1)}</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
              alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700'
            }`}>
              <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">{alert.label}</p>
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
