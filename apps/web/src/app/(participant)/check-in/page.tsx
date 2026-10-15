'use client';

import { useState, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';

// ── Types ──

interface CheckIn {
  id: string;
  date: string;
  feeling: number;
  employmentStatus: string;
  hoursWorked: number;
  hoursSearching: number;
  hoursPrepping: number;
  challenges: string;
  needsHelp: string[];
  [key: string]: unknown;
}

interface CheckInPayload {
  feeling: number;
  employmentStatus: string;
  hoursWorked: number;
  hoursSearching: number;
  hoursPrepping: number;
  challenges: string;
  needsHelp: string[];
}

const HELP_OPTIONS = [
  'housing',
  'transportation',
  'childcare',
  'legal',
  'health',
  'financial',
  'other',
] as const;

const FEELING_EMOJIS = [
  { value: 1, emoji: '\uD83D\uDE1E', label: 'Very Bad' },
  { value: 2, emoji: '\uD83D\uDE1F', label: 'Bad' },
  { value: 3, emoji: '\uD83D\uDE10', label: 'Okay' },
  { value: 4, emoji: '\uD83D\uDE42', label: 'Good' },
  { value: 5, emoji: '\uD83D\uDE04', label: 'Great' },
];

const MOTIVATIONAL_MESSAGES = [
  'Great job checking in! Every step forward counts.',
  'Thank you for sharing. We are here to support you.',
  'Your progress matters. Keep going!',
  'Check-in complete! Remember, small wins add up.',
  'Well done! Consistency is the key to success.',
];

// ── Page ──

export default function CheckInPage() {
  const queryClient = useQueryClient();

  const [feeling, setFeeling] = useState(0);
  const [employmentStatus, setEmploymentStatus] = useState('searching');
  const [hoursWorked, setHoursWorked] = useState('');
  const [hoursSearching, setHoursSearching] = useState('');
  const [hoursPrepping, setHoursPrepping] = useState('');
  const [challenges, setChallenges] = useState('');
  const [needsHelp, setNeedsHelp] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState('');

  const { data: pastCheckInsRaw } = useApiQuery<any[]>(
    ['participant-check-ins'],
    '/participant-check-ins',
  );

  const pastCheckIns = useMemo<CheckIn[]>(() => {
    if (!Array.isArray(pastCheckInsRaw)) return [];
    return pastCheckInsRaw.map((ci) => ({
      id: ci.id,
      date: ci.date,
      feeling: ci.feeling,
      employmentStatus: ci.employment_status ?? ci.employmentStatus ?? 'searching',
      hoursWorked: Number(ci.hours_worked ?? ci.hoursWorked) || 0,
      hoursSearching: Number(ci.hours_searching ?? ci.hoursSearching) || 0,
      hoursPrepping: Number(ci.hours_prepping ?? ci.hoursPrepping) || 0,
      challenges: ci.challenges ?? '',
      needsHelp: ci.needs_help ?? ci.needsHelp ?? [],
    }));
  }, [pastCheckInsRaw]);

  const createCheckIn = useApiMutation<CheckIn, CheckInPayload>(
    '/participant-check-ins',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['participant-check-ins'] });
        setSubmitted(true);
        setMotivationalMsg(
          MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
        );
      },
    },
  );

  function toggleHelp(option: string) {
    setNeedsHelp((prev) =>
      prev.includes(option)
        ? prev.filter((h) => h !== option)
        : [...prev, option],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (feeling === 0) return;
    createCheckIn.mutate({
      feeling,
      employmentStatus,
      hoursWorked: Number(hoursWorked) || 0,
      hoursSearching: Number(hoursSearching) || 0,
      hoursPrepping: Number(hoursPrepping) || 0,
      challenges,
      needsHelp,
    });
  }

  function resetForm() {
    setFeeling(0);
    setEmploymentStatus('searching');
    setHoursWorked('');
    setHoursSearching('');
    setHoursPrepping('');
    setChallenges('');
    setNeedsHelp([]);
    setSubmitted(false);
    setMotivationalMsg('');
  }

  function feelingLabel(val: number): string {
    return FEELING_EMOJIS.find((f) => f.value === val)?.label ?? '';
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header section matching /plan */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Weekly Check-in</h1>
        <p className="text-sm text-slate-600 font-medium mt-0.5">
          Your safe space to share feelings, milestones, and support needs this week.
        </p>
      </div>

      {submitted ? (
        /* Success state */
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Check-in Submitted!
          </h2>
          <p className="text-sm text-slate-500 mb-6">{motivationalMsg}</p>
          <button
            type="button"
            className="btn-primary"
            onClick={resetForm}
          >
            Submit Another
          </button>
        </div>
      ) : (
        /* Check-in form */
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Feeling scale */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              How are you feeling?
            </label>
            <div className="flex items-center justify-between">
              {FEELING_EMOJIS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFeeling(f.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                    feeling === f.value
                      ? 'bg-blue-50 ring-2 ring-blue-500 scale-110'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-[10px] text-slate-500">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Employment status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Employment Status
            </label>
            <select
              className="input-field w-full"
              value={employmentStatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setEmploymentStatus(e.target.value)
              }
            >
              <option value="working">Working</option>
              <option value="searching">Searching</option>
              <option value="not_searching">Not Searching</option>
            </select>
          </div>

          {/* Hours worked / searching / prepping */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hours Worked
              </label>
              <input
                type="number"
                className="input-field w-full text-sm"
                placeholder="0"
                min="0"
                max="168"
                value={hoursWorked}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setHoursWorked(e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hours Searching
              </label>
              <input
                type="number"
                className="input-field w-full text-sm"
                placeholder="0"
                min="0"
                max="168"
                value={hoursSearching}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setHoursSearching(e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hours Prepping
              </label>
              <input
                type="number"
                className="input-field w-full text-sm"
                placeholder="0"
                min="0"
                max="168"
                value={hoursPrepping}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setHoursPrepping(e.target.value)
                }
              />
            </div>
          </div>

          {/* Combined Challenges & Support Needs Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Any challenges or support needs this week?
              </h3>
              
              <label className="block text-xs font-medium text-slate-500 mb-2">
                Click to tag specific areas you need help with:
              </label>
              <div className="flex flex-wrap gap-2">
                {HELP_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleHelp(opt)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      needsHelp.includes(opt)
                        ? 'bg-blue-600 text-white shadow-sm scale-102'
                        : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <textarea
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={4}
                placeholder="Share what has been on your mind..."
                value={challenges}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setChallenges(e.target.value)
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={feeling === 0 || createCheckIn.isPending}
          >
            {createCheckIn.isPending ? 'Submitting...' : 'Submit Check-in'}
          </button>
          {createCheckIn.isError && (
            <p className="text-sm text-red-600 text-center">
              Failed to submit. Please try again.
            </p>
          )}
        </form>
      )}

      {/* Past check-ins */}
      {pastCheckIns && pastCheckIns.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Past Check-ins
          </h2>
          <div className="space-y-2">
            {pastCheckIns.map((ci) => (
              <div
                key={ci.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {FEELING_EMOJIS.find((f) => f.value === ci.feeling)?.emoji ?? ''}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(ci.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {feelingLabel(ci.feeling)} - {ci.employmentStatus.replace('_', ' ')}
                      {(ci.hoursWorked > 0 || ci.hoursSearching > 0 || ci.hoursPrepping > 0) && (
                        <span>
                          {' - '}
                          {[
                            ci.hoursWorked > 0 && `${ci.hoursWorked}h worked`,
                            ci.hoursSearching > 0 && `${ci.hoursSearching}h searching`,
                            ci.hoursPrepping > 0 && `${ci.hoursPrepping}h prepping`,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {ci.needsHelp && ci.needsHelp.length > 0 && (
                  <div className="flex gap-1">
                    {ci.needsHelp.slice(0, 3).map((h) => (
                      <span
                        key={h}
                        className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
