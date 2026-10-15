'use client';

import React from 'react';
import { format } from 'date-fns';
import { FollowUpDto } from '@impactforge/shared';
import { StatusBadge } from '@/components/status-badge';

interface FollowUpListProps {
  followUps: FollowUpDto[];
}

export const FollowUpList: React.FC<FollowUpListProps> = ({ followUps }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {followUps.map((fu) => (
            <tr key={fu.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(fu.due_date), 'P')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={fu.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fu.method || '--'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {fu.completed_date ? format(new Date(fu.completed_date), 'P') : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
