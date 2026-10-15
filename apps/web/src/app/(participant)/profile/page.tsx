'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useApiQuery } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';

interface Participant360View {
  participant: {
    id: string;
    participant_id?: string;
    external_ehr_id?: string;
    status: string;
    consent_42cfr?: boolean;
    consent_expires_at?: string;
    demographics?: {
      first_name?: string;
      last_name?: string;
      preferred_name?: string;
      date_of_birth?: string;
      primary_language?: string;
      email?: string;
      phone?: string;
      preferred_contact_method?: string;
      address?: string;
      city?: string;
      county?: string;
      zip_code?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      gender?: string;
      pronouns?: string;
      race?: string | string[];
      ethnicity?: string;
      veteran_status?: string;
      disability_status?: string;
      citizenship_status?: string;
      household_size?: number;
      dependents_count?: number;
      parenting_status?: string;
      marital_status?: string;
    };
    legal_info?: {
      consent_signed?: boolean;
      consent_date?: string;
      roi_signed?: boolean;
      roi_expiration_date?: string;
      staff_assigned?: string;
      case_manager_assigned?: string;
    };
    socioeconomic?: {
      housing_status_at_intake?: string;
      residence_type?: string;
      transportation_access?: string;
      needs_drivers_license?: boolean;
      internet_access?: string;
      device_access?: string;
    };
  };
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}

function calculateAge(dobStr?: string | null) {
  if (!dobStr) return null;
  try {
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch (e) {
    return null;
  }
}

function formatRace(race?: string | string[]) {
  if (!race) return '--';
  if (Array.isArray(race)) return race.join(', ');
  return race;
}

export default function ParticipantProfilePage() {
  const user = useAuthStore((s) => s.user);
  const participantId = user?.id ?? '';

  const { data: view360, isLoading, isError } = useApiQuery<Participant360View>(
    ['participant-profile', participantId],
    `/participants/${participantId}/360`,
    { enabled: !!participantId },
  );

  const participant = view360?.participant;
  const demographics = participant?.demographics;
  const legalInfo = participant?.legal_info;
  const socioeconomic = participant?.socioeconomic;

  const fullName = `${demographics?.first_name || ''} ${demographics?.last_name || ''}`.trim() || 'Participant';
  const age = calculateAge(demographics?.date_of_birth);
  const initials = `${(demographics?.first_name?.[0] || 'P')}${(demographics?.last_name?.[0] || '')}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Skeleton Loading State */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl h-64 border border-slate-200 p-6" />
            <div className="bg-white rounded-2xl h-64 border border-slate-200 p-6" />
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-red-900">Unable to load profile details</h3>
          <p className="text-sm text-red-600">Please try refreshing or contact support if this issue persists.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Header Card / Identity Banner */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{fullName}</h1>
                  {demographics?.preferred_name && (
                    <span className="text-sm font-medium text-slate-500 italic">
                      ("{demographics.preferred_name}")
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {participant?.status && <StatusBadge status={participant.status} />}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${participant?.consent_42cfr ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {participant?.consent_42cfr ? '✓ 42 CFR Consented' : 'No 42 CFR Consent'}
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-500">
                  <span>ID: <strong className="text-blue-700 font-bold">{participant?.participant_id || '--'}</strong></span>
                  {participant?.external_ehr_id && (
                    <span>EHR ID: <strong className="text-slate-700">{participant.external_ehr_id}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Contact Information */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.47-5.116-3.762-6.586-6.586l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Contact Information
              </h2>

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</dt>
                  <dd className="text-slate-900 font-medium text-right break-all">{demographics?.email || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</dt>
                  <dd className="text-slate-900 font-medium text-right">{demographics?.phone || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preferred Contact</dt>
                  <dd className="text-slate-900 font-medium capitalize text-right">{demographics?.preferred_contact_method || '--'}</dd>
                </div>
                <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</dt>
                  <dd className="text-slate-900 font-medium text-right leading-tight">
                    {demographics?.address ? (
                      <>
                        {demographics.address}<br />
                        {demographics.city ? `${demographics.city}, ` : ''}{demographics.county ? `${demographics.county} ` : ''}{demographics.zip_code || ''}
                      </>
                    ) : (
                      '--'
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Emergency Contact</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {demographics?.emergency_contact_name ? (
                      <>
                        {demographics.emergency_contact_name}
                        {demographics.emergency_contact_phone && (
                          <span className="block text-xs text-slate-500 font-mono mt-0.5">{demographics.emergency_contact_phone}</span>
                        )}
                      </>
                    ) : (
                      '--'
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 2. Demographics & Background */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Personal Demographics
              </h2>

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center gap-4">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date of Birth</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {formatDate(demographics?.date_of_birth)} {age !== null && <span className="text-slate-500 text-xs">(Age {age})</span>}
                  </dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Primary Language</dt>
                  <dd className="text-slate-900 font-medium text-right">{demographics?.primary_language || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gender / Pronouns</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {demographics?.gender || '--'} {demographics?.pronouns ? `(${demographics.pronouns})` : ''}
                  </dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Race / Ethnicity</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {formatRace(demographics?.race)} / {demographics?.ethnicity || '--'}
                  </dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Veteran Status</dt>
                  <dd className="text-slate-900 font-medium text-right">{demographics?.veteran_status || 'No'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Work Authorization</dt>
                  <dd className="text-slate-900 font-medium text-right">{demographics?.citizenship_status || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Household / Dependents</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    Size: {demographics?.household_size ?? '--'} | Dependents: {demographics?.dependents_count ?? '--'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 3. Care & Legal Team */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.97 5.97 0 00-.942 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Assigned Care Team & Legal
              </h2>

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center gap-4">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Specialist</dt>
                  <dd className="text-slate-900 font-medium text-right">{legalInfo?.staff_assigned || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Case Manager / Navigator</dt>
                  <dd className="text-slate-900 font-medium text-right">{legalInfo?.case_manager_assigned || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Consent Agreement</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {legalInfo?.consent_signed ? (
                      <span className="text-emerald-700 font-bold">Signed {legalInfo.consent_date ? `(${formatDate(legalInfo.consent_date)})` : ''}</span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ROI Expiration Date</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {legalInfo?.roi_expiration_date ? formatDate(legalInfo.roi_expiration_date) : '--'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 4. Socioeconomic Status */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h-1.5m1.5 0v-4.875c0-.621-.504-1.125-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125V21M3 21h4.5M3 3.75h18M3.75 3.75v17.25m16.5-17.25v17.25" />
                </svg>
                Living & Resource Status
              </h2>

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center gap-4">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Housing Status</dt>
                  <dd className="text-slate-900 font-medium text-right">{socioeconomic?.housing_status_at_intake || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Residence Area</dt>
                  <dd className="text-slate-900 font-medium capitalize text-right">{socioeconomic?.residence_type || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transportation</dt>
                  <dd className="text-slate-900 font-medium text-right">
                    {socioeconomic?.transportation_access || '--'}
                    {socioeconomic?.needs_drivers_license !== undefined && (
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {socioeconomic.needs_drivers_license ? 'Valid Driver\'s License' : 'No Driver\'s License'}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Internet Access</dt>
                  <dd className="text-slate-900 font-medium text-right">{socioeconomic?.internet_access || '--'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-50 pt-2.5">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Device Access</dt>
                  <dd className="text-slate-900 font-medium text-right">{socioeconomic?.device_access || '--'}</dd>
                </div>
              </dl>
            </div>

          </div>

          {/* Information Note */}
          <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 sm:p-5 flex items-start gap-3.5 text-xs text-blue-800">
            <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div className="space-y-1">
              <p className="font-bold text-blue-900">Need to update your contact information or address?</p>
              <p className="text-blue-700 leading-relaxed">
                To request updates to your profile details, phone number, or address, please get in touch with your assigned navigator or case manager.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
