'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useApiQuery } from '@/hooks/use-api';

interface PlanTask {
  id: string;
  description: string;
  ownerType: 'staff' | 'participant';
  status: string;
}

interface WorkforcePlan {
  id: string;
  longTermGoal: string;
  shortTermGoals: string[];
  status: string;
}



export default function ParticipantWelcomePage() {
  const user = useAuthStore((s) => s.user);
  const participantId = user?.id ?? '';

  // Extract a beautiful name from the email (e.g., preethi.sharma@example.com -> Preethi Sharma)
  const displayName = React.useMemo(() => {
    if (!user?.email) return 'Participant';
    const namePart = user.email.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [user]);

  // Fetch the participant's plan
  const { data: planRaw, isLoading: planLoading } = useApiQuery<
    Record<string, any>[] | null
  >(
    ['participant-plan', participantId],
    `/workforce-plans/participant/${participantId}`,
    { enabled: !!participantId },
  );

  // Fetch the participant's tasks
  const { data: allTasksRaw, isLoading: tasksLoading } = useApiQuery<
    Record<string, any>[]
  >(
    ['participant-tasks', participantId],
    `/participant-tasks/${participantId}`,
    { enabled: !!participantId },
  );



  // Process the plan
  const plan: WorkforcePlan | null = React.useMemo(() => {
    const raw = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    if (!raw) return null;
    return {
      id: raw.id,
      longTermGoal: raw.long_term_goal ?? raw.longTermGoal ?? '',
      shortTermGoals: Array.isArray(raw.short_term_goals)
        ? raw.short_term_goals
        : Array.isArray(raw.shortTermGoals)
          ? raw.shortTermGoals
          : [],
      status: raw.status ?? 'draft',
    };
  }, [planRaw]);

  // Process tasks
  const pendingTasksCount = React.useMemo(() => {
    if (!Array.isArray(allTasksRaw)) return 0;
    return allTasksRaw.filter(
      (t) => (t.owner_type ?? t.ownerType) === 'participant' && t.status !== 'completed'
    ).length;
  }, [allTasksRaw]);



  const greetingMessage = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const isPageLoading = planLoading || tasksLoading;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-8">
      <div className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        {/* Header section */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-medium text-gray-800 mb-3 tracking-tight">
            {greetingMessage}, <span className="text-emerald-800 font-medium">{displayName}</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            So glad you're here! Welcome back. Pick your path below to start.
          </p>
        </div>

        {/* Find Centers Near Me - Horizontal Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:py-3 sm:px-6 rounded-2xl bg-[#edf1ed] border border-[#d9e2d9]/50 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dee6de] text-emerald-850">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-slate-800">
                Find Centers Near Me
              </h3>
              <p className="text-[10px] text-slate-500 font-light italic leading-none mt-0.5">
                Feature coming in a later cycle.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Enter Zipcode"
              disabled
              className="w-full sm:w-48 text-xs px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white/70 text-slate-400 placeholder-slate-400 cursor-not-allowed focus:outline-none"
            />
            <button
              disabled
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#dee6de]/80 text-[#3b523b] cursor-not-allowed whitespace-nowrap"
            >
              Find
            </button>
          </div>
        </div>

        {/* Main 4 Cards Section */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* 1. Profile Card */}
            <Link
              href="/profile"
              className="group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors duration-200 group-hover:bg-slate-100 group-hover:text-slate-400">
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-slate-600">
                      Profile
                    </h3>
                    <svg className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 font-light leading-relaxed">
                    Check your details here. Need to make changes? Just ask an admin.
                  </p>
                </div>
              </div>
            </Link>

            {/* 2. Horizon Card */}
            <Link
              href="/horizon"
              className="group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors duration-200 roup-hover:bg-amber-100/70 group-hover:text-amber-600">
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M3 12h1.5m18 0H21m-9-9A9 9 0 1021 12a9 9 0 00-9-9zm0 3.75a5.25 5.25 0 105.25 5.25A5.25 5.25 0 0012 9.75zm0 2.25a3 3 0 103 3 3 3 0 00-3-3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-amber-700">
                      Horizon
                    </h3>
                    <svg className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 font-light leading-relaxed">
                    Explore assessments, skills, interests, and professional path highlights.
                  </p>
                </div>
              </div>
            </Link>

            {/* 3. Plan Card */}
            <Link
              href="/plan"
              className="group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50/70 text-indigo-500/90 transition-colors group-hover:bg-indigo-100/70 group-hover:text-indigo-700">
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                      Plan
                    </h3>
                    <svg className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 font-light leading-relaxed">
                    Review roadmap, achievements, goals, and core milestones.
                  </p>
                  {!isPageLoading && plan?.longTermGoal && (
                    <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 line-clamp-1">
                      <span className="font-semibold text-slate-800">Goal:</span> {plan.longTermGoal}
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* 4. Task Card */}
            <Link
              href="/tasks"
              className="group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100/70 group-hover:text-emerald-700">
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-emerald-700">
                      Tasks
                    </h3>
                    <svg className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 font-light leading-relaxed">
                    Daily actionable checklists and next step milestones.
                  </p>
                  {!isPageLoading && (
                    <div className="mt-2">
                      {pendingTasksCount > 0 ? (
                        <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50">
                          {pendingTasksCount} Action Items
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
                          All Completed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}
