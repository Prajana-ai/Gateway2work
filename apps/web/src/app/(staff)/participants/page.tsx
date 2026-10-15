'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useApiQuery } from '@/hooks/use-api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';

interface Participant {
  id: string;
  demographics: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
  };
  status: string;
  referral_source: string;
  updated_at: string;
  [key: string]: unknown;
}

interface ParticipantsResponse {
  data: Participant[];
  total: number;
  page: number;
  limit: number;
}

const statusTabs = ['all', 'active', 'pending', 'completed', 'declined'] as const;

export default function ParticipantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
  const statusParam = activeTab === 'all' ? '' : `&status=${activeTab}`;
  const url = `/participants?page=${page}&limit=50${searchParam}${statusParam}`;

  const { data, isLoading } = useApiQuery<ParticipantsResponse>(
    ['participants', activeTab, String(page), debouncedSearch],
    url,
  );

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPage(1);
  }

  const updateParticipantStatus = useMutation({
    mutationFn: (data: { id: string; status: string }) => 
      apiClient.patch(`/participants/${data.id}`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const columns: Column<Participant>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => `${row.demographics?.first_name} ${row.demographics?.last_name}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => {
            e.stopPropagation();
            updateParticipantStatus.mutate({
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
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participants</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage participant records and profiles.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/participants/new" className="btn-primary">
            Add Participant
          </Link>
          <button type="button" className="btn-secondary">
            Import CSV
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
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

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          className="input-field max-w-md"
          placeholder="Search participants by name..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* Table */}
      <DataTable<Participant>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyMessage="No participants found."
        onRowClick={(row) => router.push(`/participants/${row.id}`)}
      />

      {/* Pagination */}
      <Pagination
        page={data?.page ?? page}
        totalPages={data ? Math.ceil(data.total / data.limit) : 1}
        onPageChange={setPage}
      />
    </div>
  );
}
