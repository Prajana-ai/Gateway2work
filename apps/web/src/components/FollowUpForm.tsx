'use client';

import React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFollowUpSchema, CreateFollowUpDto } from '@impactforge/shared';

interface FollowUpFormProps {
  participantId: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  createFollowUp: (data: CreateFollowUpDto) => void;
  isSaving: boolean;
}

const booleanOutcomes = [
  { key: 'housing_improved', label: 'Housing Improved' },
  { key: 'transportation_improved', label: 'Transportation Improved' },
  { key: 'childcare_secured', label: 'Childcare Secured' },
  { key: 'id_obtained', label: 'ID Obtained' },
  { key: 'resume_completed', label: 'Resume Completed' },
  { key: 'interview_completed', label: 'Interview Completed' },
  { key: 'increased_confidence', label: 'Increased Confidence' },
];

export const FollowUpForm: React.FC<FollowUpFormProps> = ({
  participantId,
  onSubmitSuccess,
  onCancel,
  createFollowUp,
  isSaving,
}) => {
  const { register, handleSubmit, control } = useForm<any>({
    resolver: zodResolver(CreateFollowUpSchema),
    defaultValues: {
      participant_id: participantId,
      status: 'pending',
      due_date: new Date().toISOString().split('T')[0],
      outcome_metrics: {},
      employment_at_follow_up: false,
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => {
    // Map individual outcome fields into outcome_metrics JSONB
    const outcome_metrics: Record<string, any> = {};
    booleanOutcomes.forEach((out) => {
      outcome_metrics[out.key] = !!data[out.key];
    });
    
    createFollowUp({
      ...data,
      outcome_metrics,
    });
    onSubmitSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Due Date</label>
          <input type="date" {...register('due_date')} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select {...register('status')} className="input-field w-full">
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Outcomes Achieved</label>
        <div className="grid grid-cols-2 gap-2">
          {booleanOutcomes.map((out) => (
            <label key={out.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(out.key)} />
              {out.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
             <input type="checkbox" {...register('employment_at_follow_up')} />
             Employed at follow-up
           </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Wage at follow-up</label>
          <input type="number" step="0.01" {...register('wage_at_follow_up', { setValueAs: v => v ? parseFloat(v) : null })} className="input-field w-full" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Continued Service Needs</label>
        <textarea {...register('continued_service_needs')} className="input-field w-full" rows={2} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Notes</label>
        <textarea {...register('notes')} className="input-field w-full" rows={2} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={isSaving} className="btn-primary">
          {isSaving ? 'Saving...' : 'Save Follow-up'}
        </button>
      </div>
    </form>
  );
};
