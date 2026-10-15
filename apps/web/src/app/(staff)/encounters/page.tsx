'use client';

import { useState, useMemo, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';
import { EncounterForm } from '@/components/EncounterForm';
import {
  ServiceType,
  BenefitsCounselingType,
  CareerCoachingType,
  CaseManagementType,
  InterviewPreparationType,
  JobSearchAssistanceType,
} from '@impactforge/shared';

// ── Types ──

interface Encounter {
  id: string;
  participant_id: string;
  participantName?: string;
  encounter_date: string;
  duration_minutes: number;
  notes: string;
  billable: boolean;
  service_type?: string;
  service_subcategory?: string;
  partner_organization_name?: string;
  location?: string;
  delivery_mode?: string;
  format?: string;
  is_completed?: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface EncountersResponse {
  items: Encounter[];
  total: number;
  page: number;
  totalPages: number;
}

interface EncounterExportRow {
  [key: string]: unknown;
}

// ── CSV helpers ──

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = String(row[h] ?? '');
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Export Modal ──

function ExportModal({ onClose }: { onClose: () => void }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!start || !end) return;
    setExporting(true);
    try {
      const data = await apiClient.get<EncounterExportRow[]>(
        `/reports/encounters?start_date=${start}&end_date=${end}`,
      );
      const csv = jsonToCsv(data);
      downloadCsv(csv, `encounters_${start}_to_${end}.csv`);
      onClose();
    } catch {
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Export Medicaid Encounters</h3>
        <p className="text-sm text-slate-500 mb-6">
          Select a date range to export billable encounters as a CSV file.
        </p>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
            <input
              type="date"
              className="input-field w-full"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
            <input
              type="date"
              className="input-field w-full"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary px-6"
            disabled={!start || !end || exporting}
            onClick={handleExport}
          >
            {exporting ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function EncountersPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Encounter list query
  const dateFromParam = dateFrom ? `&date_from=${dateFrom}` : '';
  const dateToParam = dateTo ? `&date_to=${dateTo}` : '';
  const encountersUrl = `/encounters?page=${page}&limit=20${dateFromParam}${dateToParam}`;

  const { data: encountersData, isLoading } = useApiQuery<EncountersResponse>(
    ['encounters', String(page), dateFrom, dateTo],
    encountersUrl,
  );

  // ── Table columns ──
  const columns: Column<Encounter>[] = [
    {
      key: 'encounter_date',
      header: 'Date',
      render: (row) => new Date(row.encounter_date).toLocaleString(),
    },
    {
      key: 'participantName',
      header: 'Participant',
      render: (row) => row.participantName ?? '--',
    },
    {
      key: 'service_type',
      header: 'Service Type',
      render: (row) => row.service_type ? row.service_type.replace(/_/g, ' ') : '--',
    },
    {
      key: 'duration_minutes',
      header: 'Duration',
      render: (row) => `${row.duration_minutes} min`,
    },
    {
      key: 'billable',
      header: 'Billable',
      render: (row) => (
        <StatusBadge
          status={row.billable ? 'Yes' : 'No'}
          variant={row.billable ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) =>
        row.notes
          ? row.notes.length > 60
            ? `${row.notes.slice(0, 60)}...`
            : row.notes
          : '--',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Encounters</h1>
          <p className="mt-1 text-base text-slate-500">
            Log interactions and track participant services.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Encounter
          </button>
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Medicaid CSV
          </button>
        </div>
      </div>

      {/* ── Recent Encounters List ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            Recent Encounters
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</span>
              <input
                type="date"
                className="text-sm font-medium border-0 p-0 focus:ring-0"
                value={dateFrom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</span>
              <input
                type="date"
                className="text-sm font-medium border-0 p-0 focus:ring-0"
                value={dateTo}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <DataTable<Encounter>
            columns={columns}
            data={encountersData?.items ?? []}
            loading={isLoading}
            emptyMessage="No encounters found."
          />
        </div>

        <Pagination
          page={encountersData?.page ?? page}
          totalPages={encountersData?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal onClose={() => setIsExportModalOpen(false)} />
      )}

      {/* Add Encounter Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Add New Encounter</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EncounterForm 
                onSuccess={() => {
                  setIsAddModalOpen(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
