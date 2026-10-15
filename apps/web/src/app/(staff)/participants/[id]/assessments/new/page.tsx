'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
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
  { type: 'current_work_profile', label: 'Current Work Profile', description: 'Where the person stands today on day one of their journey.' },
  { type: 'workstyle_strengths', label: 'Workstyle Strengths', description: 'Their natural professional personality, drivers, and vocational assets.' },
  { type: 'support_needs', label: 'Support Needs', description: 'The specific assistance, tools, or accommodations required to guarantee their success.' },
];

export default function NewAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const participantId = params.id as string;

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const { data: template, isLoading: loadingTemplate } = useApiQuery<FormTemplate>(
    ['form-template', selectedType || ''],
    `/form-templates/by-type/${selectedType || ''}`,
    { enabled: !!selectedType },
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

  // Step 1: Select assessment type
  if (!selectedType) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            &larr; Back to participant
          </button>
          <h1 className="text-2xl font-bold text-slate-900">New Assessment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select an assessment type to begin
          </p>
        </div>

        <div className="space-y-3">
          {ASSESSMENT_TYPES.map((at) => (
            <button
              key={at.type}
              onClick={() => setSelectedType(at.type)}
              className="w-full card text-left hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <h3 className="font-semibold text-slate-900">{at.label}</h3>
              <p className="text-sm text-slate-500 mt-1">{at.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Show results
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Assessment Complete</h1>
          <p className="text-sm text-slate-500 mt-1">
            Results have been saved to the participant record
          </p>
        </div>

        <AssessmentResults
          type={selectedType}
          scores={(result as any).scored}
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push(`/participants/${participantId}`)}
            className="btn-primary"
          >
            Back to Participant
          </button>
          <button
            onClick={() => {
              setSelectedType(null);
              setResult(null);
            }}
            className="btn-secondary"
          >
            Start Another Assessment
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Fill out form
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => setSelectedType(null)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          &larr; Choose different assessment
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {ASSESSMENT_TYPES.find((a) => a.type === selectedType)?.label}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {ASSESSMENT_TYPES.find((a) => a.type === selectedType)?.description}
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
              type: selectedType,
              responses: values,
            } as any);
          }}
        />
      ) : (
        <div className="card text-center py-8">
          <p className="text-slate-500">Assessment template not found.</p>
          <p className="text-sm text-slate-400 mt-1">
            The {selectedType} template may not be configured for this tenant.
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
