import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrajectoryPoint } from '../types';

interface ChartsProps {
  data: TrajectoryPoint[];
  currentTheta2: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
        <p className="font-bold text-slate-700 mb-1">{`θ₂: ${Number(label).toFixed(0)}°`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(1)}°`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Charts: React.FC<ChartsProps> = ({ data, currentTheta2 }) => {
  // Normalize angles to be somewhat continuous or wrap 0-360. 
  // Recharts handles gaps if value is null, but we pre-filter valid data.
  // Note: atan2 returns -180 to 180. We might want to shift to 0-360 for cleaner plots or keep as is.
  // The 'toDeg' util returns -180 to 180 (implied, or check implementation).
  // Let's assume math.ts output is standard -180 to 180 or 0 to 360. 
  
  return (
    <div className="w-full h-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Kinematic Response (θ₃ & θ₄ vs θ₂)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="theta2" 
            type="number" 
            domain={[0, 360]} 
            unit="°" 
            tick={{fontSize: 10, fill: '#64748b'}}
            ticks={[0, 90, 180, 270, 360]}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{fontSize: 10, fill: '#64748b'}} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="theta3"
            name="Coupler θ₃"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="theta4"
            name="Output θ₄"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* Vertical line for current position */}
          <ReferenceLine x={currentTheta2} stroke="#3b82f6" strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;
