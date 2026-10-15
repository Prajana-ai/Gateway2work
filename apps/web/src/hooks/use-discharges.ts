import { useApiQuery, useApiMutation } from './use-api';
import { CreateDischargeDto, DischargeResponseDto } from '@impactforge/shared';

export function useDischarges(participantId: string) {
  const {
    data: discharges,
    isLoading,
    isError,
    refetch,
  } = useApiQuery<DischargeResponseDto[]>(
    ['discharges', participantId],
    `/discharges/participant/${participantId}`,
  );

  const { mutateAsync: createDischarge, isPending: isCreating } = useApiMutation<
    DischargeResponseDto,
    CreateDischargeDto
  >('/discharges', 'post');

  return {
    discharges,
    isLoading,
    isError,
    refetch,
    createDischarge,
    isCreating,
  };
}
