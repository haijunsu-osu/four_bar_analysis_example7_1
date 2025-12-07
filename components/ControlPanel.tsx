import React from 'react';
import { LinkageConfig } from '../types';

interface ControlPanelProps {
  config: LinkageConfig;
  onChange: (newConfig: LinkageConfig) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  assemblyMode: 1 | -1;
  onToggleMode: () => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  onClose?: () => void;
}

const InputControl = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={isNaN(value) ? min : value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 min-w-0"
        />
        <div className="relative w-24 flex-shrink-0">
            <input
                type="number"
                step={step}
                value={isNaN(value) ? '' : value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full pl-2 pr-6 py-1 text-sm text-right bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChange,
  isPlaying,
  onTogglePlay,
  assemblyMode,
  onToggleMode,
  animationSpeed,
  setAnimationSpeed,
  onClose
}) => {
  const updateConfig = (key: keyof LinkageConfig, val: number) => {
    onChange({ ...config, [key]: val });
  };

  return (
    <div className="h-full bg-white border-r border-slate-200 p-6 overflow-y-auto w-80 flex-shrink-0 shadow-lg z-20 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">Linkage Analyst</h1>
          <p className="text-xs text-slate-500">Four-bar mechanism simulator</p>
        </div>
        {onClose && (
           <button 
             onClick={onClose}
             className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
             title="Close Panel"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Animation</h2>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={onTogglePlay}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isPlaying
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
            }`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onToggleMode}
            className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            {assemblyMode === 1 ? 'Open' : 'Crossed'}
          </button>
        </div>
        
        <InputControl
          label="Crank Angle (θ₂)"
          value={config.theta2}
          min={0}
          max={360}
          step={1}
          onChange={(v) => updateConfig('theta2', v)}
          unit="°"
        />
        <InputControl
          label="Speed"
          value={animationSpeed}
          min={0.1}
          max={5}
          step={0.1}
          onChange={setAnimationSpeed}
          unit="x"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Geometry</h2>
        <InputControl
          label="Ground (r₁)"
          value={config.r1}
          min={0.5}
          max={10}
          step={0.1}
          onChange={(v) => updateConfig('r1', v)}
        />
        <InputControl
          label="Crank (r₂)"
          value={config.r2}
          min={0.5}
          max={10}
          step={0.1}
          onChange={(v) => updateConfig('r2', v)}
        />
        <InputControl
          label="Coupler (r₃)"
          value={config.r3}
          min={0.5}
          max={10}
          step={0.1}
          onChange={(v) => updateConfig('r3', v)}
        />
        <InputControl
          label="Output (r₄)"
          value={config.r4}
          min={0.5}
          max={10}
          step={0.1}
          onChange={(v) => updateConfig('r4', v)}
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Coupler Point C</h2>
        <InputControl
          label="Distance AC (r₆)"
          value={config.r6}
          min={0}
          max={10}
          step={0.1}
          onChange={(v) => updateConfig('r6', v)}
        />
        <InputControl
          label="Angle β"
          value={config.beta}
          min={-180}
          max={180}
          step={1}
          onChange={(v) => updateConfig('beta', v)}
          unit="°"
        />
      </div>
    </div>
  );
};

export default ControlPanel;