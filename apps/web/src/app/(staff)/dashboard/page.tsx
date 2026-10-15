'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useApiQuery } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';
import { FidelitySnapshot } from '@/components/ips/fidelity-snapshot';

interface DashboardStats {
  activeParticipants: number;
  pendingReferrals: number;
  activePlans: number;
  monthEncounters: number;
  placementRate: number;
}

interface ReferralItem {
  id: string;
  participantName: string;
  referral_source: string;
  referral_status: string;
  createdAt: string;
}

interface ReferralsResponse {
  items: ReferralItem[];
  total: number;
}

function StatSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboardStats, isLoading: statsLoading } =
    useApiQuery<DashboardStats>(['reports', 'dashboard'], '/reports/dashboard');

  const { data: recentReferrals, isLoading: recentLoading } =
    useApiQuery<ReferralsResponse>(
      ['referrals', 'recent'],
      '/referrals?limit=5',
    );

  const stats = [
    {
      label: 'Active Participants',
      value: dashboardStats?.activeParticipants,
      color: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-100',
      icon: (
        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Referrals',
      value: dashboardStats?.pendingReferrals,
      color: 'bg-yellow-50 text-yellow-700',
      iconBg: 'bg-yellow-100',
      icon: (
        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
    },
    {
      label: 'Active Plans',
      value: dashboardStats?.activePlans,
      color: 'bg-blue-50 text-blue-700',
      iconBg: 'bg-blue-100',
      icon: (
        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      ),
    },
    {
      label: "This Month's Encounters",
      value: dashboardStats?.monthEncounters,
      color: 'bg-purple-50 text-purple-700',
      iconBg: 'bg-purple-100',
      icon: (
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
  ];

  const isStatsLoading = statsLoading;

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-slate-500 italic">
          Welcome back{user?.email ? `, ${user.email}` : ''}. Here is an
          overview of your activity.
        </p>
      </div>

      {/* Main Stats & IPS Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">System Overview</h2>
            <div className="flex items-center gap-2">
              <Link href="/referrals/new" className="px-3 py-1.5 text-[10px] font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap uppercase tracking-wider">
                + Referral
              </Link>
              <Link href="/participants/new" className="px-3 py-1.5 text-[10px] font-black bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap uppercase tracking-wider">
                + Participant
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow content-start">
            {isStatsLoading
              ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                : stats.map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {stat.value ?? '--'}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Fidelity Snapshot */}
        <div className="h-full">
          <FidelitySnapshot />
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Referrals
          </h2>
          <Link
            href="/referrals"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        {recentLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-4 w-16 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : !recentReferrals?.items?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="h-12 w-12 text-slate-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
            <p className="text-sm text-slate-500">No referrals yet.</p>
            <Link
              href="/referrals/new"
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Create your first referral
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentReferrals.items.map((referral) => (
              <Link
                key={referral.id}
                href={`/referrals/${referral.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-900">
                    {referral.participantName}
                  </span>
                  <span className="text-sm text-slate-500">
                    {referral.referral_source || 'Unknown Source'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={referral.referral_status} />
                  <span className="text-xs text-slate-400">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
