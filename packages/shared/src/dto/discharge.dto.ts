import { z } from 'zod';

export const CreateDischargeSchema = z.object({
  participant_id: z.string().uuid(),
  exit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  discharge_type: z.enum(['planned', 'unplanned']),
  reason_for_exit: z.string().optional(),
  employment_status_at_exit: z.string().optional(),
  training_status_at_exit: z.string().optional(),
  recovery_stability_at_exit: z.string().optional(),
  referrals_at_discharge: z.any().optional(),
  follow_up_plans: z.string().optional(),
  
  // WFD Data Dictionary Fields
  completed_successfully: z.boolean().optional().default(false),
  withdrew_voluntarily: z.boolean().optional().default(false),
  lost_contact: z.boolean().optional().default(false),
  referred_to_another_program: z.boolean().optional().default(false),
  incarcerated: z.boolean().optional().default(false),
  hospitalized: z.boolean().optional().default(false),
  deceased: z.boolean().optional().default(false),
  non_completion_workforce_exit: z.boolean().optional().default(false),
  completion_workforce_exit: z.boolean().optional().default(false),
  wage_at_exit: z.number().nullable().optional(),
  notes_at_exit: z.string().optional(),
});

export type CreateDischargeDto = z.infer<typeof CreateDischargeSchema>;

export const UpdateDischargeSchema = CreateDischargeSchema.partial();

export type UpdateDischargeDto = z.infer<typeof UpdateDischargeSchema>;

export const DischargeResponseSchema = CreateDischargeSchema.extend({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  created_at: z.string(),
});

export type DischargeResponseDto = z.infer<typeof DischargeResponseSchema>;
