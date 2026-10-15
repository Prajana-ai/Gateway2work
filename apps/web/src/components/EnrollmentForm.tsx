'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  CreateEnrollmentSchema,
  UpdateEnrollmentSchema,
} from '@impactforge/shared'; // Assuming shared DTOs are imported like this
import { useApiMutation } from '@/hooks/use-api'; // Assuming hooks are in this path
import { format, parseISO } from 'date-fns'; // For date formatting/parsing

// Define the type for form values, combining create and update fields
// Use partial for update, but for form, we need all fields potentially editable.
// For simplicity, we'll use CreateEnrollmentDto as the base form type
// and handle optionality in the form fields themselves.
type EnrollmentFormValues = CreateEnrollmentDto; // Base for form input

interface EnrollmentFormProps {
  participantId: string;
  referralId?: string;
  // Optional: provide initial data for editing an existing enrollment
  initialData?: Partial<EnrollmentFormValues> & { id: string };
  onSubmitSuccess?: (enrollment: CreateEnrollmentDto) => void;
  onCancel?: () => void;
}

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  participantId,
  referralId,
  initialData,
  onSubmitSuccess,
  onCancel,
}) => {
  const isEditing = !!initialData?.id;
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine the schema to use for validation based on edit/create mode
  const formSchema = isEditing ? UpdateEnrollmentSchema : CreateEnrollmentSchema;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      participant_id: participantId,
      referral_id: referralId || '',
      program_enrolled_in: '',
      enrollment_date: '',
      intake_completion_date: '',
      eligibility_determination: '',
      eligibility_date: '',
      reason_not_eligible: '',
      cohort_number: '',
      funding_source_tied_to_participant: '',
      recruitment_source: '',
      assessment_date: '',
      ips_participant_established_date: '',
      case_management_established_participant_date: '',
      ...initialData,
    },
  });

  // Watch for changes in eligibility_determination to conditionally show/hide fields
  const eligibilityDetermination = watch('eligibility_determination');

  // Effect to pre-fill referralId if not provided as initial data
  useEffect(() => {
    if (referralId && !initialData?.referral_id) {
      setValue('referral_id', referralId);
    }
  }, [referralId, initialData?.referral_id, setValue]);

  // Effect to reset form with initial data when it changes
  useEffect(() => {
    if (initialData) {
      // Format dates for input type="date"
      const formattedData = {
        ...initialData,
        enrollment_date: initialData.enrollment_date ? format(parseISO(initialData.enrollment_date), 'yyyy-MM-dd') : '',
        intake_completion_date: initialData.intake_completion_date ? format(parseISO(initialData.intake_completion_date), 'yyyy-MM-dd') : '',
        eligibility_date: initialData.eligibility_date ? format(parseISO(initialData.eligibility_date), 'yyyy-MM-dd') : '',
        assessment_date: initialData.assessment_date ? format(parseISO(initialData.assessment_date), 'yyyy-MM-dd') : '',
        ips_participant_established_date: initialData.ips_participant_established_date ? format(parseISO(initialData.ips_participant_established_date), 'yyyy-MM-dd') : '',
        case_management_established_participant_date: initialData.case_management_established_participant_date ? format(parseISO(initialData.case_management_established_participant_date), 'yyyy-MM-dd') : '',
      };
      reset(formattedData);
    }
  }, [initialData, reset]);

  const apiEndpoint = isEditing ? `/enrollments/${initialData?.id}` : '/enrollments';
  const mutationMethod = isEditing ? 'patch' : 'post';

  const { mutate: submitEnrollment, isPending: isSubmittingMutation } = useApiMutation<
    CreateEnrollmentDto, // Response type for success
    EnrollmentFormValues // Payload type for mutation
  >(apiEndpoint, mutationMethod, {
    onSuccess: (data) => {
      setSubmitError(null);
      // Assuming the API returns the created/updated enrollment object
      onSubmitSuccess?.(data);
      // Optionally reset form or navigate away
      reset(); // Reset form after successful submission
    },
    onError: (error: any) => {
      console.error('Enrollment submission failed:', error);
      setSubmitError(error?.response?.data?.message || 'An error occurred while saving the enrollment.');
    },
  });

  const onSubmit: SubmitHandler<EnrollmentFormValues> = (data) => {
    // Prepare data for submission: ensure dates are in ISO format if they were parsed from date inputs
    // CRITICAL: Filter out empty string referral_id to prevent Postgres UUID casting crashes
    const payload = {
      ...data,
      referral_id: data.referral_id || undefined,
      enrollment_date: data.enrollment_date ? new Date(data.enrollment_date).toISOString() : undefined,
      intake_completion_date: data.intake_completion_date ? new Date(data.intake_completion_date).toISOString() : undefined,
      eligibility_date: data.eligibility_date ? new Date(data.eligibility_date).toISOString() : undefined,
      assessment_date: data.assessment_date ? new Date(data.assessment_date).toISOString() : undefined,
      ips_participant_established_date: data.ips_participant_established_date ? new Date(data.ips_participant_established_date).toISOString() : undefined,
      case_management_established_participant_date: data.case_management_established_participant_date ? new Date(data.case_management_established_participant_date).toISOString() : undefined,
    };
    submitEnrollment(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participant ID - typically not editable */}
      <Controller
        name="participant_id"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Participant ID
            </label>
            <input
              {...field}
              id={field.name}
              type="text"
              readOnly // Make it read-only as it's determined by context
              disabled // Disable to prevent interaction
              className="input-field"
            />
            {errors.participant_id && <p className="text-red-500 text-sm mt-1">{errors.participant_id.message}</p>}
          </div>
        )}
      />

      {/* Referral ID - pre-filled if provided */}
      <Controller
        name="referral_id"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Referral ID
            </label>
            <input
              {...field}
              id={field.name}
              type="text"
              readOnly={!!referralId || isEditing} // Read-only if pre-filled from referral or editing
              disabled={!!referralId || isEditing}
              className="input-field"
            />
            {errors.referral_id && <p className="text-red-500 text-sm mt-1">{errors.referral_id.message}</p>}
          </div>
        )}
      />

      {/* Program Enrolled In */}
      <Controller
        name="program_enrolled_in"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Program Enrolled In
            </label>
            <input
              {...field}
              id={field.name}
              type="text"
              className="input-field"
            />
            {errors.program_enrolled_in && <p className="text-red-500 text-sm mt-1">{errors.program_enrolled_in.message}</p>}
          </div>
        )}
      />

      {/* Enrollment Date */}
      <Controller
        name="enrollment_date"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Enrollment Date
            </label>
            <input
              {...field}
              id={field.name}
              type="date"
              className="input-field"
            />
            {errors.enrollment_date && <p className="text-red-500 text-sm mt-1">{errors.enrollment_date.message}</p>}
          </div>
        )}
      />

      {/* Intake Completion Date */}
      <Controller
        name="intake_completion_date"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Intake Completion Date
            </label>
            <input
              {...field}
              id={field.name}
              type="date"
              className="input-field"
            />
            {errors.intake_completion_date && <p className="text-red-500 text-sm mt-1">{errors.intake_completion_date.message}</p>}
          </div>
        )}
      />

      {/* Eligibility Determination */}
      <Controller
        name="eligibility_determination"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Eligibility Determination
            </label>
            <select
              {...field}
              id={field.name}
              className="input-field"
            >
              <option value="">Select...</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not Eligible</option>
              {/* Add other relevant options if they exist */}
            </select>
            {errors.eligibility_determination && <p className="text-red-500 text-sm mt-1">{errors.eligibility_determination.message}</p>}
          </div>
        )}
      />

      {/* Eligibility Date (only shown if eligible) */}
      {eligibilityDetermination === 'eligible' && (
        <Controller
          name="eligibility_date"
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
                Eligibility Date
              </label>
              <input
                {...field}
                id={field.name}
                type="date"
                className="input-field"
              />
              {errors.eligibility_date && <p className="text-red-500 text-sm mt-1">{errors.eligibility_date.message}</p>}
            </div>
          )}
        />
      )}

      {/* Reason Not Eligible (only shown if not eligible) */}
      {eligibilityDetermination === 'not_eligible' && (
        <Controller
          name="reason_not_eligible"
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
                Reason Not Eligible
              </label>
              <input
                {...field}
                id={field.name}
                type="text"
                className="input-field"
              />
              {errors.reason_not_eligible && <p className="text-red-500 text-sm mt-1">{errors.reason_not_eligible.message}</p>}
            </div>
          )}
        />
      )}

      {/* Cohort Number */}
      <Controller
        name="cohort_number"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Cohort
            </label>
            <select
              {...field}
              id={field.name}
              className="input-field"
            >
              <option value="">Select...</option>
              <option value="Phase 1">Phase 1</option>
              <option value="Phase 2">Phase 2</option>
              <option value="Phase 3">Phase 3</option>
            </select>
            {errors.cohort_number && <p className="text-red-500 text-sm mt-1">{errors.cohort_number.message}</p>}
          </div>
        )}
      />

      {/* Funding Source Tied to Participant */}
      <Controller
        name="funding_source_tied_to_participant"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Funding Source Tied to Participant
            </label>
            <input
              {...field}
              id={field.name}
              type="text"
              className="input-field"
            />
            {errors.funding_source_tied_to_participant && <p className="text-red-500 text-sm mt-1">{errors.funding_source_tied_to_participant.message}</p>}
          </div>
        )}
      />

      {/* Recruitment Source */}
      <Controller
        name="recruitment_source"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Recruitment Source
            </label>
            <input
              {...field}
              id={field.name}
              type="text"
              className="input-field"
            />
            {errors.recruitment_source && <p className="text-red-500 text-sm mt-1">{errors.recruitment_source.message}</p>}
          </div>
        )}
      />

      {/* Assessment Date */}
      <Controller
        name="assessment_date"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Assessment Date
            </label>
            <input
              {...field}
              id={field.name}
              type="date"
              className="input-field"
            />
            {errors.assessment_date && <p className="text-red-500 text-sm mt-1">{errors.assessment_date.message}</p>}
          </div>
        )}
      />

      {/* IPS Participant Established Date */}
      <Controller
        name="ips_participant_established_date"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              IPS Participant Established Date
            </label>
            <input
              {...field}
              id={field.name}
              type="date"
              className="input-field"
            />
            {errors.ips_participant_established_date && <p className="text-red-500 text-sm mt-1">{errors.ips_participant_established_date.message}</p>}
          </div>
        )}
      />

      {/* Case Management Established Participant Date */}
      <Controller
        name="case_management_established_participant_date"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
              Case Management Established Participant Date
            </label>
            <input
              {...field}
              id={field.name}
              type="date"
              className="input-field"
            />
            {errors.case_management_established_participant_date && <p className="text-red-500 text-sm mt-1">{errors.case_management_established_participant_date.message}</p>}
          </div>
        )}
      />

      <div className="flex justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isSubmittingMutation}
          className="btn-primary"
        >
          {isSubmitting || isSubmittingMutation ? 'Saving...' : 'Save Enrollment'}
        </button>
      </div>
    </form>
  );
};

export default EnrollmentForm;
