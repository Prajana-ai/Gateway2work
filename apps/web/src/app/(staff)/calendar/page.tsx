'use client';

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';

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

interface CalendarEventRaw {
  id: string;
  title: string;
  event_type: string;
  participant_name?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_virtual?: boolean;
  meeting_url?: string;
  notes?: string;
  [key: string]: unknown;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'appointment' | 'interview' | 'check_in' | 'assessment';
  participantName?: string;
  startTime: string;
  endTime: string;
  location?: string;
  virtual?: boolean;
  meetingUrl?: string;
  notes?: string;
}

interface PaginatedEvents {
  data: CalendarEventRaw[];
  total: number;
  page: number;
  limit: number;
}

function mapEvent(raw: CalendarEventRaw): CalendarEvent {
  return {
    id: raw.id,
    title: raw.title,
    type: (raw.event_type || 'appointment') as CalendarEvent['type'],
    participantName: raw.participant_name,
    startTime: raw.start_time,
    endTime: raw.end_time,
    location: raw.location,
    virtual: raw.is_virtual,
    meetingUrl: raw.meeting_url,
    notes: raw.notes,
  };
}

interface EventPayload {
  title: string;
  eventType: string;
  participantId?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;
  notes?: string;
}

// ── Helpers ──

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${weekStart.toLocaleDateString(undefined, opts)} - ${weekEnd.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const EVENT_COLORS: Record<string, string> = {
  appointment: 'bg-blue-100 border-blue-400 text-blue-800',
  interview: 'bg-green-100 border-green-400 text-green-800',
  check_in: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  assessment: 'bg-purple-100 border-purple-400 text-purple-800',
};

const EVENT_TYPES = ['appointment', 'interview', 'check_in', 'assessment'] as const;

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am to 6pm
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Page ──

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('appointment');
  const [participantSearch, setParticipantSearch] = useState('');
  const [debouncedParticipantSearch, setDebouncedParticipantSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [virtual, setVirtual] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
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

  const weekEnd = addDays(weekStart, 6);
  const upcomingEnd = addDays(new Date(), 7);

  // Queries
  const { data: participantResults } = useApiQuery<ParticipantSearchResponse>(
    ['participant-search-cal', debouncedParticipantSearch],
    `/participants?search=${encodeURIComponent(debouncedParticipantSearch)}&limit=10`,
    { enabled: debouncedParticipantSearch.length >= 2 },
  );

  const { data: eventsPage, isLoading } = useApiQuery<PaginatedEvents>(
    ['events', toISODate(weekStart), toISODate(weekEnd)],
    `/events?startDate=${toISODate(weekStart)}&endDate=${toISODate(weekEnd)}&limit=100`,
  );
  const events = eventsPage?.data?.map(mapEvent) ?? [];

  const { data: upcomingPage } = useApiQuery<PaginatedEvents>(
    ['events-upcoming', toISODate(new Date()), toISODate(upcomingEnd)],
    `/events?startDate=${toISODate(new Date())}&endDate=${toISODate(upcomingEnd)}&limit=100`,
  );
  const upcomingEvents = upcomingPage?.data?.map(mapEvent) ?? [];

  const createEvent = useApiMutation<CalendarEvent, EventPayload>(
    '/events',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['events-upcoming'] });
        setShowForm(false);
        resetForm();
      },
    },
  );

  function resetForm() {
    setTitle('');
    setType('appointment');
    setParticipantSearch('');
    setDebouncedParticipantSearch('');
    setSelectedParticipant(null);
    setStartDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setVirtual(false);
    setMeetingUrl('');
    setNotes('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !startDate) return;

    createEvent.mutate({
      title,
      eventType: type,
      participantId: selectedParticipant?.id,
      startTime: new Date(`${startDate}T${startTime}`).toISOString(),
      endTime: new Date(`${startDate}T${endTime}`).toISOString(),
      location: location || undefined,
      isVirtual: virtual,
      meetingUrl: virtual ? meetingUrl : undefined,
      notes: notes || undefined,
    });
  }

  // Map events to day/hour grid
  function getEventsForSlot(dayIdx: number, hour: number): CalendarEvent[] {
    const slotDate = addDays(weekStart, dayIdx);
    return events.filter((ev) => {
      const evDate = new Date(ev.startTime);
      return (
        evDate.getDate() === slotDate.getDate() &&
        evDate.getMonth() === slotDate.getMonth() &&
        evDate.getFullYear() === slotDate.getFullYear() &&
        evDate.getHours() === hour
      );
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule and manage participant events.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          New Event
        </button>
      </div>

      <div className="flex gap-6">
        {/* Week View */}
        <div className="flex-1">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {formatDateRange(weekStart)}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
            >
              Next
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200">
                <div className="px-2 py-3 text-xs font-semibold text-slate-400" />
                {DAYS.map((day, idx) => {
                  const date = addDays(weekStart, idx);
                  return (
                    <div key={day} className="px-2 py-3 text-center">
                      <div className="text-xs font-semibold uppercase text-slate-500">
                        {day}
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100"
                  >
                    <div className="px-2 py-2 text-xs text-slate-400 text-right pr-3 pt-1">
                      {hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`}
                    </div>
                    {DAYS.map((_, dayIdx) => {
                      const slotEvents = getEventsForSlot(dayIdx, hour);
                      return (
                        <div
                          key={dayIdx}
                          className="min-h-[48px] border-l border-slate-100 px-1 py-0.5"
                        >
                          {slotEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={`rounded border-l-2 px-1.5 py-0.5 text-xs truncate mb-0.5 ${
                                EVENT_COLORS[ev.type] ?? EVENT_COLORS.appointment
                              }`}
                              title={`${ev.title}${ev.participantName ? ` - ${ev.participantName}` : ''}`}
                            >
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {EVENT_TYPES.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded ${EVENT_COLORS[t].split(' ')[0]}`} />
                {t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <aside className="w-72 shrink-0 hidden lg:block">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Upcoming (Next 7 Days)
            </h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingEvents.slice(0, 10).map((ev) => (
                  <div key={ev.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          EVENT_COLORS[ev.type]?.split(' ')[0] ?? 'bg-blue-100'
                        }`}
                      />
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {ev.title}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(ev.startTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(ev.startTime).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    {ev.participantName && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {ev.participantName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming events.</p>
            )}
          </div>
        </aside>
      </div>

      {/* ── New Event Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              New Event
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Event title"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  className="input-field w-full"
                  value={type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
                >
                  <option value="appointment">Appointment</option>
                  <option value="interview">Interview</option>
                  <option value="check_in">Check-in</option>
                  <option value="assessment">Assessment</option>
                </select>
              </div>

              {/* Client search */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Participant (optional)
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
                    <ul className="absolute z-10 mt-1 max-h-36 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-slate-200">
                      {participantResults.items.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => {
                              setSelectedParticipant(c);
                              setParticipantSearch(`${c.firstName} ${c.lastName}`);
                              setShowDropdown(false);
                            }}
                          >
                            {c.firstName} {c.lastName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              {/* Date and Times */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="input-field w-full"
                    value={startTime}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    className="input-field w-full"
                    value={endTime}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Office, participant site, etc."
                  value={location}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                />
              </div>

              {/* Virtual toggle */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={virtual}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setVirtual(e.target.checked)}
                  />
                  Virtual Meeting
                </label>
              </div>

              {virtual && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meeting URL
                  </label>
                  <input
                    type="url"
                    className="input-field w-full"
                    placeholder="https://..."
                    value={meetingUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMeetingUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="input-field w-full"
                  rows={2}
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!title || !startDate || createEvent.isPending}
                >
                  {createEvent.isPending ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
              {createEvent.isError && (
                <p className="text-sm text-red-600">
                  Failed to create event. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
