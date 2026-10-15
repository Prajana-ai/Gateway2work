'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useApiQuery } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';

interface PlanTask {
  id: string;
  description: string;
  ownerType: 'staff' | 'participant';
  dueDate: string;
  status: string;
}

export default function ParticipantTasksPage() {
  const user = useAuthStore((s) => s.user);
  const participantId = user?.id ?? '';
  const queryClient = useQueryClient();
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: allTasks, isLoading } = useApiQuery<PlanTask[]>(
    ['participant-tasks', participantId],
    `/participant-tasks/${participantId}`,
    { enabled: !!participantId },
  );

  const tasks = (allTasks ?? []).filter((t) => t.ownerType === 'participant');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.patch(`/plan-tasks/${taskId}/complete`, {});
      queryClient.invalidateQueries({ queryKey: ['participant-tasks', participantId] });
    } catch {
      // handled by api client
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="h-16 rounded-xl bg-slate-200" />
          <div className="h-16 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header section matching /plan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-sm text-slate-600 font-medium mt-0.5">
            Manageable, daily healing steps and checklist items.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold shrink-0">
          <span>{pendingTasks.length} Pending • {completedTasks.length} Completed</span>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="pt-2">
        {pendingTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900">All caught up!</p>
            <p className="text-xs text-slate-500">No pending tasks right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-green-500 hover:text-green-500 transition-colors"
                    onClick={() => handleCompleteTask(task.id)}
                    aria-label="Complete task"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {task.description}
                    </p>
                    {task.dueDate && (
                      <p
                        className={`mt-1 text-xs ${
                          isOverdue(task.dueDate)
                            ? 'font-medium text-red-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {isOverdue(task.dueDate) ? 'Overdue: ' : 'Due: '}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks (Collapsible) */}
      {completedTasks.length > 0 && (
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-left"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span className="text-sm font-semibold text-slate-500">
              Completed ({completedTasks.length})
            </span>
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform ${
                showCompleted ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {showCompleted && (
            <div className="space-y-2 mt-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-400 line-through">
                        {task.description}
                      </p>
                      {task.dueDate && (
                        <p className="mt-1 text-xs text-slate-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
