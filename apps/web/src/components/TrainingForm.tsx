'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateTrainingDto,
  UpdateTrainingDto,
  CreateTrainingSchema,
  UpdateTrainingSchema,
  TrainingDto,
} from '@impactforge/shared';
import { useTrainings } from '@/hooks/use-trainings';
import { format, parseISO } from 'date-fns';

interface TrainingFormProps {
  participantId: string;
  initialData?: Partial<TrainingDto>;
  onSubmitSuccess?: (training: any) => void;
  onCancel?: () => void;
}

export const TrainingForm: React.FC<TrainingFormProps> = ({
  participantId,
  initialData,
  onSubmitSuccess,
  onCancel,
}) => {
  const isEditing = !!initialData?.id;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createTraining, updateTraining } = useTrainings(participantId);

  const formSchema = isEditing ? UpdateTrainingSchema : CreateTrainingSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTrainingDto>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      participant_id: participantId,
      program_name: '',
      provider: '',
      start_date: '',
      end_date: '',
      is_completed: false,
      completion_date: '',
      credential_earned: '',
      credential_type: '',
      license_earned: '',
      apprenticeship_participation: false,
      internship_participation: false,
      wbl_participation: false,
      ojt_participation: false,
      total_hours: null,
      stipend_provided: false,
      outcome: '',
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      const formattedData = {
        ...initialData,
        start_date: initialData.start_date ? format(parseISO(initialData.start_date), 'yyyy-MM-dd') : '',
        end_date: initialData.end_date ? format(parseISO(initialData.end_date), 'yyyy-MM-dd') : '',
        completion_date: initialData.completion_date ? format(parseISO(initialData.completion_date), 'yyyy-MM-dd') : '',
      };
      reset(formattedData as any);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<CreateTrainingDto> = (data) => {
    const payload = {
      ...data,
      start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
      end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      completion_date: data.completion_date ? new Date(data.completion_date).toISOString() : null,
    };

    const mutation = isEditing 
      ? updateTraining(initialData!.id!).mutate(payload as UpdateTrainingDto)
      : createTraining.mutate(payload);

    // Note: React Query mutation returns void, we handle callbacks in onSuccess/onError in useTrainings or here if we pass options
    // For simplicity, we'll assume onSuccess in hook handles invalidation.
    // We should actually handle response here or in hook for onSubmitSuccess
  };

  // Re-define mutation here to have direct access to onSuccess/onError for the form
  const mutation = isEditing
    ? updateTraining(initialData!.id!)
    : createTraining;

  const handleFormSubmit = (e: React.BaseSyntheticEvent) => {
    setSubmitError(null);
    return handleSubmit(
      (data) => {
        const payload = {
          ...data,
          start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
          end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
          completion_date: data.completion_date ? new Date(data.completion_date).toISOString() : null,
          total_hours: data.total_hours ? Number(data.total_hours) : 0,
        };

        mutation.mutate(payload as any, {
          onSuccess: (result) => {
            onSubmitSuccess?.(result);
            reset();
          },
          onError: (err: any) => {
            setSubmitError(err?.response?.data?.message || 'Failed to save training record.');
          }
        });
      },
      (errors) => {
        // Validation failed
      }
    )(e);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {submitError}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded">
          Please correct the highlighted errors before saving.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="program_name"
          control={control}
          render={({ field }) => (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Program Name</label>
              <input {...field} value={field.value || ''} className="input-field" placeholder="e.g. Advanced Manufacturing Cert" />
              {errors.program_name && <p className="text-red-500 text-xs mt-1">{errors.program_name.message}</p>}
            </div>
          )}
        />

        <Controller
          name="provider"
          control={control}
          render={({ field }) => (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Training Provider</label>
              <input {...field} value={field.value || ''} className="input-field" placeholder="e.g. City Community College" />
            </div>
          )}
        />

        <Controller
          name="start_date"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input {...field} value={field.value || ''} type="date" className="input-field" />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
          )}
        />

        <Controller
          name="end_date"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date / Expected</label>
              <input {...field} value={field.value || ''} type="date" className="input-field" />
              {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
            </div>
          )}
        />

        <Controller
          name="is_completed"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <div className="flex items-center gap-2 mt-2">
              <input 
                {...field} 
                type="checkbox" 
                checked={!!value} 
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300" 
              />
              <label className="text-sm font-medium text-slate-700">Training Completed</label>
            </div>
          )}
        />

        <Controller
          name="completion_date"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Completion Date</label>
              <input {...field} value={field.value || ''} type="date" className="input-field" />
              {errors.completion_date && <p className="text-red-500 text-xs mt-1">{errors.completion_date.message}</p>}
            </div>
          )}
        />

        <Controller
          name="credential_earned"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Credential Earned</label>
              <input {...field} value={field.value || ''} className="input-field" placeholder="e.g. OSHA 30" />
            </div>
          )}
        />

        <Controller
          name="credential_type"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Credential Type</label>
              <select {...field} value={field.value || ''} className="input-field">
                <option value="">Select...</option>
                <option value="Certificate">Certificate</option>
                <option value="Degree">Degree</option>
                <option value="License">License</option>
                <option value="Certification">Certification</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="total_hours"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Training Hours</label>
              <input 
                {...field}
                type="number" 
                min={0}
                value={field.value === null || field.value === undefined ? '' : field.value}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? null : Number(val));
                }}
                className="input-field" 
              />
              {errors.total_hours && <p className="text-red-500 text-xs mt-1">{errors.total_hours.message}</p>}
            </div>
          )}
        />

        <Controller
          name="outcome"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outcome</label>
              <select {...field} value={field.value || ''} className="input-field">
                <option value="">Select...</option>
                <option value="Successfully Completed">Successfully Completed</option>
                <option value="Dropped Out">Dropped Out</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Training' : 'Save Training')}
        </button>
      </div>
    </form>
  );
};

export default TrainingForm;
