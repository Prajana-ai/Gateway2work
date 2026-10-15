'use client';

import { useState, type ChangeEvent } from 'react';

// ── Page ──

export default function BrandingSettingsPage() {
  const [orgName, setOrgName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [accentColor, setAccentColor] = useState('#10B981');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // Placeholder: would POST to tenant settings endpoint
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function isValidHex(hex: string): boolean {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Branding</h1>
        <p className="mt-1 text-sm text-slate-500">
          Customize the look and feel of your participant-facing application.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Organization Name */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Organization
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g., Community Services Agency"
                value={orgName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Logo</h2>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
              <div>
                <button type="button" className="btn-secondary text-sm">
                  Upload Logo
                </button>
                <p className="mt-1 text-xs text-slate-400">
                  PNG or SVG, max 2MB. Recommended 200x200px.
                </p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Colors
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-10 cursor-pointer rounded border border-slate-200 p-0.5"
                    value={primaryColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPrimaryColor(e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="input-field w-32 font-mono text-sm"
                    placeholder="#2563EB"
                    value={primaryColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPrimaryColor(e.target.value)
                    }
                  />
                  {!isValidHex(primaryColor) && primaryColor.length > 0 && (
                    <span className="text-xs text-red-500">Invalid hex</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-10 cursor-pointer rounded border border-slate-200 p-0.5"
                    value={accentColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAccentColor(e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="input-field w-32 font-mono text-sm"
                    placeholder="#10B981"
                    value={accentColor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAccentColor(e.target.value)
                    }
                  />
                  {!isValidHex(accentColor) && accentColor.length > 0 && (
                    <span className="text-xs text-red-500">Invalid hex</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={!orgName.trim()}
            >
              Save Changes
            </button>
            {saved && (
              <span className="text-sm text-green-600">
                Settings saved successfully.
              </span>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Participant PWA Preview
          </h2>
          <div className="card overflow-hidden">
            {/* Simulated phone frame */}
            <div className="mx-auto max-w-[320px] rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-white"
                style={{ backgroundColor: isValidHex(primaryColor) ? primaryColor : '#2563EB' }}
              >
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-3 rounded-sm bg-white/60" />
                  <div className="h-2 w-2 rounded-full bg-white/60" />
                </div>
              </div>

              {/* App header */}
              <div
                className="flex items-center justify-center gap-2 px-4 py-3"
                style={{ backgroundColor: isValidHex(primaryColor) ? primaryColor : '#2563EB' }}
              >
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: isValidHex(accentColor) ? accentColor : '#10B981' }}
                >
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                </div>
                <span className="text-base font-bold text-white">
                  {orgName || 'ImpactForge'}
                </span>
              </div>

              {/* App body preview */}
              <div className="bg-white px-4 py-6 space-y-3">
                <div className="h-3 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-5/6 rounded bg-slate-100" />
                <div className="mt-4 h-10 rounded-lg"
                  style={{ backgroundColor: isValidHex(primaryColor) ? primaryColor : '#2563EB', opacity: 0.9 }}
                />
                <div className="h-3 w-2/3 rounded bg-slate-200 mt-4" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
              </div>

              {/* Bottom nav */}
              <div className="flex items-center justify-around border-t border-slate-200 bg-white px-4 py-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="h-4 w-4 rounded bg-slate-300" />
                  <div className="h-1.5 w-6 rounded bg-slate-200" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="h-4 w-4 rounded"
                    style={{ backgroundColor: isValidHex(primaryColor) ? primaryColor : '#2563EB' }}
                  />
                  <div className="h-1.5 w-6 rounded"
                    style={{ backgroundColor: isValidHex(primaryColor) ? primaryColor : '#2563EB', opacity: 0.4 }}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="h-4 w-4 rounded bg-slate-300" />
                  <div className="h-1.5 w-6 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
