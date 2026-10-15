'use client';

import { useApiQuery, useApiMutation } from './use-api';
import { TrainingDto, CreateTrainingDto, UpdateTrainingDto } from '@impactforge/shared';
import { useQueryClient } from '@tanstack/react-query';

export function useTrainings(participantId?: string) {
  const queryClient = useQueryClient();

  const trainingsQuery = useApiQuery<TrainingDto[]>(
    ['trainings', 'participant', participantId!],
    `/trainings/participant/${participantId}`,
    { enabled: !!participantId }
  );

  const createTraining = useApiMutation<TrainingDto, CreateTrainingDto>(
    '/trainings',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
      },
    }
  );

  const updateTraining = (id: string) => 
    useApiMutation<TrainingDto, UpdateTrainingDto>(
      `/trainings/${id}`,
      'patch',
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['trainings'] });
        },
      }
    );

  const deleteTraining = (id: string) =>
    useApiMutation<void, void>(
      `/trainings/${id}`,
      'delete',
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['trainings'] });
        },
      }
    );

  return {
    trainings: trainingsQuery.data ?? [],
    isLoading: trainingsQuery.isLoading,
    error: trainingsQuery.error,
    createTraining,
    updateTraining,
    deleteTraining,
  };
}
