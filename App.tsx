import React, { useState, useEffect, useMemo, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import LinkageCanvas from './components/LinkageCanvas';
import Charts from './components/Charts';
import SolutionTable from './components/SolutionTable';
import { LinkageConfig } from './types';
import { solveLinkage, computeTrajectory, toDeg } from './utils/math';

const App: React.FC = () => {
  // Initial State based on prompt:
  // r1 = 1, r2 = 2, r3 = 3.5, r4 = 4
  // r6 = sqrt(5) approx 2.236
  // beta = arctan(0.5) approx 26.565 deg
  const [config, setConfig] = useState<LinkageConfig>({
    r1: 1,
    r2: 2,
    r3: 3.5,
    r4: 4,
    r6: Math.sqrt(5),
    beta: toDeg(Math.atan(0.5)),
    theta2: 0,
  });

  const [assemblyMode, setAssemblyMode] = useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Animation Loop
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      setConfig((prev) => {
        // 60 deg per second base speed * multiplier
        const speed = 0.06 * animationSpeed; 
        let newTheta = prev.theta2 + speed * deltaTime;
        if (newTheta >= 360) newTheta -= 360;
        return { ...prev, theta2: newTheta };
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = undefined;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animationSpeed]);

  // Derived Calculations
  const solution = useMemo(() => 
    solveLinkage(config, assemblyMode), 
    [config, assemblyMode]
  );
  
  // We only recompute full trajectory when geometry changes, not theta2
  const trajectory = useMemo(() => 
    computeTrajectory(config, assemblyMode),
    [config.r1, config.r2, config.r3, config.r4, config.r6, config.beta, assemblyMode]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <ControlPanel
        config={config}
        onChange={setConfig}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        assemblyMode={assemblyMode}
        onToggleMode={() => setAssemblyMode(m => m === 1 ? -1 : 1)}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden p-4 gap-4">
        {/* Top Section: Visualization and Specific Data */}
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-[2] h-full min-h-0">
            <LinkageCanvas 
              config={config} 
              solution={solution} 
              trajectory={trajectory}
            />
          </div>
          <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
            <SolutionTable config={config} assemblyMode={assemblyMode} />
            
            {/* Legend / Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
               <h4 className="font-bold text-slate-800 mb-2">Mechanism Status</h4>
               <ul className="space-y-1">
                 <li className="flex justify-between">
                   <span>Assembly:</span>
                   <span className={solution.isValid ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                     {solution.isValid ? "Valid" : "Broken"}
                   </span>
                 </li>
                 <li className="flex justify-between">
                   <span>Current Mode:</span>
                   <span>{assemblyMode === 1 ? "Open" : "Crossed"}</span>
                 </li>
                 <li className="flex justify-between mt-2 pt-2 border-t border-slate-100">
                   <span>Input θ₂:</span>
                   <span className="font-mono">{config.theta2.toFixed(1)}°</span>
                 </li>
                 <li className="flex justify-between">
                   <span>Coupler θ₃:</span>
                   <span className="font-mono">{solution.isValid ? solution.theta3.toFixed(1) + "°" : "-"}</span>
                 </li>
                 <li className="flex justify-between">
                   <span>Output θ₄:</span>
                   <span className="font-mono">{solution.isValid ? solution.theta4.toFixed(1) + "°" : "-"}</span>
                 </li>
               </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Charts */}
        <div className="flex-shrink-0">
          <Charts data={trajectory} currentTheta2={config.theta2} />
        </div>
      </main>
    </div>
  );
};

export default App;
