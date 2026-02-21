import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp } from 'lucide-react';
import axios from '../api/axios';

const BudgetTrendChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/company/budget/trends?days=${days}`);
        setData(response.data);
      } catch (error) {
        console.error('Fetch Trend Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[hsl(var(--text-main))] tracking-tight">Budget Spend Trends</h3>
            <p className="text-[hsl(var(--text-muted))] text-xs font-medium uppercase tracking-wider">Aggregated historical bounty expenditures</p>
          </div>
        </div>
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] text-xs font-bold rounded-lg p-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all cursor-pointer"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-subtle))" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--text-muted))', fontSize: 10, fontWeight: 600 }}
              minTickGap={30}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--text-muted))', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(value: number) => `$${value}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--bg-card))', 
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: '12px',
                color: 'hsl(var(--text-main))',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: '#10b981' }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAmount)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetTrendChart;
