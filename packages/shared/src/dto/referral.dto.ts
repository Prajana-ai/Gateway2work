import { z } from 'zod';
import { ReferralStatus } from '../enums';

export const CreateReferralSchema = z.object({
  // Option 1: Link to existing participant
  participantId: z.string().uuid().optional(),

  // Option 2: Referral-first (create participant if not found)
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  externalEhrId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),

  providerAgencyId: z.string().uuid().optional(),
  providerAgencyName: z.string().optional(),
  referralStatus: z.nativeEnum(ReferralStatus).default(ReferralStatus.Pending),
  notes: z.string().optional(),
}).refine(data => data.participantId || (data.firstName && data.lastName && data.dateOfBirth), {
  message: "Either participantId or (firstName, lastName, and dateOfBirth) must be provided",
  path: ["participantId"]
});
export type CreateReferralDto = z.infer<typeof CreateReferralSchema>;

export const UpdateReferralStatusSchema = z.object({
  referralStatus: z.nativeEnum(ReferralStatus),
});
export type UpdateReferralStatusDto = z.infer<typeof UpdateReferralStatusSchema>;
