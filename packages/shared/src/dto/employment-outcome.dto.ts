import { z } from 'zod';

export const EmploymentOutcomeSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  employer_id: z.string().uuid().optional().nullable(),
  job_title: z.string().optional().nullable(),
  employer_industry: z.string().optional().nullable(),
  occupation_code: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  is_full_time: z.boolean().optional().nullable(),
  status_type: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  expected_weekly_hours: z.number().int().optional().nullable(),
  starting_wage: z.number().optional().nullable(),
  retention_90_day: z.boolean().optional().nullable(),
  benefits_offered: z.string().optional().nullable(),
  worksite_location: z.string().optional().nullable(),
  work_mode: z.string().optional().nullable(),
  recovery_friendly: z.boolean().default(false),
  second_chance: z.boolean().default(false),
  is_union_job: z.boolean().default(false),
  placement_quality: z.string().optional().nullable(),
  employed_at_30_days: z.boolean().optional().nullable(),
  employed_at_60_days: z.boolean().optional().nullable(),
  employed_at_180_days: z.boolean().optional().nullable(),
  employed_at_365_days: z.boolean().optional().nullable(),
  retention_verification_date: z.string().optional().nullable(),
  wage_at_30_days: z.number().optional().nullable(),
  wage_at_90_days: z.number().optional().nullable(),
  wage_at_6_months: z.number().optional().nullable(),
  promotion_received: z.boolean().default(false),
  promotion_date: z.string().optional().nullable(),
  increase_in_hours: z.boolean().default(false),
  benefits_gained: z.boolean().default(false),
  job_satisfaction: z.number().int().optional().nullable(),
  employer_satisfaction: z.number().int().optional().nullable(),
  reason_ended: z.string().optional().nullable(),
  date_ended: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateEmploymentOutcomeSchema = EmploymentOutcomeSchema.omit({ 
  id: true, 
  tenant_id: true,
  created_at: true, 
  updated_at: true 
});
export const UpdateEmploymentOutcomeSchema = EmploymentOutcomeSchema.partial();

export type EmploymentOutcomeDto = z.infer<typeof EmploymentOutcomeSchema>;
export type CreateEmploymentOutcomeDto = z.infer<typeof CreateEmploymentOutcomeSchema>;
export type UpdateEmploymentOutcomeDto = z.infer<typeof UpdateEmploymentOutcomeSchema>;
