import { z } from 'zod';

export const CreateEncounterSchema = z.object({
  participantId: z.string().uuid(),
  encounterDate: z.string().datetime(),
  durationMinutes: z.number().int().min(1),
  notes: z.string().optional(),
  billable: z.boolean(),
  
  // New fields from migration 015
  serviceType: z.string().optional(),
  serviceSubcategory: z.string().optional(),
  partnerOrganizationName: z.string().optional(),
  location: z.string().optional(),
  deliveryMode: z.string().optional(),
  format: z.string().optional(),
  isCompleted: z.boolean().default(true),
  
  recoveryStatus: z.string().optional(),
  recoveryStage: z.string().optional(),
  substanceUseTreatment: z.string().optional(),
  behavioralHealthTreatment: z.string().optional(),
  peerSupportParticipation: z.string().optional(),
  housingInstability: z.string().optional(),
  foodInsecurity: z.string().optional(),
  childcareNeed: z.string().optional(),
  transportationNeed: z.string().optional(),
  legalSupportNeed: z.string().optional(),
  physicalHealthNeed: z.string().optional(),
  mentalHealthNeed: z.string().optional(),
  traumaInformedSupport: z.string().optional(),
});
export type CreateEncounterDto = z.infer<typeof CreateEncounterSchema>;
