'use client';

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { apiClient } from '@/lib/api-client';

// ── Types ──

interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
}

interface AiResponse {
  answer: string;
  table?: TableData;
  metadata?: {
    executionTimeMs?: number;
    [key: string]: unknown;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  table?: TableData;
  executionTimeMs?: number;
}

const SUGGESTED_QUESTIONS = [
  'Placement rates by sector',
  'Assessment completion rates',
  'Common barriers',
  'Top interests',
  'Referral sources',
];

// ── Page ──

export default function AiReportsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(q: string) {
    if (!q.trim()) return;
    const userMessage: Message = { role: 'user', content: q.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await apiClient.post<AiResponse>('/reports/conversational', { q: q.trim() });
      const aiMessage: Message = {
        role: 'assistant',
        content: res.answer,
        table: res.table,
        executionTimeMs: res.metadata?.executionTimeMs,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I was unable to process that question. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSend(question);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">AI Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask questions about your data in plain language.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-2">
              What would you like to know?
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Try one of the suggested questions below, or type your own.
            </p>

            {/* Suggested questions */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((sq) => (
                <button
                  key={sq}
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  onClick={() => handleSend(sq)}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white ring-1 ring-slate-200 text-slate-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {/* Data table */}
                  {msg.table && msg.table.rows.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            {msg.table.columns.map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-xs font-semibold uppercase text-slate-500"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {msg.table.rows.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              {msg.table!.columns.map((col) => (
                                <td
                                  key={col}
                                  className="px-3 py-2 text-xs text-slate-700"
                                >
                                  {String(row[col] ?? '--')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Chart placeholder */}
                  {msg.table && msg.table.rows.length > 0 && (
                    <div className="mt-3 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-6 text-xs text-slate-400">
                      Chart visualization placeholder
                    </div>
                  )}

                  {/* Execution time */}
                  {msg.executionTimeMs !== undefined && (
                    <p className="mt-2 text-[11px] text-slate-400">
                      Completed in {msg.executionTimeMs}ms
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white ring-1 ring-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested questions (when there are messages) */}
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_QUESTIONS.map((sq) => (
            <button
              key={sq}
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
              onClick={() => handleSend(sq)}
              disabled={loading}
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Ask a question about your data..."
          value={question}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!question.trim() || loading}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
