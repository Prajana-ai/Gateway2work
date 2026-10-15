'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { DynamicForm } from '@/components/assessments/dynamic-form';
import { AssessmentResults } from '@/components/assessments/assessment-results';

interface FormTemplate {
  id: string;
  name: string;
  assessment_type: string;
  json_schema: Record<string, unknown>;
  ui_schema: Record<string, unknown>;
}

const ASSESSMENT_TYPES = [
  {
    type: 'current_work_profile',
    label: 'Current Work Profile',
    description: 'Let us celebrate your starting point! Sharing where you stand today helps us tailor the right opportunities for your day one.',
  },
  {
    type: 'workstyle_strengths',
    label: 'Workstyle Strengths',
    description: 'What makes you thrive? This explores your natural work personality and the unique strengths you bring to a team.',
  },
  {
    type: 'support_needs',
    label: 'Support Needs',
    description: 'We are here to back you up. Let us know what tools, flexibility, or accommodations you need to feel confident and succeed.',
  },
];

export default function ParticipantAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentType = params.type as string;

  const user = useAuthStore((s) => s.user);
  const participantId = user?.id ?? '';

  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const matchedType = ASSESSMENT_TYPES.find((at) => at.type === assessmentType);

  const { data: template, isLoading: loadingTemplate } = useApiQuery<FormTemplate>(
    ['form-template', assessmentType || ''],
    `/form-templates/by-type/${assessmentType || ''}`,
    { enabled: !!assessmentType },
  );

  const submitMutation = useApiMutation<Record<string, unknown>>(
    `/participants/${participantId}/assessments`,
    'post',
    {
      onSuccess: (data) => {
        setResult(data);
      },
    },
  );

  // If the parameter type is invalid, show an error and a link back to horizon
  if (!matchedType) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card text-center py-8">
          <p className="text-red-500 font-semibold text-lg">Invalid Assessment Type</p>
          <button
            onClick={() => router.push('/horizon')}
            className="btn-primary mt-4 inline-block"
          >
            Back to Horizon
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Show results when complete
  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Assessment Complete</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your responses and computed scores have been saved successfully.
          </p>
        </div>

        <AssessmentResults
          type={assessmentType}
          scores={(result as any).scored}
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push('/horizon')}
            className="btn-primary"
          >
            Back to Horizon
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Fill out the assessment form
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/horizon')}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
        >
          &larr; Back to Horizon
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {matchedType.label}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {matchedType.description}
        </p>
      </div>

      {loadingTemplate ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-1/3 bg-slate-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-8 bg-slate-200 rounded" />
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : template ? (
        <DynamicForm
          schema={template.json_schema as any}
          uiSchema={template.ui_schema as any}
          loading={submitMutation.isPending}
          onSubmit={(values) => {
            submitMutation.mutate({
              type: assessmentType,
              responses: values,
            } as any);
          }}
        />
      ) : (
        <div className="card text-center py-8">
          <p className="text-slate-500">Assessment template not found.</p>
          <p className="text-sm text-slate-400 mt-1">
            The template for {matchedType.label} may not be configured. Please check in with your system administrator.
          </p>
        </div>
      )}

      {submitMutation.isError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {submitMutation.error instanceof Error
            ? submitMutation.error.message
            : 'Failed to submit assessment'}
        </div>
      )}
    </div>
  );
}
