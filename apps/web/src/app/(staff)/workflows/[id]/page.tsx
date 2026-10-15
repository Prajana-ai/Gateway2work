'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';

// ── Types ──

interface StageHistoryEntry {
  stage: string;
  completedAt: string;
  [key: string]: unknown;
}

interface Condition {
  label: string;
  met: boolean;
  [key: string]: unknown;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  [key: string]: unknown;
}

interface WorkflowDetail {
  id: string;
  participantId: string;
  participantName: string;
  status: string;
  currentStage: string;
  stageDescription: string;
  startedAt: string;
  conditions: Condition[];
  tasks: Task[];
  stageHistory: StageHistoryEntry[];
  [key: string]: unknown;
}

// ── Stages ──

const STAGES = ['Intake', 'Assessments', 'Plan', 'Matching', 'Follow-Up'];

function StageProgressBar({ currentStage }: { currentStage: string }) {
  const currentIdx = STAGES.findIndex(
    (s) => s.toLowerCase() === currentStage.toLowerCase(),
  );

  return (
    <div className="flex items-center w-full">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={stage} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {stage}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-full -mt-5 ${
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

export default function WorkflowDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');

  const { data: workflow, isLoading } = useApiQuery<WorkflowDetail>(
    ['workflow', id],
    `/workflows/${id}`,
  );

  const advanceWorkflow = useApiMutation<WorkflowDetail, void>(
    `/workflows/${id}/advance`,
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflow', id] });
        setActionError('');
      },
      onError: () => setActionError('Cannot advance: conditions not met.'),
    },
  );

  const manualAdvance = useApiMutation<WorkflowDetail, void>(
    `/workflows/${id}/manual-advance`,
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflow', id] });
        setActionError('');
      },
      onError: () => setActionError('Failed to manually advance workflow.'),
    },
  );

  const pauseWorkflow = useApiMutation<WorkflowDetail, void>(
    `/workflows/${id}/pause`,
    'post',
    {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflow', id] }),
    },
  );

  const cancelWorkflow = useApiMutation<WorkflowDetail, void>(
    `/workflows/${id}/cancel`,
    'post',
    {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflow', id] }),
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-20 rounded-lg bg-slate-200" />
        <div className="h-48 rounded-lg bg-slate-200" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Workflow not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {workflow.participantName}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            <StatusBadge status={workflow.status} />
            <span>Started {new Date(workflow.startedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
          Stage Progress
        </h2>
        <StageProgressBar currentStage={workflow.currentStage} />
      </div>

      {/* Current Stage Card */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Current Stage: {workflow.currentStage}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {workflow.stageDescription || 'No description available.'}
        </p>

        {/* Conditions to Advance */}
        {workflow.conditions && workflow.conditions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Conditions to Advance
            </h3>
            <ul className="space-y-2">
              {workflow.conditions.map((cond, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded ${
                      cond.met
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {cond.met ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    )}
                  </span>
                  <span className={cond.met ? 'text-slate-700' : 'text-slate-500'}>
                    {cond.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Auto-created Tasks */}
        {workflow.tasks && workflow.tasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Tasks
            </h3>
            <ul className="space-y-1.5">
              {workflow.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-4 w-4 rounded border ${
                      task.completed
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-slate-300'
                    } flex items-center justify-center`}
                  >
                    {task.completed && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <span className={task.completed ? 'text-slate-500 line-through' : 'text-slate-700'}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            className="btn-primary"
            disabled={advanceWorkflow.isPending}
            onClick={() => advanceWorkflow.mutate(undefined as unknown as void)}
          >
            {advanceWorkflow.isPending ? 'Checking...' : 'Check & Advance'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={manualAdvance.isPending}
            onClick={() => manualAdvance.mutate(undefined as unknown as void)}
          >
            {manualAdvance.isPending ? 'Advancing...' : 'Manual Advance'}
          </button>
          {workflow.status === 'active' && (
            <button
              type="button"
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors"
              disabled={pauseWorkflow.isPending}
              onClick={() => pauseWorkflow.mutate(undefined as unknown as void)}
            >
              {pauseWorkflow.isPending ? 'Pausing...' : 'Pause'}
            </button>
          )}
          {workflow.status !== 'cancelled' && (
            <button
              type="button"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
              disabled={cancelWorkflow.isPending}
              onClick={() => cancelWorkflow.mutate(undefined as unknown as void)}
            >
              {cancelWorkflow.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
        {actionError && (
          <p className="mt-2 text-sm text-red-600">{actionError}</p>
        )}
      </div>

      {/* Stage History */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Stage History
        </h2>
        {workflow.stageHistory && workflow.stageHistory.length > 0 ? (
          <div className="space-y-3">
            {workflow.stageHistory.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    {entry.stage}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Completed {new Date(entry.completedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No completed stages yet.</p>
        )}
      </div>
    </div>
  );
}
