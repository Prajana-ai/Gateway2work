import { z } from 'zod';
import { ParticipantStatus } from '../enums';

export const CreateParticipantSchema = z.object({
  // Category 1: Identity & Contact (Top level + Demographics)
  participantId: z.string().optional(),
  externalEhrId: z.string().optional(),
  referralSource: z.string().optional(),
  referralType: z.string().optional(),
  referralDate: z.string().datetime().optional(),
  
  demographics: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    preferredName: z.string().optional(),
    dateOfBirth: z.string(),
    primaryLanguage: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    preferredContactMethod: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    county: z.string().optional(),
    zipCode: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    
    // Category 3: Demographics
    gender: z.string().optional(),
    pronouns: z.string().optional(),
    race: z.string().optional(),
    ethnicity: z.string().optional(),
    veteranStatus: z.string().optional(),
    disabilityStatus: z.string().optional(),
    citizenshipStatus: z.string().optional(),
    householdSize: z.number().int().optional(),
    dependentsCount: z.number().int().optional(),
    parentingStatus: z.string().optional(),
    maritalStatus: z.string().optional(),
    
    // Legacy fields
    ssn_last4: z.string().optional(),
  }),

  // Category 2: Referral & Legal
  legalInfo: z.object({
    consentSigned: z.boolean().default(false),
    consentDate: z.string().optional(),
    roiSigned: z.boolean().default(false),
    roiExpirationDate: z.string().optional(),
    staffAssigned: z.string().optional(),
    caseManagerAssigned: z.string().optional(),
  }).optional(),

  // Category 4: Socioeconomic
  socioeconomic: z.object({
    housingStatusAtIntake: z.string().optional(),
    residenceType: z.string().optional(), // Rural, suburban, urban
    transportationAccess: z.string().optional(),
    internetAccess: z.string().optional(),
    deviceAccess: z.string().optional(),
  }).optional(),

  consent42cfr: z.boolean().default(false),
  consentExpiresAt: z.string().datetime().optional(),
  status: z.nativeEnum(ParticipantStatus).default(ParticipantStatus.Active),
});

export type CreateParticipantDto = z.infer<typeof CreateParticipantSchema>;

export const UpdateParticipantSchema = CreateParticipantSchema.deepPartial();
export type UpdateParticipantDto = z.infer<typeof UpdateParticipantSchema>;

export const ParticipantSearchSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(ParticipantStatus).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
});

export type ParticipantSearchDto = z.infer<typeof ParticipantSearchSchema>;

export interface ParticipantResponse {
  id: string;
  tenantId: string;
  externalEhrId?: string;
  referralSource?: string;
  referralDate?: string;
  demographics: any;
  consent42cfr: boolean;
  consentExpiresAt?: string;
  status: ParticipantStatus;
  createdAt: string;
  updatedAt: string;
}
