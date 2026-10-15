import { z } from 'zod';
import { TraineeReadiness, MatchStatus, MatchOutcome } from '../enums';

export const RfeSearchSchema = z.object({
  sector: z.string().optional(),
  location: z.string().optional(),
  traineeReadiness: z.nativeEnum(TraineeReadiness).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
});
export type RfeSearchDto = z.infer<typeof RfeSearchSchema>;

export const CreateMatchSchema = z.object({
  rfeId: z.string().uuid(),
  applicationStatus: z.nativeEnum(MatchStatus).optional(),
});
export type CreateMatchDto = z.infer<typeof CreateMatchSchema>;

export const UpdateMatchSchema = z.object({
  applicationStatus: z.nativeEnum(MatchStatus).optional(),
  outcome: z.nativeEnum(MatchOutcome).optional(),
});
export type UpdateMatchDto = z.infer<typeof UpdateMatchSchema>;
