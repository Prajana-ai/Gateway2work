'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useApiQuery } from '@/hooks/use-api';
import { WorkforcePlanGenerator } from '@/components/workforce-plan/WorkforcePlanGenerator';

interface Assessment {
  id: string;
  assessment_type: string;
  completed_at: string | null;
  computed_summary: any;
  raw_responses?: any;
}

export default function WorkforcePlanPage() {
  const params = useParams();
  const participantId = params.id as string;

  const { data: assessments } = useApiQuery<Assessment[]>(
    ['assessments', participantId],
    `/participants/${participantId}/assessments`,
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Workforce Plan & Strategy Roadmap</h1>
      </div>

      <WorkforcePlanGenerator
        participantId={participantId}
        assessments={assessments ?? []}
      />
    </div>
  );
}
