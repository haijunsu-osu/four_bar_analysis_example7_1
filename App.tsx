import React, { useState, useEffect, useMemo, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import LinkageCanvas from './components/LinkageCanvas';
import Charts from './components/Charts';
import SolutionTable from './components/SolutionTable';
import { LinkageConfig } from './types';
import { solveLinkage, computeTrajectory, toDeg } from './utils/math';

// Icons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);

const App: React.FC = () => {
  // Parse URL parameters for initial config
  const initialConfig = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const getFloat = (key: string, def: number) => {
      const val = params.get(key);
      return val ? parseFloat(val) : def;
    };

    return {
      r1: getFloat('r1', 1),
      r2: getFloat('r2', 2),
      r3: getFloat('r3', 3.5),
      r4: getFloat('r4', 4),
      r6: getFloat('r6', Math.sqrt(5)),
      beta: getFloat('beta', toDeg(Math.atan(0.5))),
      theta2: getFloat('theta2', 0),
    };
  }, []);

  const isEmbed = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('embed') === 'true';
  }, []);

  const [config, setConfig] = useState<LinkageConfig>(initialConfig);
  const [assemblyMode, setAssemblyMode] = useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(!isEmbed);
  
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 relative">
      {/* Sidebar Control Panel */}
      {isSidebarOpen && (
        <ControlPanel
          config={config}
          onChange={setConfig}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          assemblyMode={assemblyMode}
          onToggleMode={() => setAssemblyMode(m => m === 1 ? -1 : 1)}
          animationSpeed={animationSpeed}
          setAnimationSpeed={setAnimationSpeed}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 flex flex-col h-full overflow-hidden p-4 gap-4 relative">
        {/* Top Section: Visualization and Specific Data */}
        <div className="flex-1 flex gap-4 min-h-0 relative">
          
          {/* Canvas Container */}
          <div className="flex-[2] h-full min-h-0 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <LinkageCanvas 
              config={config} 
              solution={solution} 
              trajectory={trajectory}
            />

            {/* Floating Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-2 bg-white/90 backdrop-blur border border-slate-200 rounded-full shadow-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                title={isSidebarOpen ? "Close Settings" : "Open Settings"}
              >
                {isSidebarOpen ? <SettingsIcon /> : <MenuIcon />}
              </button>
              
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 border rounded-full shadow-sm transition-colors flex items-center justify-center ${
                    isPlaying 
                      ? 'bg-amber-100 border-amber-200 text-amber-600' 
                      : 'bg-white/90 border-slate-200 text-slate-600 hover:text-blue-600'
                  }`}
                  title={isPlaying ? "Pause Animation" : "Play Animation"}
                >
                   {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
              )}
            </div>
          </div>

          {/* Right/Bottom Side Info - Collapsible or Responsive? */}
          {/* For embed mode, if width is sufficient, we show it. Flex handles this naturally. */}
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