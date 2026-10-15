'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

interface ParticipantOption {
  id: string;
  demographics: {
    first_name: string;
    last_name: string;
  };
}

interface ParticipantSearchResponse {
  data: ParticipantOption[];
}

interface NewReferral {
  id: string;
}

export default function NewReferralPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantOption | null>(null);
  const [isNewParticipant, setIsNewParticipant] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [externalEhrId, setExternalEhrId] = useState('');
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [providerAgency, setProviderAgency] = useState('');
  const [referralDate, setReferralDate] = useState(new Date().toISOString().split('T')[0]);
  const [referralType, setReferralType] = useState('direct');
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);

  const createReferral = useApiMutation<
    NewReferral, 
    { 
      participant_id?: string; 
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      externalEhrId?: string;
      provider_agency_name: string; 
      notes: string 
    }
  >(
    '/referrals',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['referrals'] });
        queryClient.invalidateQueries({ queryKey: ['recent-referrals'] });
        router.push('/referrals');
      },
    },
  );

  useEffect(() => {
    if (justSelectedRef.current || isNewParticipant) {
      justSelectedRef.current = false;
      return;
    }
    if (participantSearch.length < 2) {
      setParticipantOptions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await apiClient.get<ParticipantSearchResponse>(
          `/participants?search=${encodeURIComponent(participantSearch)}&limit=10`,
        );
        setParticipantOptions(response.data || []);
        setShowDropdown(true);
      } catch {
        setParticipantOptions([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [participantSearch, isNewParticipant]);

    function handleSelectParticipant(participant: ParticipantOption) {
      justSelectedRef.current = true;
      setSelectedParticipant(participant);
      setIsNewParticipant(false);
      const firstName = participant.demographics?.first_name || '';
      const lastName = participant.demographics?.last_name || '';
      setParticipantSearch(`${firstName} ${lastName}`.trim());
      setShowDropdown(false);
      // Wait a bit before allowing new searches to prevent immediate re-triggering
      setTimeout(() => { justSelectedRef.current = false; }, 1000);
    }

  function handleStartNewParticipant() {
    setIsNewParticipant(true);
    setSelectedParticipant(null);
    setShowDropdown(false);
    
    // Attempt to split search text into first/last name
    const parts = participantSearch.trim().split(/\s+/);
    if (parts.length > 0) {
      setFirstName(parts[0]);
      if (parts.length > 1) {
        setLastName(parts.slice(1).join(' '));
      }
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedParticipant && !isNewParticipant) return;

    const payload = isNewParticipant 
      ? {
          firstName,
          lastName,
          dateOfBirth,
          externalEhrId,
          provider_agency_name: providerAgency,
          referralDate,
          referralType,
          notes,
        }
      : {
          participant_id: selectedParticipant!.id,
          provider_agency_name: providerAgency,
          referralDate,
          referralType,
          notes,
        };

    createReferral.mutate(payload);
  }

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Referral</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Participant Search / Toggle */}
        <div className="relative">
          <div className="flex justify-between items-end mb-1">
            <label htmlFor="participant-search" className="block text-sm font-medium text-slate-700">
              {isNewParticipant ? 'Participant Search' : 'Participant *'}
            </label>
            {isNewParticipant ? (
              <button 
                type="button" 
                onClick={() => setIsNewParticipant(false)}
                className="text-xs text-blue-600 hover:underline"
              >
                Search existing
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => handleStartNewParticipant()}
                className="text-xs text-blue-600 hover:underline"
              >
                Create new participant
              </button>
            )}
          </div>

          {!isNewParticipant ? (
            <>
              <input
                id="participant-search"
                type="text"
                className="input-field"
                placeholder="Search participants by name..."
                value={participantSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setParticipantSearch(e.target.value);
                  // Don't clear selectedParticipant here to allow refining search
                }}
              />
              {searching && (
                <div className="absolute right-3 top-9">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              )}
              {showDropdown && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-slate-200 max-h-48 overflow-auto">
                  {participantOptions.length > 0 ? (
                    <>
                      {participantOptions.map((participant) => (
                        <li key={participant.id}>
                          <button
                            type="button"
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                            onClick={() => handleSelectParticipant(participant)}
                          >
                            {participant.demographics?.first_name} {participant.demographics?.last_name}
                          </button>
                        </li>
                      ))}
                      <li className="border-t border-slate-100">
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 hover:bg-slate-50"
                          onClick={() => handleStartNewParticipant()}
                        >
                          + Create new participant: "{participantSearch}"
                        </button>
                      </li>
                    </>
                  ) : !searching && (
                    <li>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-slate-900 hover:bg-slate-50"
                        onClick={() => handleStartNewParticipant()}
                      >
                        <span className="block text-slate-500 mb-1">No participants found.</span>
                        <span className="font-medium text-blue-600">+ Create new participant: "{participantSearch}"</span>
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </>
          ) : (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    className="input-field bg-white"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Name *</label>
                  <input
                    type="text"
                    className="input-field bg-white"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    className="input-field bg-white"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">External ID (Optional)</label>
                  <input
                    type="text"
                    className="input-field bg-white"
                    value={externalEhrId}
                    onChange={(e) => setExternalEhrId(e.target.value)}
                    placeholder="EHR ID"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Provider Agency & Referral Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="provider-agency" className="block text-sm font-medium text-slate-700 mb-1">
              Referral Source *
            </label>
            <select
              id="provider-agency"
              className="input-field"
              value={providerAgency}
              onChange={(e) => setProviderAgency(e.target.value)}
              required
            >
              <option value="">Select...</option>
              <option value="Probation">Probation</option>
              <option value="Prison">Prison</option>
              <option value="Court Order">Court Order</option>
              <option value="Jail">Jail</option>
              <option value="Hospital">Hospital</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="referral-type" className="block text-sm font-medium text-slate-700 mb-1">
              Referral Type
            </label>
            <select
              id="referral-type"
              className="input-field"
              value={referralType}
              onChange={(e) => setReferralType(e.target.value)}
            >
              <option value="direct">Direct</option>
              <option value="warm_handoff">Warm Handoff</option>
              <option value="urgent">Urgent</option>
              <option value="self_referral">Self Referral</option>
            </select>
          </div>
          <div>
            <label htmlFor="referral-date" className="block text-sm font-medium text-slate-700 mb-1">
              Referral Date
            </label>
            <input
              id="referral-date"
              type="date"
              className="input-field"
              value={referralDate}
              onChange={(e) => setReferralDate(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            className="input-field min-h-[120px] resize-y"
            placeholder="Additional notes about this referral..."
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNotes(e.target.value)
            }
          />
        </div>

        {/* Error */}
        {createReferral.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {((createReferral.error as any)?.response?.data?.error) || 'Failed to create referral. Please try again.'}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={(!selectedParticipant && !isNewParticipant) || !providerAgency || createReferral.isPending}
          >
            {createReferral.isPending ? 'Creating...' : 'Create Referral'}
          </button>
        </div>
      </form>
    </div>
  );
}
