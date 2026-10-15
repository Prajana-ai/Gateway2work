'use client';

import { useState, Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';
import { useQueryClient } from '@tanstack/react-query';
import EnrollmentForm from '@/components/EnrollmentForm'; // Import the EnrollmentForm component

interface ReferralDetail {
  id: string;
  participant_id: string;
  participantName: string;
  referral_source: string;
  referral_status: string;
  provider_agency_id?: string;
  provider_agency_name?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const statusFlow = ['pending', 'active', 'completed'];

export default function ReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('enroll') === 'true') {
      setIsEnrollmentModalOpen(true);
    }
  }, [searchParams]);

  const { data: referral, isLoading, refetch: refetchReferral } = useApiQuery<ReferralDetail>(
    ['referral', id],
    `/referrals/${id}`,
  );

  const updateStatus = useApiMutation<ReferralDetail, { status: string }>(
    `/referrals/${id}`,
    'patch',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['referral', id] });
        queryClient.invalidateQueries({ queryKey: ['referrals'] }); // Assuming a list query exists
      },
    },
  );

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate({ status: newStatus });
  }

  // --- Enrollment Modal Logic ---
  const handleCloseEnrollmentModal = () => {
    setIsEnrollmentModalOpen(false);
    if (searchParams.has('enroll')) {
      router.replace(`/referrals/${id}`, { scroll: false });
    }
  };

  const handleOpenAddEnrollmentModal = () => {
    setIsEnrollmentModalOpen(true);
  };

  const handleEnrollmentSubmitSuccess = () => {
    setIsEnrollmentModalOpen(false);
    if (searchParams.has('enroll')) {
      router.replace(`/referrals/${id}`, { scroll: false });
    }
    // Optionally, refetch referral details or navigate to participant's enrollment tab
    // For now, just close the modal. You might want to navigate or show a success message.
    // Enrollment created/updated successfully
  };
  // --- End Enrollment Modal Logic ---


  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="card space-y-4">
          <div className="h-4 w-64 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-4 w-56 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Referral not found.</p>
        <Link href="/referrals" className="mt-2 text-sm text-blue-600 hover:text-blue-700">
          Back to referrals
        </Link>
      </div>
    );
  }

  const currentIdx = statusFlow.indexOf((referral.referral_status || '').toLowerCase());
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1
    ? statusFlow[currentIdx + 1]
    : null;

  return (
    <div>
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Referrals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {referral.participantName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Referral #{referral.id.slice(0, 8)}
          </p>
        </div>
        <StatusBadge status={referral.referral_status} />
      </div>

      {/* Details Card */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Referral Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-slate-500">Participant</dt>
            <dd className="mt-1 text-sm text-slate-900">
              <Link
                href={`/participants/${referral.participant_id}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {referral.participantName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Source</dt>
            <dd className="mt-1 text-sm text-slate-900">{referral.referral_source || '--'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Provider Agency</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {referral.provider_agency_name || '--'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={referral.referral_status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Created</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {new Date(referral.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {new Date(referral.updatedAt).toLocaleString()}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-slate-500">Notes</dt>
            <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
              {referral.notes || 'No notes.'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Buttons */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Create Enrollment Button */}
          <button
            onClick={handleOpenAddEnrollmentModal}
            className="btn-primary"
          >
            Create Enrollment
          </button>

          {/* Status Update */}
          {nextStatus ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange(nextStatus)}
            >
              {updateStatus.isPending
                ? 'Updating...'
                : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
            </button>
          ) : (
            <p className="text-sm text-slate-500 self-center">
              This referral has been completed.
            </p>
          )}
          
          <Link href={`/participants/${referral.participant_id}`} className="btn-secondary">
            View Participant 360
          </Link>
        </div>
      </div>

      {/* Enrollment Modal */}
      {isEnrollmentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">
                New Enrollment
              </h3>
              <button
                onClick={handleCloseEnrollmentModal}
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <EnrollmentForm
                participantId={referral.participant_id} // Pass participant ID from referral
                referralId={referral.id}     // Pass current referral ID
                onSubmitSuccess={handleEnrollmentSubmitSuccess}
                onCancel={handleCloseEnrollmentModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
