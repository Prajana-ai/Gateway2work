'use client';

import React from 'react';
import { format } from 'date-fns';
import { EmploymentOutcomeDto } from '@impactforge/shared';
import { StatusBadge } from '@/components/status-badge';

interface EmploymentOutcomeListProps {
  outcomes: EmploymentOutcomeDto[];
}

export const EmploymentOutcomeList: React.FC<EmploymentOutcomeListProps> = ({ outcomes }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {outcomes.map((o) => (
            <tr key={o.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {o.start_date ? format(new Date(o.start_date), 'P') : '--'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.job_title || '--'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.employer_industry || '--'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.work_mode || '--'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.starting_wage ? `$${o.starting_wage}` : '--'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {o.retention_90_day ? <StatusBadge status="90-Day Retention" variant="active" /> : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
