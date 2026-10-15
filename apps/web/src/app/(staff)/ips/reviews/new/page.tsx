'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';

interface AutomatedStats {
  competitiveWorkRate: number;
  averageCaseload: number;
  averageDaysToFirstContact: number;
  averageWeeklyEmployerContacts: number;
}

const VARIABLES = [
  // Staffing
  { id: '312', key: 'score_312_competitive_work', label: 'Competitive Work', category: 'Staffing', desc: '% of participants that have competitive work secured' },
  { id: '313', key: 'score_313_caseload_size', label: 'Provider Caseload Size', category: 'Staffing', desc: 'Ideally less than 25 participants per specialist' },
  { id: '314', key: 'score_314_employment_staff', label: 'Employment Services Staff', category: 'Staffing', desc: 'Specialists only provide employment services' },
  { id: '315', key: 'score_315_vocational_generalists', label: 'Vocational Generalists', category: 'Staffing', desc: 'Specialist carries out every phase of service' },
  // Organization
  { id: '316', key: 'score_316_mh_integration', label: 'Mental Health Team Integration', category: 'Organization', desc: 'Part of mental health treatment teams' },
  { id: '317', key: 'score_317_mh_contact', label: 'Mental Health Provider Contact', category: 'Organization', desc: 'Active participation in weekly meetings' },
  { id: '318', key: 'score_318_vr_collaboration', label: 'IPS and VR Collaboration', category: 'Organization', desc: 'Frequent contact with VR counselors' },
  { id: '319', key: 'score_319_vocational_unit', label: 'Vocational Unit', category: 'Organization', desc: '2 FT specialists + 1 manager meet weekly' },
  { id: '320', key: 'score_320_ips_supervisor', label: 'IPS Supervisor', category: 'Organization', desc: 'Supervision improves specialist skills' },
  { id: '321', key: 'score_321_zero_exclusion', label: 'Zero Exclusion', category: 'Organization', desc: 'Access regardless of job readiness' },
  { id: '322', key: 'score_322_agency_promotion', label: 'Competitive Employment Promotion', category: 'Organization', desc: 'Agency promotes work strategies' },
  { id: '323', key: 'score_323_exec_support', label: 'Executive Support for IPS', category: 'Organization', desc: 'Leadership assists in implementation' },
  // Services
  { id: '324', key: 'score_324_work_incentive_planning', label: 'Work Incentive Planning', category: 'Services', desc: 'Assistance with benefits (SSI, SNAP)' },
  { id: '325', key: 'score_325_disclosure', label: 'Disclosure', category: 'Services', desc: 'Information on revealing disability' },
  { id: '326', key: 'score_326_vocational_assessment', label: 'Work-based Vocational Assessment', category: 'Services', desc: 'Updated with active work experience' },
  { id: '327', key: 'score_327_rapid_job_search', label: 'Rapid Job Search', category: 'Services', desc: 'First employer contact within 30 days' },
  { id: '328', key: 'score_328_individualized_job_search', label: 'Individualized Job Search', category: 'Services', desc: 'Based on participant preferences' },
  { id: '329', key: 'score_329_employer_contact', label: 'Frequent Employer Contact', category: 'Services', desc: '6 face-to-face contacts weekly' },
  { id: '330', key: 'score_330_employer_contact_quality', label: 'Employer Contact Quality', category: 'Services', desc: 'Planned visits to gauge needs' },
  { id: '331', key: 'score_331_job_diversity', label: 'Job Type Diversity', category: 'Services', desc: 'Helping obtain different types of jobs' },
  { id: '332', key: 'score_332_employer_diversity', label: 'Employer Diversity', category: 'Services', desc: 'Jobs through a variety of employers' },
  { id: '333', key: 'score_333_competitive_jobs', label: 'Competitive Jobs', category: 'Services', desc: 'Permanent rather than temporary status' },
  { id: '334', key: 'score_334_individualized_follow_along', label: 'Individualized Follow-along Supports', category: 'Services', desc: 'Based on job and participant history' },
  { id: '335', key: 'score_335_time_unlimited_follow_along', label: 'Time-unlimited Follow-along Supports', category: 'Services', desc: 'Specific contact intervals for a year+' },
  { id: '336', key: 'score_336_community_services', label: 'Community-based Services', category: 'Services', desc: 'Provided in natural community settings' },
  { id: '337', key: 'score_337_assertive_engagement', label: 'Assertive Engagement by Team', category: 'Services', desc: 'Termination not based on missed appts' },
];

const SCORE_LABELS = ['Minimal', 'Low', 'Moderate', 'High', 'Highest'];

function StarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all hover:scale-125 focus:outline-none ${
              star <= value ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 hover:text-slate-400'
            }`}
          >
            <svg
              className="h-9 w-9 fill-current"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      <span className={`text-xs font-black uppercase tracking-widest ${value ? 'text-blue-700' : 'text-slate-300'}`}>
        {value ? `${value} - ${SCORE_LABELS[value - 1]}` : 'Select Score'}
      </span>
    </div>
  );
}

export default function NewIpsReviewPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: autoStats } = useApiQuery<AutomatedStats>(
    ['ips-auto-stats'],
    '/ips/automated-stats',
  );

  const createReview = useApiMutation('/ips/reviews', 'post', {
    onSuccess: () => router.push('/ips/reviews'),
  });

  const handleScoreChange = (key: string, val: number) => {
    setScores(prev => ({ ...prev, [key]: val }));
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, s) => sum + s, 0);
  };

  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'finalized') => {
    e.preventDefault();
    createReview.mutate({
      review_date: reviewDate,
      status,
      total_score: calculateTotal(),
      notes,
      ...scores
    });
  };

  const getAutoHint = (id: string) => {
    if (!autoStats) return null;
    switch (id) {
      case '312': return `Current: ${autoStats.competitiveWorkRate.toFixed(1)}% employment rate`;
      case '313': return `Current: ${autoStats.averageCaseload.toFixed(1)} avg caseload`;
      case '327': return `Current: ${autoStats.averageDaysToFirstContact} days avg to contact`;
      case '329': return `Current: ${autoStats.averageWeeklyEmployerContacts.toFixed(1)} contacts/week`;
      default: return null;
    }
  };

  const categories = ['Staffing', 'Organization', 'Services'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Fidelity Audit</h1>
          <p className="mt-1 text-slate-500">Conduct a formal review of IPS implementation standards.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="date" 
            className="input-field py-2"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
          />
          <button onClick={() => router.push('/ips/reviews')} className="btn-secondary">Cancel</button>
        </div>
      </div>

      <form className="space-y-12">
        {categories.map(cat => (
          <section key={cat} className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-800">{cat} Components</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {VARIABLES.filter(v => v.category === cat).map(v => (
                <div key={v.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">{v.label}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{v.desc}</p>
                    {getAutoHint(v.id) && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3 flex items-start gap-3">
                        <svg className="h-4 w-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-xs font-bold text-blue-800 uppercase tracking-tight">System Metric</p>
                          <p className="text-sm font-medium text-blue-700">{getAutoHint(v.id)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-48 flex justify-end">
                    <StarRating 
                      value={scores[v.key] || 0} 
                      onChange={(val) => handleScoreChange(v.key, val)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="card p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Review Summary & Notes</h2>
          <textarea 
            className="input-field w-full h-32"
            placeholder="Provide qualitative feedback or action plans derived from this audit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          
          <div className="bg-slate-900 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Fidelity Score</p>
              <p className="text-4xl font-black">{calculateTotal()} <span className="text-xl text-slate-500 font-normal">/ 125</span></p>
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'draft')}
                className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={createReview.isPending}
              >
                Save as Draft
              </button>
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'finalized')}
                className="btn-primary bg-blue-500 hover:bg-blue-400"
                disabled={createReview.isPending}
              >
                Finalize Review
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
