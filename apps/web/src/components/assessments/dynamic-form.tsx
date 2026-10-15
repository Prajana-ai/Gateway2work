'use client';

import React, { useState } from 'react';

interface FieldSchema {
  type: string;
  title?: string;
  description?: string;
  enum?: string[];
  enumLabels?: string[];
  enumNames?: string[];
  minimum?: number;
  maximum?: number;
  format?: string;
  default?: unknown;
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
  required?: string[];
}

interface FormSchema {
  type: string;
  title?: string;
  description?: string;
  properties: Record<string, FieldSchema>;
  required?: string[];
}

interface UiSection {
  title: string;
  description?: string;
  fields: string[];
}

interface UiSchema {
  sections?: UiSection[];
  fieldOrder?: string[];
  [key: string]: any;
}

interface DynamicFormProps {
  schema: FormSchema;
  uiSchema?: UiSchema;
  onSubmit: (values: Record<string, unknown>) => void;
  loading?: boolean;
}

function RatingField({
  value,
  onChange,
  max = 5,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  labels?: string[];
}) {
  const defaultLabels = ['None', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
  const displayLabels = labels || defaultLabels.slice(0, max);

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
            value === n
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
          }`}
          title={displayLabels[n - 1] || String(n)}
        >
          {n}
        </button>
      ))}
      {value > 0 && displayLabels[value - 1] && (
        <span className="ml-2 text-xs text-slate-500 self-center">
          {displayLabels[value - 1]}
        </span>
      )}
    </div>
  );
}

function renderField(
  key: string,
  field: FieldSchema,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  values: Record<string, unknown>,
  isFieldVisible: (key: string) => boolean,
  uiSchema?: any,
) {
  const id = `field-${key}`;

  // Recursive object rendering
  if (field.type === 'object' && field.properties) {
    const order = uiSchema?.['ui:order'] as string[] | undefined;
    let propertyKeys = Object.keys(field.properties);

    if (order) {
      propertyKeys = [
        ...order.filter((k) => propertyKeys.includes(k)),
        ...propertyKeys.filter((k) => !order.includes(k)),
      ];
    }

    return (
      <div className="space-y-4">
        {propertyKeys.map((subKey) => {
          const subField = field.properties![subKey];
          const fullKey = key ? `${key}.${subKey}` : subKey;
          if (!isFieldVisible(fullKey)) return null;

          const subUiSchema = uiSchema?.[subKey];

          return (
            <div key={fullKey}>
              {subField.type !== 'boolean' && subField.type !== 'object' && (
                <label
                  htmlFor={`field-${fullKey}`}
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  {subField.title || subKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
              )}
              {subField.description && (
                <p className="text-xs text-slate-400 mb-1">{subField.description}</p>
              )}
              {renderField(fullKey, subField, value && typeof value === 'object' ? (value as any)[subKey] : undefined, (k, v) => {
                const newValue = { ...(value as any || {}), [subKey]: v };
                onChange(key, newValue);
              }, values, isFieldVisible, subUiSchema)}
            </div>
          );
        })}
      </div>
    );
  }

  const widget = uiSchema?.['ui:widget'];

  // Boolean / yes-no
  if (field.type === 'boolean') {
    if (widget === 'radio' || field.title) {
      return (
        <div className="space-y-1.5">
          {field.title && (
            <label className="block text-sm font-medium text-slate-700">
              {field.title}
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            {[
              { val: true, label: 'Yes' },
              { val: false, label: 'No' },
            ].map(({ val, label }) => {
              const checked = value === val;
              return (
                <label
                  key={String(val)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={id}
                    value={String(val)}
                    checked={checked}
                    onChange={() => onChange(key, val)}
                    className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(key, e.target.checked)
          }
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">{field.title || key}</span>
      </label>
    );
  }

  // Enum / select / radio
  if (field.enum) {
    const isRadio = uiSchema?.['ui:widget'] === 'radio';

    if (isRadio) {
      return (
        <div className="flex flex-wrap gap-4 mt-1">
          {field.enum.map((opt, i) => {
            const label =
              field.enumNames?.[i] ||
              field.enumLabels?.[i] ||
              opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const checked = value === opt;

            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={id}
                  value={opt}
                  checked={checked}
                  onChange={() => onChange(key, opt)}
                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <select
        id={id}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(key, e.target.value)
        }
        className="input-field"
      >
        <option value="">Select...</option>
        {field.enum.map((opt, i) => (
          <option key={opt} value={opt}>
            {field.enumNames?.[i] || field.enumLabels?.[i] || opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>
    );
  }

  // Integer with min/max (rating)
  if (field.type === 'integer' && field.minimum !== undefined && field.maximum !== undefined && field.maximum <= 10) {
    return (
      <RatingField
        value={(value as number) || 0}
        onChange={(v) => onChange(key, v)}
        max={field.maximum}
      />
    );
  }

  // Number
  if (field.type === 'integer' || field.type === 'number') {
    return (
      <input
        id={id}
        type="number"
        value={(value as number) ?? ''}
        min={field.minimum}
        max={field.maximum}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(key, e.target.value ? Number(e.target.value) : null)
        }
        className="input-field"
      />
    );
  }

  // Array of strings (multi-select/checklist)
  if (field.type === 'array' && field.items?.enum) {
    const selected = (value as string[]) || [];
    return (
      <div className="flex flex-wrap gap-2">
        {field.items.enum.map((opt, i) => {
          const rawLabel =
            field.items?.enumNames?.[i] ||
            opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const parenIdx = rawLabel.indexOf('(');
          const mainLabel = parenIdx !== -1 ? rawLabel.slice(0, parenIdx).trimEnd() : rawLabel;
          const descLabel = parenIdx !== -1 ? rawLabel.slice(parenIdx) : null;
          return (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => {
                  const next = selected.includes(opt)
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt];
                  onChange(key, next);
                }}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-600">
                {mainLabel}
                {descLabel && (
                  <em className="font-normal text-slate-400"> {descLabel}</em>
                )}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // Text
  if (field.type === 'string' && (key.includes('notes') || key.includes('goals') || key.includes('text'))) {
    return (
      <textarea
        id={id}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(key, e.target.value)
        }
        className="input-field"
        rows={3}
      />
    );
  }

  // Date
  if (field.type === 'string' && field.format === 'date') {
    return (
      <input
        id={id}
        type="date"
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(key, e.target.value)
        }
        className="input-field"
      />
    );
  }

  // Default string input
  return (
    <input
      id={id}
      type="text"
      value={(value as string) || ''}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(key, e.target.value)
      }
      className="input-field"
    />
  );
}

export function DynamicForm({ schema, uiSchema, onSubmit, loading }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };

      // Income Calculation & Employment Type Logic
      const empStatus = { ...(next.employment_status || {}) } as any;
      if (key === 'employment_status' || key.startsWith('employment_status.')) {
        const wage = Number(empStatus.hourly_wage || 0);
        const hours = Number(empStatus.hours_per_week || 0);
        if (wage && hours) {
          empStatus.monthly_income_total = Math.round(wage * hours * 4.33 * 100) / 100;
        }

        // Auto-populate redundant employment_type_ft_pt based on employment_status_at_intake
        const statusVal = empStatus.employment_status_at_intake;
        if (statusVal === 'employed_ft') {
          empStatus.employment_type_ft_pt = 'ft';
        } else if (statusVal === 'employed_pt') {
          empStatus.employment_type_ft_pt = 'pt';
        } else {
          empStatus.employment_type_ft_pt = 'na';
        }
        next.employment_status = empStatus;
      }

      // Automatically compute support_system boolean fields based on support_circle checkboxes
      if (key === 'support_system' || key.startsWith('support_system.')) {
        const supportSys = { ...(next.support_system || {}) } as any;
        const circle = Array.isArray(supportSys.support_circle) ? supportSys.support_circle : [];
        supportSys.has_sponsor_mentor = circle.includes('sponsor_mentor');
        supportSys.case_manager_assigned = circle.includes('case_manager');
        next.support_system = supportSys;
      }

      // Automatically compute technology boolean fields based on tech_tools checkboxes
      if (key === 'technology' || key.startsWith('technology.')) {
        const tech = { ...(next.technology || {}) } as any;
        const tools = Array.isArray(tech.tech_tools) ? tech.tech_tools : [];
        tech.has_smartphone = tools.includes('smartphone');
        tech.has_email = tools.includes('email');
        tech.internet_access_type = tools.includes('home_internet');
        next.technology = tech;
      }

      // Automatically compute identification (Your Launch Toolkit) and vocational fields
      const idObj = { ...(next.identification || {}) } as any;
      const physicalItems = Array.isArray(idObj.physical_items) ? idObj.physical_items : [];
      const supportPaths = Array.isArray(idObj.support_paths) ? idObj.support_paths : [];

      idObj.has_state_id = physicalItems.includes('state_id');
      idObj.has_social_security_card = physicalItems.includes('ssn_card');
      idObj.has_birth_certificate = physicalItems.includes('birth_cert');
      next.identification = idObj;

      // Compute Vocational barriers
      const vocObj = { ...(next.vocational || {}) } as any;
      const barriersSet = new Set<string>();

      // 1. lack_of_transportation
      const trans = (next.transportation || {}) as any;
      const transitOptions = Array.isArray(trans.reliable_options) ? trans.reliable_options : [];
      if (transitOptions.length > 0 && !transitOptions.includes('has_vehicle') && !transitOptions.includes('public_transit')) {
        barriersSet.add('lack_of_transportation');
      }

      // 2. lack_of_childcare
      const care = (next.childcare || {}) as any;
      if (care.has_dependents === true && care.childcare_arranged === 'need_help_finding') {
        barriersSet.add('lack_of_childcare');
      }

      // 3. housing_instability
      const house = (next.housing || {}) as any;
      if (house.housing_status_at_intake && house.housing_status_at_intake !== 'stable') {
        barriersSet.add('housing_instability');
      }

      // 4. no_work_history
      if (supportPaths.includes('career_help')) {
        barriersSet.add('no_work_history');
      }

      // 5. criminal_record
      const leg = (next.legal || {}) as any;
      const backgroundSteps = Array.isArray(leg.background_steps) ? leg.background_steps : [];
      if (backgroundSteps.length > 0) {
        barriersSet.add('criminal_record');
      }

      // 6. limited_education
      const edu = (next.education || {}) as any;
      if (edu.highest_degree_earned === 'none') {
        barriersSet.add('limited_education');
      }

      // 7. limited_phone_internet
      const tech = (next.technology || {}) as any;
      const tools = Array.isArray(tech.tech_tools) ? tech.tech_tools : [];
      if (tools.length > 0 && !tools.includes('smartphone') && !tools.includes('home_internet')) {
        barriersSet.add('limited_phone_internet');
      }

      // 8. limited_interview_skills, limited_resume_skills, confidence_motivation
      if (supportPaths.includes('confidence_help')) {
        barriersSet.add('limited_interview_skills');
        barriersSet.add('limited_resume_skills');
        barriersSet.add('confidence_motivation');
      }

      // 9. lack_of_work_clothing
      if (supportPaths.includes('clothing_help') || (physicalItems.length > 0 && !physicalItems.includes('clothing'))) {
        barriersSet.add('lack_of_work_clothing');
      }

      // 10. lack_of_identification
      if (supportPaths.includes('id_help') || (physicalItems.length > 0 && (!physicalItems.includes('state_id') || !physicalItems.includes('ssn_card')))) {
        barriersSet.add('lack_of_identification');
      }

      // 11. health_related
      const healthObj = (next.health || {}) as any;
      if (healthObj.physical_limitations === true) {
        barriersSet.add('health_related');
      }

      // 12. substance_use
      const wellness = Array.isArray(healthObj.wellness_appointments) ? healthObj.wellness_appointments : [];
      if (wellness.includes('in_recovery')) {
        barriersSet.add('substance_use');
      }

      // 13. language_barriers
      if (supportPaths.includes('language_help')) {
        barriersSet.add('language_barriers');
      }

      // 14. scheduling_barriers
      if (supportPaths.includes('scheduling_help')) {
        barriersSet.add('scheduling_barriers');
      }

      // 15. employer_discrimination
      if (supportPaths.includes('discrimination_help')) {
        barriersSet.add('employer_discrimination');
      }

      // 16. other_barrier
      if (supportPaths.includes('other_help')) {
        barriersSet.add('other_barrier');
      }

      vocObj.specific_barriers = Array.from(barriersSet);
      vocObj.barrier_notes = idObj.other_support_detail || '';
      next.vocational = vocObj;

      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const properties = schema.properties || {};

  // console.log('DynamicForm Values:', values);
  const isFieldVisible = (fieldKey: string) => {
    // Helper to get value from values regardless of nesting
    const getVal = (path: string) => {
      if (values[path] !== undefined) return values[path];
      return path.split('.').reduce((acc, part) => (acc && (acc as any)[part] !== undefined ? (acc as any)[part] : undefined), values);
    };

    const status = (values.employment_status_at_intake || (values.employment_status as any)?.employment_status_at_intake) as string;
    
    // Education Branch: Display highest_grade_completed and ged_status ONLY if "Did not complete High School" ('none') is selected
    if (fieldKey.endsWith('.highest_grade_completed') || fieldKey.endsWith('.ged_status')) {
      const edu = (values.education || {}) as any;
      const degree = edu.highest_degree_earned as string;
      return degree === 'none';
    }

    // Public Benefits Details: Show only if public_benefits_at_intake is true
    if (fieldKey.endsWith('.public_benefits_detail')) {
      const emp = (values.employment_status || {}) as any;
      return emp.public_benefits_at_intake === true;
    }

    // Public Benefits Other Detail: Show only if 'other' is selected in public_benefits_detail
    if (fieldKey.endsWith('.public_benefits_other_detail')) {
      const emp = (values.employment_status || {}) as any;
      const benefits = emp.public_benefits_detail as string[];
      return emp.public_benefits_at_intake === true && Array.isArray(benefits) && benefits.includes('other');
    }

    // Work History follow-up fields: Show only if previous_employment is true
    const pastJobFields = [
      'years_experience',
      'last_job_title',
      'reason_left',
      'primary_work_sector',
    ];
    if (pastJobFields.some(f => fieldKey.endsWith('.' + f))) {
      const wh = (values.work_history || {}) as any;
      return wh.previous_employment === true;
    }

    // Resume Freshness: Show only if resume_available is true ("Yes, I have a resume")
    if (fieldKey.endsWith('.resume_freshness')) {
      const wh = (values.work_history || {}) as any;
      return wh.resume_available === true;
    }

    // Health & Daily Energy: Physical limitations detail
    if (fieldKey.endsWith('.physical_limitations_detail')) {
      const health = (values.health || {}) as any;
      return health.physical_limitations === true;
    }

    // Health & Daily Energy: Recovery follow-ups (currently_in_treatment & recovery_months)
    if (fieldKey.endsWith('.currently_in_treatment') || fieldKey.endsWith('.recovery_months')) {
      const health = (values.health || {}) as any;
      const wellness = Array.isArray(health.wellness_appointments) ? health.wellness_appointments : [];
      return wellness.includes('in_recovery');
    }

    // Health & Daily Energy: Medications detail
    if (fieldKey.endsWith('.medications_detail')) {
      const health = (values.health || {}) as any;
      return health.medications_affecting_work === 'has_safety_needs';
    }

    // Getting Paid & Everyday Tools: budgeting_debt_focus drop down if 'budgeting_planning_help' is checked
    if (fieldKey.endsWith('.budgeting_debt_focus')) {
      const fin = (values.financial || {}) as any;
      const goals = Array.isArray(fin.financial_goals) ? fin.financial_goals : [];
      return goals.includes('budgeting_planning_help');
    }

    // Current Training Details: Show only if currently_enrolled is true
    if (fieldKey.endsWith('.current_training_details')) {
      const edu = (values.education || {}) as any;
      return edu.currently_enrolled === true;
    }

    // Family & Caregiving: Dependent sub-questions
    if (fieldKey.endsWith('.number_of_dependents') || fieldKey.endsWith('.childcare_arranged')) {
      const care = (values.childcare || {}) as any;
      return care.has_dependents === true;
    }

    // Employment Branch Toggles: Display follow-ups ONLY if 'employed_ft' or 'employed_pt' is selected
    const jobWageFields = [
      'current_employer',
      'job_title',
      'hourly_wage',
      'hours_per_week',
      'job_retention_risk',
      'monthly_income_total',
    ];

    if (fieldKey === 'employment_type_ft_pt' || fieldKey.endsWith('.employment_type_ft_pt')) {
      return false;
    }

    const isJobWageField = jobWageFields.some(f => fieldKey === f || fieldKey.endsWith('.' + f));
    const isUnempField = fieldKey === 'unemployed_duration_months' || fieldKey.endsWith('.unemployed_duration_months');

    if (isJobWageField || isUnempField) {
      if (!status) return false;
      const isWorking = status === 'employed_ft' || status === 'employed_pt';
      const isNotWorking = status === 'unemployed' || status === 'not_in_labor_force';
      
      if (isJobWageField) return isWorking;
      if (isUnempField) return isNotWorking;
    }

    // Barriers Checklist: If other_barrier is selected in specific_barriers, show barrier_notes
    if (fieldKey === 'vocational.barrier_notes') {
      const voc = (values.vocational || {}) as any;
      const barriers = voc.specific_barriers as string[];
      return Array.isArray(barriers) && barriers.includes('other_barrier');
    }

    // Support System internal computed fields: Hide from UI rendering
    if (fieldKey.endsWith('.has_sponsor_mentor') || fieldKey.endsWith('.case_manager_assigned')) {
      return false;
    }

    // Vocational Section: Hide completely from UI card layout (as it is combined inside Launch Toolkit)
    if (fieldKey === 'vocational' || fieldKey.startsWith('vocational.')) {
      return false;
    }

    // Technology internal computed fields: Hide from UI rendering
    if (
      fieldKey.endsWith('.has_smartphone') ||
      fieldKey.endsWith('.has_email') ||
      fieldKey.endsWith('.internet_access_type')
    ) {
      return false;
    }

    // Identification (Your Launch Toolkit) computed fields: Hide from UI rendering
    if (
      fieldKey.endsWith('.has_state_id') ||
      fieldKey.endsWith('.has_social_security_card') ||
      fieldKey.endsWith('.has_birth_certificate')
    ) {
      return false;
    }

    // Other support detail conditional visibility
    if (fieldKey.endsWith('.other_support_detail')) {
      const iden = (values.identification || {}) as any;
      const paths = Array.isArray(iden.support_paths) ? iden.support_paths : [];
      return paths.includes('other_help');
    }

    return true;
  };

  // Render sections based on top-level properties if uiSchema doesn't have sections array
  const sectionKeys = (uiSchema?.['ui:order'] || Object.keys(properties)) as string[];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {sectionKeys.map((sectionKey: string) => {
        const field = properties[sectionKey];
        if (!field || !isFieldVisible(sectionKey)) return null;

        const uiSection = uiSchema?.[sectionKey] || {};

        return (
          <div key={sectionKey} className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {uiSection['ui:title'] || field.title || sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </h3>
            {uiSection['ui:description'] || field.description ? (
              <p className="text-sm text-slate-500 mb-4">
                {uiSection['ui:description'] || field.description}
              </p>
            ) : null}
            
            {renderField(sectionKey, field, values[sectionKey], handleChange, values, isFieldVisible, uiSection)}
          </div>
        );
      })}

      <button type="submit" disabled={loading} className="btn-primary w-full text-sm font-semibold py-3">
        {loading ? 'Submitting...' : 'Submit Assessment'}
      </button>
    </form>
  );
}
