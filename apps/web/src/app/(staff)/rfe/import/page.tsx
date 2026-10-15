'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/use-api';
import { ApiError } from '@/lib/api-client';
import Papa from 'papaparse';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function RFEImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogDetails, setDialogDetails] = useState<string[] | null>(null);

  const importCSV = useApiMutation<ImportResult, { csv: string }>(
    '/rfes/import',
    'post',
    {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (error) => {
        const message = ApiError.isApiError(error)
          ? error.message
          : (error as any)?.message || 'Import failed';
        
        let details = (error as any)?.details;
        if (details && Array.isArray(details)) {
          // Simplify messages: "Rows 2-4: missing required field 'name' (or ...)" -> "Missing required field 'name'"
          const simplified = details.map((d: any) => {
            const str = String(d);
            const partAfterColon = str.includes(':') ? str.split(':')[1].trim() : str;
            const coreMessage = partAfterColon.split('(')[0].trim();
            return coreMessage.charAt(0).toUpperCase() + coreMessage.slice(1);
          });
          // Unique messages only
          setDialogDetails(Array.from(new Set(simplified)));
        } else if (details) {
          setDialogDetails([String(details)]);
        } else {
          setDialogDetails(null);
        }
        
        setDialogError(message);
        setShowErrorDialog(true);
      },
    },
  );

  const parseCSV = (file: File) => {
    setFileName(file.name);
    setResult(null);
    importCSV.reset();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, string>;
          const parsedHeaders = Object.keys(firstRow);
          setHeaders(parsedHeaders);

          const rows = results.data.slice(0, 5).map((row: any) =>
            parsedHeaders.map((h) => String(row[h] || '')),
          );
          setPreviewRows(rows);

          // Re-generate CSV string for backend, or we could send the JSON
          // But the backend expects 'csv' string
          const csvString = Papa.unparse(results.data);
          setCsvContent(csvString);
        }
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
      },
    });
  };

  const handleFileRead = (file: File) => {
    setShowErrorDialog(false);
    parseCSV(file);
  };

  const downloadTemplate = () => {
    const headers = [
      'name',
      'sector',
      'city',
      'state',
      'phone',
      'email',
      'is_rfe_certified',
      'trainee_readiness',
      'notes',
    ];
    const data = [
      [
        'Example Corporation',
        'Technology',
        'Denver',
        'CO',
        '555-0123',
        'contact@example.com',
        'true',
        'yes',
        'Great partner for apprenticeships',
      ],
    ];
    const csv = Papa.unparse({ fields: headers, data });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employer_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileRead(file);
    }
  }, []);

  const handleImport = () => {
    if (csvContent) {
      importCSV.mutate({ csv: csvContent });
    }
  };

  const handleReset = () => {
    setCsvContent('');
    setFileName('');
    setPreviewRows([]);
    setHeaders([]);
    setResult(null);
    setShowErrorDialog(false);
    setDialogError(null);
    setDialogDetails(null);
    importCSV.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Import Employers</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={downloadTemplate}
          >
            Download Template
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => router.push('/rfe')}
          >
            Back to Directory
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`card cursor-pointer border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="mt-4 text-sm text-slate-600">
          {fileName ? (
            <>
              Selected: <span className="font-medium">{fileName}</span>
            </>
          ) : (
            <>
              Drag and drop a CSV file here, or{' '}
              <span className="font-medium text-blue-600">click to browse</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Required columns: <span className="font-medium">name, sector</span>.
          Optional: city, state, phone, email, is_rfe_certified (true/false),
          trainee_readiness (yes/limited/no)
        </p>
      </div>

      {/* Preview Table */}
      {previewRows.length > 0 && (
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Preview (first {previewRows.length} rows)
          </h2>
          <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                      >
                        {cell || '--'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!result && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={importCSV.isPending}
            >
              {importCSV.isPending ? 'Importing...' : 'Import All Rows'}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card space-y-3 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Import Results</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{result.imported}</p>
              <p className="text-sm text-green-600">Imported</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
              <p className="text-sm text-yellow-600">Skipped</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">
                {result.errors.length}
              </p>
              <p className="text-sm text-red-600">Errors</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-red-800">Errors:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => router.push('/rfe')}
          >
            Back to Directory
          </button>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 p-2">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {dialogError || 'Import Error'}
              </h2>
            </div>

            <div className="mb-6">
              {dialogDetails && dialogDetails.length > 0 ? (
                <ul className="space-y-2">
                  {dialogDetails.map((detail, i) => (
                    <li key={i} className="text-sm text-slate-600">
                      {detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">
                  Please check your CSV format and try again.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-primary flex-1 sm:flex-none"
                onClick={handleReset}
              >
                Okay
              </button>
              <button
                type="button"
                className="btn-secondary flex-1 sm:flex-none"
                onClick={() => {
                  setShowErrorDialog(false);
                  fileInputRef.current?.click();
                }}
              >
                Choose a new CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
