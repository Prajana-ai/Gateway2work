'use client';

const colorMap: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  inactive: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  declined: 'bg-red-50 text-red-700 ring-red-600/20',
  consented: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  expired: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};

interface StatusBadgeProps {
  status: string;
  variant?: string;
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const key = (variant ?? status ?? 'inactive').toLowerCase();
  const colors = colorMap[key] ?? 'bg-slate-50 text-slate-600 ring-slate-500/20';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors}`}
    >
      {(status || 'inactive').charAt(0).toUpperCase() + (status || 'inactive').slice(1).toLowerCase()}
    </span>
  );
}
