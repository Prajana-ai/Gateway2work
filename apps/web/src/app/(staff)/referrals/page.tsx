'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useApiQuery } from '@/hooks/use-api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';

interface ParticipantReferral {
  id: string;
  participant_id: string;
  participantName: string;
  referral_source: string;
  referral_status: string;
  createdAt: string;
  [key: string]: unknown;
}

interface ReferralsResponse {
  items: ParticipantReferral[];
  total: number;
  page: number;
  totalPages: number;
}

const statusTabs = ['all', 'pending', 'active', 'completed'] as const;

export default function ReferralsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [page, setPage] = useState(1);

  const statusParam = activeTab === 'all' ? '' : `&status=${activeTab}`;
  const url = `/referrals?page=${page}&limit=50${statusParam}`;

  const { data, isLoading } = useApiQuery<ReferralsResponse>(
    ['referrals', activeTab, String(page)],
    url,
  );

  const updateReferralStatus = useMutation({
    mutationFn: (data: { id: string; status: string }) => 
      apiClient.patch(`/referrals/${data.id}/status`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  const columns: Column<ParticipantReferral>[] = [
    { key: 'participantName', header: 'Name' },
    { key: 'referral_source', header: 'Source' },
    {
      key: 'referral_status',
      header: 'Status',
      render: (row) => (
        <select
          value={row.referral_status}
          onChange={(e) => {
            e.stopPropagation();
            updateReferralStatus.mutate({
              id: row.id,
              status: e.target.value,
            });
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs border rounded px-2 py-1 bg-white"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
        </select>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/referrals/${row.id}?enroll=true`);
            }}
            className="btn-primary text-xs py-1.5 px-3"
          >
            Enroll
          </button>
        </div>
      ),
    },
  ];

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referrals and Enrollments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track participant referrals and enrollments.
          </p>
        </div>
        <Link href="/referrals/new" className="btn-primary">
          New Referral
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable<ParticipantReferral>
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No referrals found."
        onRowClick={(row) => router.push(`/referrals/${row.id}`)}
      />

      {/* Pagination */}
      <Pagination
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
