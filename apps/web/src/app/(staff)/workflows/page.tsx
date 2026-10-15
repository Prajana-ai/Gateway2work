'use client';

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

// ── Types ──

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  [key: string]: unknown;
}

interface ParticipantSearchResponse {
  items: Participant[];
  total: number;
  page: number;
  totalPages: number;
}

interface Workflow {
  id: string;
  participantId: string;
  participantName: string;
  currentStage: string;
  status: string;
  startedAt: string;
  [key: string]: unknown;
}

interface WorkflowsResponse {
  items: Workflow[];
  total: number;
  page: number;
  totalPages: number;
}

interface WorkflowPayload {
  participantId: string;
}

// ── Stage Progress ──

const STAGES = ['Intake', 'Assessments', 'Plan', 'Matching', 'Follow-Up'];

function StageProgress({ currentStage }: { currentStage: string }) {
  const currentIdx = STAGES.findIndex(
    (s) => s.toLowerCase() === currentStage.toLowerCase(),
  );

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={stage} className="flex items-center">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isCompleted ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-6 ${
                  idx < currentIdx ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──

export default function WorkflowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [debouncedParticipantSearch, setDebouncedParticipantSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce participant search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedParticipantSearch(participantSearch);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [participantSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Queries ──
  const { data: participantResults } = useApiQuery<ParticipantSearchResponse>(
    ['participant-search-wf', debouncedParticipantSearch],
    `/participants?search=${encodeURIComponent(debouncedParticipantSearch)}&limit=10`,
    { enabled: debouncedParticipantSearch.length >= 2 },
  );

  const { data: workflowsData, isLoading } = useApiQuery<WorkflowsResponse>(
    ['workflows'],
    '/workflows',
  );

  const startWorkflow = useApiMutation<Workflow, WorkflowPayload>(
    '/workflows',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        setShowModal(false);
        resetForm();
      },
    },
  );

  function resetForm() {
    setParticipantSearch('');
    setDebouncedParticipantSearch('');
    setSelectedParticipant(null);
  }

  function handleParticipantSelect(participant: Participant) {
    setSelectedParticipant(participant);
    setParticipantSearch(`${participant.firstName} ${participant.lastName}`);
    setShowDropdown(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedParticipant) return;
    startWorkflow.mutate({ participantId: selectedParticipant.id });
  }

  // ── Table columns ──
  const columns: Column<Workflow>[] = [
    {
      key: 'participantName',
      header: 'Participant',
      render: (row) => (
        <span className="font-medium text-slate-900">{row.participantName}</span>
      ),
    },
    {
      key: 'currentStage',
      header: 'Current Stage',
      render: (row) => <StageProgress currentStage={row.currentStage} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (row) => new Date(row.startedAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage participant service workflows and track stage progress.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          Start Workflow
        </button>
      </div>

      {/* Stage Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {STAGES.map((stage, idx) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
              {idx + 1}
            </span>
            {stage}
          </span>
        ))}
      </div>

      {/* Table */}
      <DataTable<Workflow>
        columns={columns}
        data={workflowsData?.items ?? []}
        loading={isLoading}
        emptyMessage="No active workflows."
        onRowClick={(row) => router.push(`/workflows/${row.id}`)}
      />

      {/* ── Start Workflow Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Start New Workflow
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Participant search */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Participant
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Search participant..."
                  value={participantSearch}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setParticipantSearch(e.target.value);
                    setSelectedParticipant(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown &&
                  participantResults &&
                  participantResults.items.length > 0 &&
                  !selectedParticipant && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-slate-200">
                      {participantResults.items.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => handleParticipantSelect(c)}
                          >
                            {c.firstName} {c.lastName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!selectedParticipant || startWorkflow.isPending}
                >
                  {startWorkflow.isPending ? 'Starting...' : 'Start Workflow'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
              {startWorkflow.isError && (
                <p className="text-sm text-red-600">
                  Failed to start workflow. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
