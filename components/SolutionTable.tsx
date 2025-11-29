import React from 'react';
import { solveLinkage } from '../utils/math';
import { LinkageConfig } from '../types';

interface SolutionTableProps {
  config: LinkageConfig;
  assemblyMode: 1 | -1;
}

const SolutionTable: React.FC<SolutionTableProps> = ({ config, assemblyMode }) => {
  // Desired test angles in radians (converted to degrees for solver)
  // 0, pi/2 (90), pi (180), -pi/2 (-90 or 270)
  const testAngles = [0, 90, 180, -90];

  const results = testAngles.map((angle) => {
    // Normalize display angle
    const displayAngle = angle < 0 ? `${angle}°` : `${angle}°`;
    const normalizedAngle = angle < 0 ? 360 + angle : angle;
    
    const sol = solveLinkage({ ...config, theta2: normalizedAngle }, assemblyMode);
    
    return {
      angle: displayAngle,
      theta2: normalizedAngle,
      theta3: sol.isValid ? sol.theta3.toFixed(2) : 'N/A',
      theta4: sol.isValid ? sol.theta4.toFixed(2) : 'N/A',
      isValid: sol.isValid
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-700">Exact Solutions</h3>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium">
          <tr>
            <th className="px-4 py-2">θ₂ (Input)</th>
            <th className="px-4 py-2">θ₃ (Coupler)</th>
            <th className="px-4 py-2">θ₄ (Output)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((res, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="px-4 py-2 font-mono text-slate-700">{res.angle}</td>
              <td className={`px-4 py-2 font-mono ${res.isValid ? 'text-violet-600' : 'text-slate-400'}`}>
                {res.theta3}°
              </td>
              <td className={`px-4 py-2 font-mono ${res.isValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                {res.theta4}°
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SolutionTable;
