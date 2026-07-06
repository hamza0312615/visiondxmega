import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function LiveChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#94a3b8" 
          tick={{fill: '#94a3b8'}} 
          tickLine={false}
          minTickGap={30}
        />
        <YAxis 
          stroke="#94a3b8" 
          tick={{fill: '#94a3b8'}}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          itemStyle={{ color: '#f8fafc' }}
        />
        <Area 
          type="monotone" 
          dataKey="variance" 
          stroke="#34d399" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorVar)" 
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
