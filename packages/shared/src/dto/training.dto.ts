import { z } from 'zod';

export const TrainingSchema = z.object({
  id: z.string().uuid().optional(),
  participant_id: z.string().uuid(),
  program_name: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(), // Using string for DATE compatibility
  end_date: z.string().optional().nullable(),
  is_completed: z.boolean().default(false),
  completion_date: z.string().optional().nullable(),
  credential_earned: z.string().optional().nullable(),
  credential_type: z.string().optional().nullable(),
  license_earned: z.string().optional().nullable(),
  apprenticeship_participation: z.boolean().optional().nullable(),
  internship_participation: z.boolean().optional().nullable(),
  wbl_participation: z.boolean().optional().nullable(),
  ojt_participation: z.boolean().optional().nullable(),
  total_hours: z.coerce.number().int().min(0).optional().nullable(),
  stipend_provided: z.boolean().optional().nullable(),
  outcome: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
});

export const CreateTrainingSchema = TrainingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const UpdateTrainingSchema = CreateTrainingSchema.partial();

export type TrainingDto = z.infer<typeof TrainingSchema>;
export type CreateTrainingDto = z.infer<typeof CreateTrainingSchema>;
export type UpdateTrainingDto = z.infer<typeof UpdateTrainingSchema>;
