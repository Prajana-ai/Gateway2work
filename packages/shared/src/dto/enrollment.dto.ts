import { z } from 'zod';

// Define shared types and enums if they exist, e.g., ClientStatus, TenantId
// For now, assuming basic types and string/UUID placeholders where applicable

const dateSchema = z.string().refine((val) => val === '' || !isNaN(Date.parse(val)), { message: 'Invalid date' });

const enrollmentBaseSchema = z.object({
  participant_id: z.string().uuid(), // Assumes UUID for participant_id
  referral_id: z.string().uuid().optional(), // Assumes UUID for referral_id, optional
  program_enrolled_in: z.string().optional(),
  enrollment_date: dateSchema.optional(),
  intake_completion_date: dateSchema.optional(),
  eligibility_determination: z.string().optional(),
  eligibility_date: dateSchema.optional(),
  reason_not_eligible: z.string().optional(),
  cohort_number: z.string().optional(),
  funding_source_tied_to_participant: z.string().optional(),
  recruitment_source: z.string().optional(),
  assessment_date: dateSchema.optional(),
  ips_participant_established_date: dateSchema.optional(),
  case_management_established_participant_date: dateSchema.optional(),
});

export const CreateEnrollmentSchema = enrollmentBaseSchema.extend({
  // No additional fields for creation beyond the base, but could add tenant_id if managed at creation
});

export type CreateEnrollmentDto = z.infer<typeof CreateEnrollmentSchema>;

export const UpdateEnrollmentSchema = enrollmentBaseSchema.deepPartial();

export type UpdateEnrollmentDto = z.infer<typeof UpdateEnrollmentSchema>;

// Basic schema for listing enrollments, perhaps with pagination
export const EnrollmentListSchema = z.object({
  participant_id: z.string().uuid().optional(),
  referral_id: z.string().uuid().optional(),
  // Add pagination and filtering fields if needed
});

export type EnrollmentListDto = z.infer<typeof EnrollmentListSchema>;
