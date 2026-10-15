import { z } from 'zod';
import { OwnerType } from '../enums';

export const CreatePlanSchema = z.object({
  participantId: z.string().uuid(),
  longTermGoal: z.string().min(1),
  shortTermGoals: z.array(z.string().min(1)).min(1),
});
export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = CreatePlanSchema.partial();
export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;

export const CreateTaskSchema = z.object({
  description: z.string().min(1),
  ownerType: z.nativeEnum(OwnerType),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
