'use client';

import React from 'react';
import { useApiQuery } from '@/hooks/use-api'; // Assuming hooks are in this path
import { CreateEnrollmentSchema } from '@impactforge/shared'; // Assuming shared DTOs are imported like this
import { format } from 'date-fns'; // For date formatting

// Define the structure of a single enrollment response from the API
// This should ideally match the structure returned by the backend API for enrollments.
// For now, we'll infer it from the DTO and prompt.
interface Enrollment {
  id: string; // Assuming an ID field exists for each enrollment
  participant_id: string;
  referral_id?: string | null;
  program_enrolled_in?: string | null;
  enrollment_date?: string | null; // ISO date string from backend
  intake_completion_date?: string | null; // ISO date string from backend
  eligibility_determination?: string | null;
  eligibility_date?: string | null; // ISO date string from backend
  // Add other fields if they are part of the API response, e.g., status, recruitment_source
  // Based on prompt: "Status, Referral Source/Type, Eligibility"
  // DTO has 'eligibility_determination', 'eligibility_date'.
  // Prompt also mentions 'Status' and 'Referral Source/Type'.
  // Let's assume these might come from the API response and add them as optional.
  status?: string | null;
  recruitment_source?: string | null;
}

interface EnrollmentListProps {
  participantId: string;
}

export const EnrollmentList: React.FC<EnrollmentListProps> = ({ participantId }) => {
  // Fetch enrollments for the given participant ID
  const { data: response, isLoading, error } = useApiQuery<{ data: Enrollment[]; total: number }>(
    ['participantEnrollments', participantId], // Query key
    `/enrollments?participantId=${participantId}`, // API endpoint
    {
      enabled: !!participantId, // Only fetch if participantId is present
    },
  );

// console.log('Enrollment API Response:', response);
  const enrollments = Array.isArray(response?.data) ? response.data : [];

  // Handle loading state
  if (isLoading) {
    return <div className="text-center p-4">Loading enrollments...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="text-center p-4 text-red-500">Error loading enrollments: {error.message}</div>;
  }

  // Handle empty state
  if (enrollments.length === 0) {
    return <div className="text-center p-4 text-gray-500">No enrollments found for this participant.</div>;
  }

  // Render the enrollments in a table
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Program
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enrollment Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Intake Completion
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Eligibility
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Eligibility Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recruitment Source
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {enrollments.map((enrollment) => (
            <tr key={enrollment.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {enrollment.program_enrolled_in || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'P') : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {enrollment.intake_completion_date ? format(new Date(enrollment.intake_completion_date), 'P') : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {enrollment.eligibility_determination || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {enrollment.eligibility_date ? format(new Date(enrollment.eligibility_date), 'P') : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {enrollment.recruitment_source || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

