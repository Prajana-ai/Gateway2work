import { z } from 'zod';

export const RecommendedReportingVariablesSchema = z.object({
  totalEnrolled: z.number(),
  totalActiveParticipants: z.number(),
  totalExited: z.number(),
  numberReceivingCaseManagement: z.number(),
  numberReceivingTraining: z.number(),
  numberEarningCredentials: z.number(),
  numberPlacedInEmployment: z.number(),
  medianWageAtPlacement: z.number(),
  retentionAt90Days: z.number(),
  retentionAt6Months: z.number(),
  averageTimeIntakeToPlacement: z.number(),
  averageServicesPerParticipant: z.number(),
  topBarriers: z.array(z.object({ barrier: z.string(), count: z.number() })),
  topReferralSources: z.array(z.object({ source: z.string(), count: z.number() })),
  topIndustriesForPlacement: z.array(z.object({ industry: z.string(), count: z.number() })),
});

export type RecommendedReportingVariablesDto = z.infer<typeof RecommendedReportingVariablesSchema>;
