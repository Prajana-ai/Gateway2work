'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/use-api';
import { StatusBadge } from '@/components/status-badge';

const VARIABLES = [
  // Staffing
  { id: '312', key: 'score_312_competitive_work', label: 'Competitive Work', category: 'Staffing' },
  { id: '313', key: 'score_313_caseload_size', label: 'Provider Caseload Size', category: 'Staffing' },
  { id: '314', key: 'score_314_employment_staff', label: 'Employment Services Staff', category: 'Staffing' },
  { id: '315', key: 'score_315_vocational_generalists', label: 'Vocational Generalists', category: 'Staffing' },
  // Organization
  { id: '316', key: 'score_316_mh_integration', label: 'Mental Health Team Integration', category: 'Organization' },
  { id: '317', key: 'score_317_mh_contact', label: 'Mental Health Provider Contact', category: 'Organization' },
  { id: '318', key: 'score_318_vr_collaboration', label: 'IPS and VR Collaboration', category: 'Organization' },
  { id: '319', key: 'score_319_vocational_unit', label: 'Vocational Unit', category: 'Organization' },
  { id: '320', key: 'score_320_ips_supervisor', label: 'IPS Supervisor', category: 'Organization' },
  { id: '321', key: 'score_321_zero_exclusion', label: 'Zero Exclusion', category: 'Organization' },
  { id: '322', key: 'score_322_agency_promotion', label: 'Competitive Employment Promotion', category: 'Organization' },
  { id: '323', key: 'score_323_exec_support', label: 'Executive Support for IPS', category: 'Organization' },
  // Services
  { id: '324', key: 'score_324_work_incentive_planning', label: 'Work Incentive Planning', category: 'Services' },
  { id: '325', key: 'score_325_disclosure', label: 'Disclosure', category: 'Services' },
  { id: '326', key: 'score_326_vocational_assessment', label: 'Work-based Vocational Assessment', category: 'Services' },
  { id: '327', key: 'score_327_rapid_job_search', label: 'Rapid Job Search', category: 'Services' },
  { id: '328', key: 'score_328_individualized_job_search', label: 'Individualized Job Search', category: 'Services' },
  { id: '329', key: 'score_329_employer_contact', label: 'Frequent Employer Contact', category: 'Services' },
  { id: '330', key: 'score_330_employer_contact_quality', label: 'Employer Contact Quality', category: 'Services' },
  { id: '331', key: 'score_331_job_diversity', label: 'Job Type Diversity', category: 'Services' },
  { id: '332', key: 'score_332_employer_diversity', label: 'Employer Diversity', category: 'Services' },
  { id: '333', key: 'score_333_competitive_jobs', label: 'Competitive Jobs', category: 'Services' },
  { id: '334', key: 'score_334_individualized_follow_along', label: 'Individualized Follow-along Supports', category: 'Services' },
  { id: '335', key: 'score_335_time_unlimited_follow_along', label: 'Time-unlimited Follow-along Supports', category: 'Services' },
  { id: '336', key: 'score_336_community_services', label: 'Community-based Services', category: 'Services' },
  { id: '337', key: 'score_337_assertive_engagement', label: 'Assertive Engagement by Team', category: 'Services' },
];

export default function IpsReviewDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: review, isLoading } = useApiQuery<any>(
    ['ips-review', id],
    `/ips/reviews/${id}`,
  );

  if (isLoading) return <div className="p-8 animate-pulse">Loading review details...</div>;
  if (!review) return <div className="p-8">Review not found.</div>;

  const categories = ['Staffing', 'Organization', 'Services'];

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 3) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (score >= 2) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => router.push('/ips/reviews')}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2"
          >
            ← Back to List
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Fidelity Review: {new Date(review.review_date).toLocaleDateString()}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge 
              status={review.status} 
              variant={review.status === 'finalized' ? 'active' : 'inactive'} 
            />
            <span className="text-sm text-slate-500 font-medium">Audited by {review.reviewer_name}</span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Final Fidelity Score</p>
          <p className="text-5xl font-black text-slate-900">
            {review.total_score} <span className="text-xl text-slate-400 font-normal">/ 125</span>
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {categories.map(cat => (
          <section key={cat} className="space-y-6">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{cat} Components</h2>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {cat === 'Staffing' ? '20' : cat === 'Organization' ? '40' : '65'} Points Max
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {VARIABLES.filter(v => v.category === cat).map(v => {
                const score = review[v.key];
                return (
                  <div key={v.id} className="card p-5 flex items-center justify-between border-slate-100 shadow-none hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{v.id}</span>
                      <h3 className="font-bold text-slate-800">{v.label}</h3>
                    </div>
                    <div className={`h-10 w-10 rounded-lg border flex items-center justify-center font-black text-lg ${getScoreColor(score)}`}>
                      {score || '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {review.notes && (
          <section className="card p-8 bg-slate-50 border-slate-200 shadow-none">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Qualitative Feedback & Action Plan</h2>
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {review.notes}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
