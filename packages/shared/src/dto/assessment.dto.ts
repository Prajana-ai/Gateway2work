import { z } from 'zod';
import { AssessmentType } from '../enums';

export const SubmitAssessmentSchema = z.object({
  assessmentType: z.nativeEnum(AssessmentType),
  responses: z.record(z.string(), z.unknown()),
});
export type SubmitAssessmentDto = z.infer<typeof SubmitAssessmentSchema>;
