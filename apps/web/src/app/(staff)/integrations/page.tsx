'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { apiClient } from '@/lib/api-client';

// ── Types ──

interface Provider {
  id: string;
  name: string;
  type: 'CSV' | 'API' | 'HL7' | 'FHIR';
  lastSync?: string;
  status: string;
  connectionConfig?: Record<string, string>;
  [key: string]: unknown;
}

interface FieldMapping {
  id: string;
  providerId: string;
  sourceField: string;
  targetField: string;
  transform: string;
  [key: string]: unknown;
}

interface ImportRecord {
  id: string;
  providerId: string;
  importedAt: string;
  status: string;
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  [key: string]: unknown;
}

interface ImportHistoryResponse {
  items: ImportRecord[];
  total: number;
  page: number;
  totalPages: number;
}

interface ProviderPayload {
  name: string;
  type: string;
  connectionConfig: Record<string, string>;
}

interface MappingPayload {
  sourceField: string;
  targetField: string;
  transform: string;
}

const PROVIDER_TYPES = ['CSV', 'API', 'HL7', 'FHIR'] as const;
const TRANSFORM_TYPES = ['none', 'uppercase', 'lowercase', 'date_format', 'trim', 'map_value'] as const;

// ── Page ──

export default function IntegrationsPage() {
  const queryClient = useQueryClient();

  // Provider form state
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [provName, setProvName] = useState('');
  const [provType, setProvType] = useState<string>('CSV');
  const [provConfig, setProvConfig] = useState('');

  // Mapping form state
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [sourceField, setSourceField] = useState('');
  const [targetField, setTargetField] = useState('');
  const [transform, setTransform] = useState('none');

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // ── Queries ──
  const { data: providers, isLoading: providersLoading } = useApiQuery<Provider[]>(
    ['integration-providers'],
    '/integrations/providers',
  );

  const { data: mappings } = useApiQuery<FieldMapping[]>(
    ['integration-mappings', selectedProviderId ?? ''],
    `/integrations/providers/${selectedProviderId}/mappings`,
    { enabled: !!selectedProviderId },
  );

  const { data: importHistory, isLoading: historyLoading } = useApiQuery<ImportHistoryResponse>(
    ['integration-imports'],
    '/integrations/imports?limit=20',
  );

  // ── Mutations ──
  const createProvider = useApiMutation<Provider, ProviderPayload>(
    '/integrations/providers',
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['integration-providers'] });
        setShowProviderForm(false);
        setProvName('');
        setProvType('CSV');
        setProvConfig('');
      },
    },
  );

  const createMapping = useApiMutation<FieldMapping, MappingPayload>(
    `/integrations/providers/${selectedProviderId}/mappings`,
    'post',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['integration-mappings', selectedProviderId ?? ''] });
        setSourceField('');
        setTargetField('');
        setTransform('none');
      },
    },
  );

  function handleProviderSubmit(e: FormEvent) {
    e.preventDefault();
    let config: Record<string, string> = {};
    try {
      config = provConfig ? JSON.parse(provConfig) : {};
    } catch {
      config = { raw: provConfig };
    }
    createProvider.mutate({ name: provName, type: provType, connectionConfig: config });
  }

  function handleMappingSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedProviderId || !sourceField || !targetField) return;
    createMapping.mutate({ sourceField, targetField, transform });
  }

  async function handleImport() {
    if (!selectedProviderId || !importFile) return;
    setImporting(true);
    setImportError('');
    try {
      await apiClient.post(`/integrations/providers/${selectedProviderId}/import`, {
        filename: importFile.name,
      });
      queryClient.invalidateQueries({ queryKey: ['integration-imports'] });
      setImportFile(null);
    } catch {
      setImportError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  // ── Import history columns ──
  const importColumns: Column<ImportRecord>[] = [
    {
      key: 'importedAt',
      header: 'Date',
      render: (row) => new Date(row.importedAt).toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'recordsImported', header: 'Imported' },
    { key: 'recordsSkipped', header: 'Skipped' },
    { key: 'recordsFailed', header: 'Failed' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage EHR integration providers, field mappings, and data imports.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowProviderForm(true)}
        >
          Add Provider
        </button>
      </div>

      {/* ── Configured Providers ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Configured Providers
        </h2>
        {providersLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse p-5">
                <div className="h-5 w-32 rounded bg-slate-200 mb-3" />
                <div className="h-4 w-20 rounded bg-slate-200 mb-2" />
                <div className="h-4 w-40 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((prov) => (
              <button
                key={prov.id}
                type="button"
                className={`card p-5 text-left transition-all hover:ring-2 hover:ring-blue-200 ${
                  selectedProviderId === prov.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedProviderId(prov.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{prov.name}</h3>
                  <StatusBadge status={prov.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {prov.type}
                  </span>
                  {prov.lastSync && (
                    <span>
                      Last sync: {new Date(prov.lastSync).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No providers configured.</p>
        )}
      </section>

      {/* ── Add Provider Form ── */}
      {showProviderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Add Provider
            </h2>
            <form onSubmit={handleProviderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Provider Name
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g., County EHR"
                  value={provName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setProvName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  className="input-field w-full"
                  value={provType}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setProvType(e.target.value)}
                >
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Connection Config (JSON or URL)
                </label>
                <textarea
                  className="input-field w-full"
                  rows={3}
                  placeholder='{"endpoint": "https://...", "apiKey": "..."}'
                  value={provConfig}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setProvConfig(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!provName || createProvider.isPending}
                >
                  {createProvider.isPending ? 'Adding...' : 'Add Provider'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProviderForm(false)}
                >
                  Cancel
                </button>
              </div>
              {createProvider.isError && (
                <p className="text-sm text-red-600">Failed to add provider.</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Field Mapping Editor ── */}
      {selectedProviderId && (
        <section className="card mb-8 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Field Mappings
          </h2>

          {/* Existing mappings */}
          {mappings && mappings.length > 0 ? (
            <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 mb-4">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source Field
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Target Field
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Transform
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {mappings.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono">
                        {m.sourceField}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono">
                        {m.targetField}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {m.transform}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">No field mappings configured.</p>
          )}

          {/* Add mapping */}
          <form onSubmit={handleMappingSubmit} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Source Field
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., patient_name"
                value={sourceField}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSourceField(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Field
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., firstName"
                value={targetField}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetField(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Transform
              </label>
              <select
                className="input-field"
                value={transform}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTransform(e.target.value)}
              >
                {TRANSFORM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={!sourceField || !targetField || createMapping.isPending}
            >
              {createMapping.isPending ? 'Adding...' : 'Add Mapping'}
            </button>
          </form>
          {createMapping.isError && (
            <p className="mt-2 text-sm text-red-600">Failed to add mapping.</p>
          )}
        </section>
      )}

      {/* ── Import Section ── */}
      {selectedProviderId && (
        <section className="card mb-8 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Import Data
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Upload File
              </label>
              <input
                type="file"
                className="block text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                accept=".csv,.json,.hl7,.xml"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setImportFile(e.target.files?.[0] ?? null);
                }}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!importFile || importing}
              onClick={handleImport}
            >
              {importing ? 'Importing...' : 'Trigger Import'}
            </button>
          </div>
          {importError && (
            <p className="mt-2 text-sm text-red-600">{importError}</p>
          )}
        </section>
      )}

      {/* ── Import History ── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Import History
        </h2>
        <DataTable<ImportRecord>
          columns={importColumns}
          data={importHistory?.items ?? []}
          loading={historyLoading}
          emptyMessage="No import history."
        />
      </section>
    </div>
  );
}
