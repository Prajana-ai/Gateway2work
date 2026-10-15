'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

interface RFE {
  id: string;
  name: string;
  sector: string;
  city: string;
  state: string;
}

interface Match {
  id: string;
  participantId: string;
  rfeId: string;
  employerName: string;
  applicationStatus: string;
  outcome: string;
  matchedAt: string;
  updatedAt: string;
}

interface RFESearchResult {
  items: RFE[];
  total: number;
}

const APPLICATION_STATUSES = [
  'identified',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'declined',
  'withdrawn',
];

const OUTCOMES = [
  '',
  'hired',
  'not_hired',
  'pending',
  'withdrew',
];

export default function ParticipantMatchesPage() {
  const params = useParams();
  const participantId = params.id as string;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RFE[]>([]);
  const [selectedEmployer, setSelectedEmployer] = useState<RFE | null>(null);
  const [initialStatus, setInitialStatus] = useState('identified');
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editOutcome, setEditOutcome] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: matches, isLoading } = useApiQuery<Match[]>(
    ['participant-matches', participantId],
    `/participants/${participantId}/matches`,
  );

  const createMatch = useApiMutation<
    Match,
    { rfeId: string; applicationStatus: string }
  >(`/participants/${participantId}/matches`, 'post', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-matches', participantId] });
      setShowAddMatch(false);
      setSelectedEmployer(null);
      setSearchTerm('');
      setSearchResults([]);
      setInitialStatus('identified');
    },
  });

  // Search RFE directory with debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await apiClient.get<RFESearchResult>(
          `/rfes?search=${encodeURIComponent(searchTerm)}&limit=10`,
        );
        setSearchResults(result.items);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployer) return;
    createMatch.mutate({
      rfeId: selectedEmployer.id,
      applicationStatus: initialStatus,
    });
  };

  const handleUpdateMatch = async (matchId: string) => {
    try {
      await apiClient.patch(`/matches/${matchId}`, {
        applicationStatus: editStatus,
        outcome: editOutcome || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['participant-matches', participantId] });
      setEditingMatchId(null);
    } catch {
      // error handled by api participant
    }
  };

  const startEditing = (match: Match) => {
    setEditingMatchId(match.id);
    setEditStatus(match.applicationStatus);
    setEditOutcome(match.outcome || '');
  };

  const columns: Column<Match>[] = [
    { key: 'employerName', header: 'Employer' },
    {
      key: 'applicationStatus',
      header: 'Application Status',
      render: (row: Match) =>
        editingMatchId === row.id ? (
          <select
            className="input-field text-sm"
            value={editStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEditStatus(e.target.value)
            }
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge status={row.applicationStatus} />
        ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (row: Match) =>
        editingMatchId === row.id ? (
          <select
            className="input-field text-sm"
            value={editOutcome}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEditOutcome(e.target.value)
            }
          >
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o ? o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g, ' ') : 'None'}
              </option>
            ))}
          </select>
        ) : row.outcome ? (
          <StatusBadge status={row.outcome} />
        ) : (
          <span className="text-slate-400">--</span>
        ),
    },
    {
      key: 'matchedAt',
      header: 'Matched Date',
      render: (row: Match) =>
        row.matchedAt ? new Date(row.matchedAt).toLocaleDateString() : '--',
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (row: Match) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '--',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Match) =>
        editingMatchId === row.id ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateMatch(row.id);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setEditingMatchId(null);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              startEditing(row);
            }}
          >
            Edit
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Employer Matches
        </h1>
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => setShowAddMatch(!showAddMatch)}
        >
          {showAddMatch ? 'Cancel' : 'Add Match'}
        </button>
      </div>

      {/* Add Match Section */}
      {showAddMatch && (
        <form className="card space-y-4 p-6" onSubmit={handleCreateMatch}>
          <h2 className="text-lg font-semibold text-slate-900">
            Search & Match Employer
          </h2>

          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Search RFE Directory
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Type employer name..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setSelectedEmployer(null);
              }}
            />
            {isSearching && (
              <p className="mt-1 text-xs text-slate-400">Searching...</p>
            )}
            {searchResults.length > 0 && !selectedEmployer && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                {searchResults.map((rfe) => (
                  <button
                    key={rfe.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      setSelectedEmployer(rfe);
                      setSearchTerm(rfe.name);
                      setSearchResults([]);
                    }}
                  >
                    <span className="font-medium text-slate-900">{rfe.name}</span>
                    <span className="text-xs text-slate-500">
                      {rfe.sector.replace(/_/g, ' ')} - {rfe.city}, {rfe.state}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedEmployer && (
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-900">
                Selected: {selectedEmployer.name}
              </p>
              <p className="text-xs text-blue-700">
                {selectedEmployer.sector.replace(/_/g, ' ')} -{' '}
                {selectedEmployer.city}, {selectedEmployer.state}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Initial Status
            </label>
            <select
              className="input-field"
              value={initialStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setInitialStatus(e.target.value)
              }
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={!selectedEmployer || createMatch.isPending}
          >
            {createMatch.isPending ? 'Creating...' : 'Create Match'}
          </button>
        </form>
      )}

      {/* Matches Table */}
      <DataTable
        columns={columns as any}
        data={(matches as unknown as Record<string, unknown>[]) ?? []}
        loading={isLoading}
        emptyMessage="No matches yet. Add a match to get started."
      />
    </div>
  );
}
