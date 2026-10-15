import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { FollowUpDto, CreateFollowUpDto } from '@impactforge/shared';
import { useQueryClient } from '@tanstack/react-query';

export function useFollowUps(participantId?: string) {
  const queryClient = useQueryClient();
  const id = participantId || '';

  const { data, isLoading, error } = useApiQuery<FollowUpDto[]>(
    ['follow-ups', id],
    `/participants/${id}/follow-ups`,
    { enabled: !!id },
  );

  const createMutation = useApiMutation<FollowUpDto, CreateFollowUpDto>(
    `/participants/${id}/follow-ups`,
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['follow-ups', id] });
      },
    },
  );

  return {
    followUps: data ?? [],
    isLoading,
    error,
    createFollowUp: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
