import { z } from 'zod';

export const FollowUpSchema = z.object({
  id: z.string().uuid().optional(),
  participant_id: z.string().uuid(),
  due_date: z.string(),
  completed_date: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  status: z.string().default('pending'),
  outcome_metrics: z.record(z.any()).default({}),
  employment_at_follow_up: z.boolean().optional().nullable(),
  wage_at_follow_up: z.number().optional().nullable(),
  education_status: z.string().optional().nullable(),
  housing_status: z.string().optional().nullable(),
  continued_service_needs: z.string().optional().nullable(),
  long_term_goal_progress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CreateFollowUpSchema = FollowUpSchema.omit({ id: true });
export const UpdateFollowUpSchema = FollowUpSchema.partial();

export type FollowUpDto = z.infer<typeof FollowUpSchema>;
export type CreateFollowUpDto = z.infer<typeof CreateFollowUpSchema>;
export type UpdateFollowUpDto = z.infer<typeof UpdateFollowUpSchema>;
