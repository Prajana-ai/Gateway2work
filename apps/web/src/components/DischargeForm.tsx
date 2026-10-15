'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDischargeSchema, CreateDischargeDto } from '@impactforge/shared';

interface DischargeFormProps {
  participantId: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
  createDischarge: (data: CreateDischargeDto) => Promise<any>;
  isSaving: boolean;
}

export function DischargeForm({
  participantId,
  onSubmitSuccess,
  onCancel,
  createDischarge,
  isSaving,
}: DischargeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateDischargeSchema),
    defaultValues: {
      participant_id: participantId,
      exit_date: new Date().toISOString().split('T')[0],
      discharge_type: 'planned',
      completed_successfully: false,
      withdrew_voluntarily: false,
      lost_contact: false,
      referred_to_another_program: false,
      incarcerated: false,
      hospitalized: false,
      deceased: false,
      non_completion_workforce_exit: false,
      completion_workforce_exit: false,
    },
  });

  const onSubmit = async (data: CreateDischargeDto) => {
    try {
      await createDischarge(data);
      onSubmitSuccess();
    } catch (error) {
      console.error('Failed to save discharge:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Exit Date</label>
          <input
            type="date"
            {...register('exit_date')}
            className="input-field w-full mt-1"
          />
          {errors.exit_date && <p className="text-xs text-red-500 mt-1">{errors.exit_date.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Discharge Type</label>
          <select {...register('discharge_type')} className="input-field w-full mt-1">
            <option value="planned">Planned</option>
            <option value="unplanned">Unplanned</option>
          </select>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">Exit Reasons & Outcomes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('completed_successfully')} id="completed_successfully" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="completed_successfully" className="text-sm text-slate-700">Completed program successfully</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('withdrew_voluntarily')} id="withdrew_voluntarily" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="withdrew_voluntarily" className="text-sm text-slate-700">Withdrew voluntarily</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('lost_contact')} id="lost_contact" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="lost_contact" className="text-sm text-slate-700">Lost contact</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('referred_to_another_program')} id="referred_to_another_program" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="referred_to_another_program" className="text-sm text-slate-700">Referred to another program</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('incarcerated')} id="incarcerated" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="incarcerated" className="text-sm text-slate-700">Incarcerated</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('hospitalized')} id="hospitalized" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="hospitalized" className="text-sm text-slate-700">Hospitalized</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('deceased')} id="deceased" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="deceased" className="text-sm text-slate-700">Deceased</label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">Workforce Specifics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('completion_workforce_exit')} id="completion_workforce_exit" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="completion_workforce_exit" className="text-sm text-slate-700">Completion of workforce program</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('non_completion_workforce_exit')} id="non_completion_workforce_exit" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="non_completion_workforce_exit" className="text-sm text-slate-700">Non-completion of workforce program</label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Employment Status at Exit</label>
            <input type="text" {...register('employment_status_at_exit')} className="input-field w-full mt-1" placeholder="e.g. Employed Full-Time" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase">Wage at Exit</label>
            <input
              type="number"
              step="0.01"
              {...register('wage_at_exit', { setValueAs: v => v === '' ? null : parseFloat(v) })}
              className="input-field w-full mt-1"
              placeholder="0.00"
            />
          </div>
        </div>
      </section>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase">Notes at Exit</label>
        <textarea
          {...register('notes_at_exit')}
          className="input-field w-full mt-1 h-24"
          placeholder="Detailed notes regarding the participant's exit..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary px-6"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary px-10"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Confirm Exit & Discharge'}
        </button>
      </div>
    </form>
  );
}
