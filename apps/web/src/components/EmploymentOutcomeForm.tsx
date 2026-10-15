'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEmploymentOutcomeSchema, CreateEmploymentOutcomeDto } from '@impactforge/shared';

interface EmploymentOutcomeFormProps {
  participantId: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  createOutcome: (data: CreateEmploymentOutcomeDto) => void;
  isSaving: boolean;
}

export const EmploymentOutcomeForm: React.FC<EmploymentOutcomeFormProps> = ({
  participantId,
  onSubmitSuccess,
  onCancel,
  createOutcome,
  isSaving,
}) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(CreateEmploymentOutcomeSchema),
    defaultValues: {
      participant_id: participantId,
      recovery_friendly: false,
      second_chance: false,
      is_union_job: false,
      retention_90_day: false,
      employed_at_30_days: false,
      employed_at_60_days: false,
      employed_at_180_days: false,
      employed_at_365_days: false,
      promotion_received: false,
      increase_in_hours: false,
      benefits_gained: false,
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => {
    // Clean up data: convert empty strings to null for optional fields
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = value === '' ? null : value;
      return acc;
    }, {} as any);

    createOutcome(cleanedData);
    onSubmitSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Placement Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">1. Placement Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Job Title</label>
            <input type="text" {...register('job_title')} className="input-field w-full mt-1" placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Start Date</label>
            <input type="date" {...register('start_date')} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Starting Wage ($)</label>
            <input type="number" step="0.01" {...register('starting_wage', { setValueAs: v => v === '' ? null : parseFloat(v) })} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Industry</label>
            <input type="text" {...register('employer_industry')} className="input-field w-full mt-1" placeholder="e.g. Healthcare" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Occupation Code (SOC)</label>
            <input type="text" {...register('occupation_code')} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Employment Type</label>
            <select {...register('employment_type')} className="input-field w-full mt-1">
              <option value="">Select Type...</option>
              <option value="Regular">Regular</option>
              <option value="Contract">Contract</option>
              <option value="Apprenticeship">Apprenticeship</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Status Type</label>
            <select {...register('status_type')} className="input-field w-full mt-1">
              <option value="">Select Status...</option>
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
              <option value="Seasonal">Seasonal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Expected Weekly Hours</label>
            <input type="number" {...register('expected_weekly_hours', { setValueAs: v => v === '' ? null : parseInt(v, 10) })} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Work Mode</label>
            <select {...register('work_mode')} className="input-field w-full mt-1">
              <option value="">Select Mode...</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Worksite Location</label>
            <input type="text" {...register('worksite_location')} className="input-field w-full mt-1" placeholder="City, State" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('is_full_time')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Full-Time Position
          </label>
        </div>
      </section>

      {/* 2. Job Characteristics */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">2. Job Characteristics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('recovery_friendly')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Recovery Friendly Employer
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('second_chance')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Second Chance Hire
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('is_union_job')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Union Job
          </label>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Benefits Offered</label>
          <textarea {...register('benefits_offered')} className="input-field w-full mt-1 h-20" placeholder="e.g. Health, Dental, 401k..." />
        </div>
      </section>

      {/* 3. Retention & Milestones */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">3. Retention & Milestones</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
            30 Day
            <input type="checkbox" {...register('employed_at_30_days')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
            60 Day
            <input type="checkbox" {...register('employed_at_60_days')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
            90 Day
            <input type="checkbox" {...register('retention_90_day')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
            180 Day
            <input type="checkbox" {...register('employed_at_180_days')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
            365 Day
            <input type="checkbox" {...register('employed_at_365_days')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5" />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Retention Verification Date</label>
            <input type="date" {...register('retention_verification_date')} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Placement Quality</label>
            <input type="text" {...register('placement_quality')} className="input-field w-full mt-1" placeholder="e.g. High, Medium, Low" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Wage at 30 Days</label>
            <input type="number" step="0.01" {...register('wage_at_30_days', { setValueAs: v => v === '' ? null : parseFloat(v) })} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Wage at 90 Days</label>
            <input type="number" step="0.01" {...register('wage_at_90_days', { setValueAs: v => v === '' ? null : parseFloat(v) })} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Wage at 6 Months</label>
            <input type="number" step="0.01" {...register('wage_at_6_months', { setValueAs: v => v === '' ? null : parseFloat(v) })} className="input-field w-full mt-1" />
          </div>
        </div>
      </section>

      {/* 4. Career Advancement */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">4. Career Advancement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('promotion_received')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Promotion Received
            </label>
            {watch('promotion_received') && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Promotion Date</label>
                <input type="date" {...register('promotion_date')} className="input-field w-full mt-1" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('increase_in_hours')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Increase in Hours
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('benefits_gained')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Benefits Gained
            </label>
          </div>
        </div>
      </section>

      {/* 5. Quality & Exit */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">5. Satisfaction & Exit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Job Satisfaction (1-5)</label>
            <input type="number" min="1" max="5" {...register('job_satisfaction', { setValueAs: v => v === '' ? null : parseInt(v, 10) })} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Employer Satisfaction (1-5)</label>
            <input type="number" min="1" max="5" {...register('employer_satisfaction', { setValueAs: v => v === '' ? null : parseInt(v, 10) })} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Date Ended</label>
            <input type="date" {...register('date_ended')} className="input-field w-full mt-1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Reason Ended</label>
            <textarea {...register('reason_ended')} className="input-field w-full mt-1 h-20" />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary px-6">Cancel</button>
        <button type="submit" disabled={isSaving} className="btn-primary px-10">
          {isSaving ? 'Saving...' : 'Save Outcome'}
        </button>
      </div>
    </form>
  );
};
