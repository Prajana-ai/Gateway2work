'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/use-api';

interface RFE {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  industry: string;
  // In-bound Partner Variables
  service_provider_id: string;
  service_provider_name: string;
  contact_person: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  employer_address: string;
  partnership_start_date: string;
  // Out-bound specific
  is_rfe_certified: boolean;
  is_fair_chance: boolean;
  hiring_sectors: string;
  entry_level_openings: string | number;
  salary_range: string; // minimum wage, competitive wage, livable wage
  benefits_offered: string;
  // Initial Metrics (optional)
  referral_count: number;
  hire_count: number;
  retention_90_day_count: number;
  notes: string;
}

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select Industry' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'food_service', label: 'Food Service' },
  { value: 'retail', label: 'Retail' },
  { value: 'construction', label: 'Construction' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'logistics_warehouse', label: 'Logistics / Warehouse' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'it_technology', label: 'IT / Technology' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'landscaping_maintenance', label: 'Landscaping / Maintenance' },
  { value: 'other', label: 'Other' },
];

const BENEFIT_OPTIONS = [
  { value: '', label: 'Select Benefits' },
  { value: 'full_benefits', label: 'Full Benefits (Medical/Dental/Vision)' },
  { value: 'health_only', label: 'Health Insurance Only' },
  { value: 'pto_401k', label: 'PTO + 401k' },
  { value: 'pto_only', label: 'Paid Time Off Only' },
  { value: 'no_benefits', label: 'No Benefits' },
  { value: 'other', label: 'Other / Competitive' },
];

const SALARY_OPTIONS = [
  { value: '', label: 'Select Salary Type' },
  { value: 'minimum_wage', label: 'Minimum Wage' },
  { value: 'competitive_wage', label: 'Competitive Wage' },
  { value: 'livable_wage', label: 'Livable Wage' },
];

export default function NewRFEPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: '',
    industry: '',
    service_provider_id: '',
    service_provider_name: '',
    contact_person: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    employer_address: '',
    partnership_start_date: new Date().toISOString().split('T')[0],
    is_rfe_certified: true,
    is_fair_chance: false,
    hiring_sectors: '',
    entry_level_openings: 0,
    salary_range: '',
    benefits_offered: '',
    referral_count: 0,
    hire_count: 0,
    retention_90_day_count: 0,
    notes: '',
  });

  const createRFE = useApiMutation<RFE, FormData>('/rfes', 'post', {
    onSuccess: () => {
      router.push('/rfe');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRFE.mutate(form);
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Add New Employer</h1>
          <p className="mt-1 text-slate-500 text-base">Register a new recovery friendly or fair chance partner.</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push('/rfe')}
        >
          Back to Directory
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <section className="card p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Employer Name *</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                placeholder="e.g. Acme Corp"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Industry / Sector *</label>
              <select
                className="input-field w-full"
                value={form.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                required
              >
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Partnership Start Date</label>
              <input
                type="date"
                className="input-field w-full"
                value={form.partnership_start_date}
                onChange={(e) => updateField('partnership_start_date', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Employer Address</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.employer_address}
                onChange={(e) => updateField('employer_address', e.target.value)}
                placeholder="Full business address"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={form.is_rfe_certified}
                onChange={(e) => updateField('is_rfe_certified', e.target.checked)}
              />
              <span className="text-sm font-bold text-slate-700">Recovery Friendly Employer (RFE)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={form.is_fair_chance}
                onChange={(e) => updateField('is_fair_chance', e.target.checked)}
              />
              <span className="text-sm font-bold text-slate-700">Fair Chance Employer</span>
            </label>
          </div>
        </section>

        {/* Contact Information */}
        <section className="card p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Primary Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Person</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.contact_person}
                onChange={(e) => updateField('contact_person', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Title</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.contact_title}
                onChange={(e) => updateField('contact_title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Email</label>
              <input
                type="email"
                className="input-field w-full"
                value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Phone</label>
              <input
                type="tel"
                className="input-field w-full"
                value={form.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Hiring & Logistics */}
        <section className="card p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Hiring & Logistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hiring Sectors</label>
              <select
                className="input-field w-full"
                value={form.hiring_sectors}
                onChange={(e) => updateField('hiring_sectors', e.target.value)}
              >
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Entry Level Openings</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input-field w-full"
                value={form.entry_level_openings}
                onChange={(e) => updateField('entry_level_openings', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Salary Type</label>
              <select
                className="input-field w-full"
                value={form.salary_range}
                onChange={(e) => updateField('salary_range', e.target.value)}
              >
                {SALARY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Benefits Offered</label>
              <select
                className="input-field w-full"
                value={form.benefits_offered}
                onChange={(e) => updateField('benefits_offered', e.target.value)}
              >
                {BENEFIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* In-Bound Provider Data */}
        <section className="card p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Service Provider Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Provider ID</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.service_provider_id}
                onChange={(e) => updateField('service_provider_id', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Provider Name</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.service_provider_name}
                onChange={(e) => updateField('service_provider_name', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Initial Performance Tracking */}
        <section className="card p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Participants Referred</label>
              <input
                type="number"
                className="input-field w-full"
                value={form.referral_count}
                onChange={(e) => updateField('referral_count', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Participants Hired</label>
              <input
                type="number"
                className="input-field w-full"
                value={form.hire_count}
                onChange={(e) => updateField('hire_count', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Retained @ 90 Days</label>
              <input
                type="number"
                className="input-field w-full"
                value={form.retention_90_day_count}
                onChange={(e) => updateField('retention_90_day_count', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Additional Notes</label>
            <textarea
              className="input-field w-full h-32"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn-secondary px-10"
            onClick={() => router.push('/rfe')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary px-10"
            disabled={createRFE.isPending}
          >
            {createRFE.isPending ? 'Saving...' : 'Register Employer'}
          </button>
        </div>
        
        {createRFE.isError && (
          <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-100 text-center font-bold">
            Failed to save employer data. Please check your inputs and try again.
          </p>
        )}
      </form>
    </div>
  );
}
