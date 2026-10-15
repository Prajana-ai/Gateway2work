'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/use-api';
import { DataTable, Column } from '@/components/data-table';
import { Pagination } from '@/components/pagination';

interface RFE {
  id: string;
  name: string;
  industry: string;
  employer_address: string;
  contact_person: string;
  contact_email: string;
  is_rfe_certified: boolean;
  is_fair_chance: boolean;
  partnership_start_date: string;
  referral_count: number;
  hire_count: number;
}

interface RFEListResponse {
  items: RFE[];
  total: number;
  page: number;
  totalPages: number;
}

export default function RFEDirectoryPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (industry) queryParams.set('industry', industry);
  queryParams.set('page', String(page));
  queryParams.set('limit', '50');

  const { data, isLoading } = useApiQuery<RFEListResponse>(
    ['rfes', search, industry, String(page)],
    `/rfes?${queryParams.toString()}`,
  );

  const columns: Column<RFE>[] = [
    { key: 'name', header: 'Employer Name' },
    {
      key: 'industry',
      header: 'Industry',
      render: (row) => (
        <span className="capitalize">{row.industry?.replace(/_/g, ' ') || '--'}</span>
      ),
    },
    {
      key: 'contact_person',
      header: 'Contact Person',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.contact_person || '--'}</span>
          <span className="text-xs text-slate-500">{row.contact_email}</span>
        </div>
      ),
    },
    {
      key: 'is_rfe_certified',
      header: 'RFE',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            row.is_rfe_certified
              ? 'bg-green-50 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.is_rfe_certified ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_fair_chance',
      header: 'Fair Chance',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            row.is_fair_chance
              ? 'bg-blue-50 text-blue-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.is_fair_chance ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'stats',
      header: 'Referrals / Hires',
      render: (row) => (
        <div className="text-sm">
          <span className="font-bold text-blue-600">{row.referral_count || 0}</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="font-bold text-emerald-600">{row.hire_count || 0}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Link
          href={`/rfe/${row.id}`}
          className="text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          View 360°
        </Link>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employer Directory</h1>
          <p className="mt-1 text-base text-slate-500">Manage Recovery Friendly and Fair Chance partners.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/rfe/import" className="btn-secondary">
            Bulk Import
          </Link>
          <Link href="/rfe/new" className="btn-primary">
            Add Employer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-slate-50/50 border-slate-100">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="col-span-2">
            <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-widest">
              Search Employers
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, industry, or contact..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-widest">
              Industry Filter
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Filter by industry..."
              value={industry}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setIndustry(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={(data?.items ?? []) as any}
          loading={isLoading}
          emptyMessage="No employers found matching your criteria."
        />
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
