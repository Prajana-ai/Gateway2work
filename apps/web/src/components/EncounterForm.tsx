'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useApiMutation, useApiQuery } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import {
  ServiceType,
  ServiceLocation,
  ServiceDeliveryMode,
  ServiceFormat,
  RecoveryStatus,
  RecoveryStage,
  BenefitsCounselingType,
  CareerCoachingType,
  CaseManagementType,
  InterviewPreparationType,
  JobSearchAssistanceType,
} from '@impactforge/shared';

interface Participant {
  id: string;
  demographics: {
    first_name: string;
    last_name: string;
  };
}

interface ParticipantSearchResponse {
  data: Participant[];
  total: number;
}

interface EncounterFormProps {
  participantId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface EncounterFormValues {
  participantId: string;
  encounterDate: string;
  durationMinutes: number;
  notes: string;
  billable: boolean;
  serviceType: string;
  serviceSubcategory: string;
  partnerOrganizationName: string;
  location: ServiceLocation;
  deliveryMode: ServiceDeliveryMode;
  format: ServiceFormat;
  recoveryStatus: string;
  recoveryStage: string;
  // Barriers/Needs (simplified for form)
  substanceUseTreatment: string;
  behavioralHealthTreatment: string;
  housingInstability: string;
  foodInsecurity: string;
  childcareNeed: string;
  transportationNeed: string;
}

export function EncounterForm({ participantId, onSuccess, onCancel }: EncounterFormProps) {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [participantSearch, setParticipantSearch] = useState('');
  const [debouncedParticipantSearch, setDebouncedParticipantSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ 
    service: true,
    recovery: false,
    needs: false
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EncounterFormValues>({
    defaultValues: {
      participantId: participantId || '',
      encounterDate: new Date().toISOString().slice(0, 16), // datetime-local format
      durationMinutes: 30,
      notes: '',
      billable: true,
      serviceType: '',
      serviceSubcategory: '',
      location: ServiceLocation.Office,
      deliveryMode: ServiceDeliveryMode.InPerson,
      format: ServiceFormat.Individual,
      recoveryStatus: '',
      recoveryStage: '',
    }
  });

  const watchedServiceType = watch('serviceType');

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

  // Participant search query
  const { data: participantResults } = useApiQuery<ParticipantSearchResponse>(
    ['participant-search', debouncedParticipantSearch],
    `/participants?search=${encodeURIComponent(debouncedParticipantSearch)}&limit=10`,
    { enabled: !participantId && debouncedParticipantSearch.length >= 2 },
  );

  const createEncounter = useApiMutation('/encounters', 'post', {
    onSuccess: () => {
      const pid = participantId || selectedParticipant?.id;
      if (pid) {
        queryClient.invalidateQueries({ queryKey: ['participant', pid] });
        queryClient.invalidateQueries({ queryKey: ['encounters'] });
      }
      onSuccess();
    }
  });

  const onSubmit: SubmitHandler<EncounterFormValues> = (data) => {
    const finalParticipantId = participantId || selectedParticipant?.id;
    if (!finalParticipantId) return;

    createEncounter.mutate({
      ...data,
      participantId: finalParticipantId,
      durationMinutes: Number(data.durationMinutes),
      encounterDate: new Date(data.encounterDate).toISOString(),
      // Ensure empty strings are sent as undefined if backend expects that
      serviceType: data.serviceType || undefined,
      serviceSubcategory: data.serviceSubcategory || undefined,
      recoveryStatus: data.recoveryStatus || undefined,
      recoveryStage: data.recoveryStage || undefined,
    });
  };

  const subcategoryOptions = useMemo(() => {
    switch (watchedServiceType) {
      case ServiceType.BenefitsCounseling: return Object.values(BenefitsCounselingType);
      case ServiceType.CareerCoaching: return Object.values(CareerCoachingType);
      case ServiceType.CaseManagement: return Object.values(CaseManagementType);
      case ServiceType.InterviewPreparation: return Object.values(InterviewPreparationType);
      case ServiceType.JobSearchAssistance: return Object.values(JobSearchAssistanceType);
      default: return [];
    }
  }, [watchedServiceType]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participant Selection (only if not provided) */}
        {!participantId && (
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Participant
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="Search participant..."
              value={participantSearch}
              onChange={(e) => {
                setParticipantSearch(e.target.value);
                setSelectedParticipant(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
            {showDropdown && (participantResults?.data?.length ?? 0) > 0 && !selectedParticipant && (
              <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white shadow-xl ring-1 ring-slate-200">
                {participantResults!.data.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setSelectedParticipant(p);
                        setParticipantSearch(`${p.demographics.first_name} ${p.demographics.last_name}`);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-bold text-slate-900">{p.demographics.first_name} {p.demographics.last_name}</span>
                      <span className="ml-2 text-xs text-slate-400">ID: ...{p.id.slice(-6)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Date & Time */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date & Time</label>
          <input type="datetime-local" {...register('encounterDate', { required: true })} className="input-field w-full" />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Duration (min)</label>
          <input type="number" {...register('durationMinutes', { required: true, min: 1 })} className="input-field w-full" />
        </div>

        {/* Billable */}
        <div className="flex items-center gap-3 pt-6">
          <input type="checkbox" {...register('billable')} id="billable" className="h-5 w-5 rounded border-slate-300 text-blue-600" />
          <label htmlFor="billable" className="text-sm font-bold text-slate-700">Billable for Medicaid</label>
        </div>
      </div>

      {/* ── Service Classification ── */}
      <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100">
        <button type="button" onClick={() => toggleSection('service')} className="flex items-center justify-between w-full">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Service Classification</h3>
          <span className="text-slate-400">{expandedSections.service ? '−' : '+'}</span>
        </button>
        {expandedSections.service && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Type</label>
              <select {...register('serviceType')} className="input-field w-full">
                <option value="">Select Category</option>
                {Object.values(ServiceType).map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subcategory</label>
              <select {...register('serviceSubcategory')} className="input-field w-full" disabled={subcategoryOptions.length === 0}>
                <option value="">Select Sub-Type</option>
                {subcategoryOptions.map(o => (
                  <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Partner Organization</label>
              <input type="text" {...register('partnerOrganizationName')} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Location</label>
              <select {...register('location')} className="input-field w-full">
                {Object.values(ServiceLocation).map(l => (
                  <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Clinical/Progress Notes</label>
        <textarea {...register('notes')} className="input-field w-full h-32" placeholder="Detail the interaction, goals discussed, and next steps..." />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createEncounter.isPending || (!participantId && !selectedParticipant)}
          className="btn-primary px-8"
        >
          {createEncounter.isPending ? 'Saving...' : 'Save Encounter'}
        </button>
      </div>
    </form>
  );
}
