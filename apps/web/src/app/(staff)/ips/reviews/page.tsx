'use client';

import React from 'react';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/use-api';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

interface IpsReview {
  id: string;
  review_date: string;
  reviewer_name: string;
  status: 'draft' | 'finalized';
  total_score: number;
}

export default function IpsReviewsListPage() {
  const { data: reviews, isLoading } = useApiQuery<IpsReview[]>(
    ['ips-reviews'],
    '/ips/reviews',
  );

  const columns: Column<IpsReview>[] = [
    {
      key: 'review_date',
      header: 'Review Date',
      render: (row) => new Date(row.review_date).toLocaleDateString(),
    },
    {
      key: 'reviewer_name',
      header: 'Reviewer',
      render: (row) => row.reviewer_name || '--',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.status}
          variant={row.status === 'finalized' ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'total_score',
      header: 'Fidelity Score',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{row.total_score}</span>
          <span className="text-xs text-slate-400">/ 125</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Link
          href={`/ips/reviews/${row.id}`}
          className="text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          View Details
        </Link>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">IPS Fidelity Reviews</h1>
          <p className="mt-1 text-base text-slate-500">Track agency adherence to the IPS Supported Employment model.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/ips/reviews/new" className="btn-primary">
            Conduct New Audit
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={reviews ?? []}
          loading={isLoading}
          emptyMessage="No fidelity reviews have been recorded yet."
        />
      </div>
    </div>
  );
}
