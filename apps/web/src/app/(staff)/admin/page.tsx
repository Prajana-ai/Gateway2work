'use client';

import Link from 'next/link';

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      Coming Soon
    </span>
  );
}

function SectionCard({
  title,
  description,
  comingSoon = false,
  children,
}: {
  title: string;
  description: string;
  comingSoon?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {comingSoon && <ComingSoonBadge />}
      </div>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      {children}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage users, roles, templates, and system settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── User Management ── */}
        <SectionCard
          title="User Management"
          description="Add, edit, and deactivate staff users."
          comingSoon
        >
          <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    User management is not yet available.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ── Roles & Permissions ── */}
        <SectionCard
          title="Roles &amp; Permissions"
          description="Configure role-based access control for your organization."
          comingSoon
        >
          <div className="space-y-3">
            {['Administrator', 'Case Manager', 'Intake Specialist', 'Read-Only'].map(
              (role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{role}</span>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    disabled
                  >
                    Configure
                  </button>
                </div>
              ),
            )}
          </div>
        </SectionCard>

        {/* ── Form Templates ── */}
        <SectionCard
          title="Form Templates"
          description="Create and manage assessment and intake form templates."
        >
          <div className="flex gap-3">
            <Link href="/form-templates" className="btn-primary">
              Manage Templates
            </Link>
          </div>
        </SectionCard>

        {/* ── System Settings ── */}
        <SectionCard
          title="System Settings"
          description="Configure organization-wide settings, integrations, and preferences."
          comingSoon
        >
          <div className="space-y-3">
            {[
              { label: 'Organization Profile', desc: 'Name, address, branding' },
              { label: 'Notifications', desc: 'Email and in-app notification preferences' },
              { label: 'Integrations', desc: 'Medicaid, EHR, and third-party connections' },
              { label: 'Data & Privacy', desc: 'Retention policies and export settings' },
            ].map((setting) => (
              <div
                key={setting.label}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {setting.label}
                  </p>
                  <p className="text-xs text-slate-400">{setting.desc}</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled
                >
                  Configure
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
