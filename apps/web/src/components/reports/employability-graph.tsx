'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from 'recharts';

interface EmployabilityMetric {
  participantId: string;
  enrollmentDate: string;
  outcome: string;
  score: number;
  weeksInProgram: number;
  sectors: string[];
  resources: number;
  inhibitors: number;
}

interface EmployabilityGraphProps {
  data: EmployabilityMetric[];
  isLoading: boolean;
}

export function EmployabilityGraph({ data, isLoading }: EmployabilityGraphProps) {
  if (isLoading) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
          <p className="text-sm text-slate-500 font-medium">Loading projection data...</p>
        </div>
      </div>
    );
  }

  // Formatting data for Recharts (it prefers simple objects)
  const chartData = data || [];

  return (
    <div className="w-full pr-4 overflow-hidden">
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart
          margin={{
            top: 40,
            right: 20,
            bottom: 40,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            type="number"
            dataKey="weeksInProgram"
            name="Weeks in Program"
            unit=" wks"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ 
              value: 'Amount of Time (Weeks in Program)', 
              position: 'insideBottom', 
              offset: -20, 
              fill: '#64748B', 
              fontSize: 12,
              fontWeight: 500 
            }}
          />
          <YAxis
            type="number"
            dataKey="score"
            name="Employability"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            label={{ 
              value: 'Employability Score (Resources - Inhibitors)', 
              angle: -90, 
              position: 'insideLeft', 
              offset: 10, 
              fill: '#64748B', 
              fontSize: 12,
              fontWeight: 500 
            }}
          />
          <ZAxis type="number" range={[100, 100]} />
          
          {/* Readiness Zone - Top Right */}
          <ReferenceArea
            x1={12} // 3 months mark
            y1={5}  // Above 5 score
            fill="#F0FDF4"
            fillOpacity={0.6}
            stroke="#DCFCE7"
            strokeDasharray="5 5"
          />

          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const metric = payload[0].payload as EmployabilityMetric;
                return (
                  <div className="rounded-lg bg-white p-3 shadow-xl ring-1 ring-slate-900/5 min-w-[200px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">
                      Participant ID: ...{metric.participantId?.slice(-6) || 'N/A'}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                        <span className="text-xs text-slate-500 font-medium">Projection:</span>
                        <span className={`text-xs font-bold ${metric.score > 5 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {metric.score > 5 ? 'High Readiness' : metric.score > 0 ? 'Developing' : 'Not Ready'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1 px-1">
                        <span className="text-xs text-slate-500">Duration:</span>
                        <span className="text-xs font-bold text-slate-900">{metric.weeksInProgram} weeks</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 px-1">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Resources</p>
                          <p className="text-sm font-bold text-emerald-600">+{metric.resources}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Inhibitors</p>
                          <p className="text-sm font-bold text-rose-600">-{metric.inhibitors}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={48}
            iconType="circle"
            formatter={(value) => <span className="text-xs font-semibold text-slate-600 mx-1">{value}</span>}
          />

          <Scatter 
            name="Placed/Completed" 
            data={chartData.filter(d => d.outcome === 'completed')} 
            fill="#10b981" 
          />
          <Scatter 
            name="Active" 
            data={chartData.filter(d => d.outcome === 'active')} 
            fill="#3b82f6" 
          />
          <Scatter 
            name="Pending/Pending" 
            data={chartData.filter(d => d.outcome !== 'active' && d.outcome !== 'completed')} 
            fill="#94a3b8" 
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
