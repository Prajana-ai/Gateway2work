import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { EmploymentOutcomeDto, CreateEmploymentOutcomeDto } from '@impactforge/shared';
import { useQueryClient } from '@tanstack/react-query';

export function useEmploymentOutcomes(participantId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useApiQuery<EmploymentOutcomeDto[]>(
    ['employment-outcomes', participantId!],
    participantId ? `/participants/${participantId}/employment-outcomes` : '',
    { enabled: !!participantId },
  );

  const createMutation = useApiMutation<EmploymentOutcomeDto, CreateEmploymentOutcomeDto>(
    participantId ? `/participants/${participantId}/employment-outcomes` : '',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employment-outcomes', participantId] });
      },
    },
  );

  return {
    outcomes: data ?? [],
    isLoading,
    error,
    createOutcome: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
