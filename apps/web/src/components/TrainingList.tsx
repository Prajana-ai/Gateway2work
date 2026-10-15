'use client';

import React from 'react';
import { format } from 'date-fns';
import { useTrainings } from '@/hooks/use-trainings';
import { StatusBadge } from './status-badge';

interface TrainingListProps {
  participantId: string;
  onEdit?: (training: any) => void;
}

export const TrainingList: React.FC<TrainingListProps> = ({ participantId, onEdit }) => {
  const { trainings, isLoading, error, deleteTraining } = useTrainings(participantId);

  if (isLoading) {
    return <div className="text-center p-8 animate-pulse text-slate-400">Loading trainings...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500 card">Error loading trainings: {error.message}</div>;
  }

  if (trainings.length === 0) {
    return (
      <div className="text-center p-12 card border-dashed border-2">
        <p className="text-slate-500">No training records found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Program / Provider</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Credential</th>
            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {trainings.map((training) => (
            <tr key={training.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-slate-900">{training.program_name || 'Unnamed Program'}</div>
                <div className="text-xs text-slate-500">{training.provider || 'No provider specified'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-xs text-slate-900">
                  {training.start_date ? format(new Date(training.start_date), 'MMM d, yyyy') : '--'} - {training.end_date ? format(new Date(training.end_date), 'MMM d, yyyy') : 'Present'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {training.outcome ? (
                  <StatusBadge 
                    status={training.outcome} 
                    variant={
                      training.outcome.toLowerCase() === 'successfully completed' ? 'completed' :
                      (training.outcome.toLowerCase() === 'failed' || training.outcome.toLowerCase() === 'dropped out') ? 'declined' : 
                      'inactive'
                    }
                  />
                ) : (
                  <StatusBadge status={training.is_completed ? 'completed' : 'in_progress'} variant={training.is_completed ? 'completed' : 'pending'} />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-900 font-medium">
                  {training.credential_earned || training.credential_type || '--'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit?.(training)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this training record?')) {
                      deleteTraining(training.id!).mutate();
                    }
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainingList;
