import React, { useMemo, useState, useRef, useEffect } from 'react';
import { LinkageConfig, LinkageSolution, TrajectoryPoint } from '../types';

interface LinkageCanvasProps {
  config: LinkageConfig;
  solution: LinkageSolution;
  trajectory: TrajectoryPoint[];
}

const LinkageCanvas: React.FC<LinkageCanvasProps> = ({ config, solution, trajectory }) => {
  const { r1 } = config;
  const { Ax, Ay, Bx, By, Cx, Cy, isValid } = solution;
  const containerRef = useRef<HTMLDivElement>(null);

  // View state: center x, center y, and zoom level (scale)
  // Scale: pixels per unit.
  // We'll manage viewBox directly: [minX, minY, width, height]
  // Initial view: Centered around (1, 1) with width ~8 units
  const [viewBox, setViewBox] = useState({ x: -2, y: -2, w: 8, h: 8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Coordinate transform: Math (y up) to SVG (y down)
  // We will perform the flip in the SVG rendering by negating Y values.
  // So a point (x, y) becomes (x, -y) in SVG space.
  // The viewBox needs to accommodate this.
  
  // Helper to map logic coordinates to SVG string
  const toSvg = (x: number, y: number) => ({
    x: x, 
    y: -y, 
  });

  const A_star = toSvg(0, 0);
  const B_star = toSvg(r1, 0);
  const A = toSvg(Ax, Ay);
  const B = toSvg(Bx, By);
  const C = toSvg(Cx, Cy);

  // Visual constants (in world units)
  // Adjusted for better visibility at 5x zoom
  const STROKE_THICK = 0.08;
  const STROKE_MED = 0.06;
  const STROKE_THIN = 0.03;
  const JOINT_RADIUS_FIXED = 0.12;
  const JOINT_RADIUS_MOVING = 0.1;
  const JOINT_RADIUS_TRACE = 0.08;
  const TEXT_SIZE = 0.25;
  const LABEL_OFFSET = 0.3;

  // Generate path string for trajectory
  const trajectoryPath = useMemo(() => {
    if (trajectory.length === 0) return '';
    return trajectory.map((pt, i) => {
      const coord = toSvg(pt.Cx, pt.Cy);
      return `${i === 0 ? 'M' : 'L'} ${coord.x.toFixed(3)} ${coord.y.toFixed(3)}`;
    }).join(' ');
  }, [trajectory]);

  // --- Interaction Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 : -1;
    
    // Simple zoom centered on current view
    // Calculate new width/height
    let newW = viewBox.w * (direction > 0 ? zoomFactor : 1 / zoomFactor);
    let newH = viewBox.h * (direction > 0 ? zoomFactor : 1 / zoomFactor);

    // Clamp zoom
    if (newW < 1) { newW = 1; newH = 1; }
    if (newW > 50) { newW = 50; newH = 50; }

    // Adjust x/y to keep center stable
    const dx = (viewBox.w - newW) / 2;
    const dy = (viewBox.h - newH) / 2;

    setViewBox(prev => ({
      x: prev.x + dx,
      y: prev.y + dy,
      w: newW,
      h: newH
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate delta in pixels
    const dxPx = e.clientX - dragStart.x;
    const dyPx = e.clientY - dragStart.y;
    
    // Convert to world units
    // width pixels / viewbox width = pixels per unit
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      const scale = width / viewBox.w;
      
      const dx = -dxPx / scale;
      const dy = -dyPx / scale; // Screen y down matches ViewBox y down? 
      // ViewBox y is min-y. Increasing min-y moves view down.
      // Dragging mouse down (dyPx > 0) should move view UP (decrease min-y) 
      // or move camera up (decrease min-y) to see higher elements?
      // Standard drag-pan: Mouse moves right, we want to see left content -> shift viewBox left (decrease x)
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
     setViewBox({ x: -2, y: -4, w: 8, h: 8 }); // Y starts at -4 to show positive Y area (since SVG Y is flipped)
  };

  // On mount, set initial view that makes sense (Math (0,0) is center, Y up)
  // SVG (0,0) is top-left.
  // We render A* at (0,0) svg.
  // We want A* to be visible.
  // ViewBox: minX, minY, w, h
  // If minX=-4, w=8, X range is [-4, 4].
  // If minY=-4, h=8, Y range is [-4, 4].
  // Rendered A* is (0,0). So it is centered.
  useEffect(() => {
      // Set initial view centered on the mechanism roughly
      // Mechanism is mostly in Quadrant 1 (x>0, y>0 math) -> (x>0, y<0 svg)
      // So let's center around x=2, y=-2 (svg)
      setViewBox({ x: -2, y: -6, w: 8, h: 8 });
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
       <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-md border border-slate-200 shadow-sm">
           <p className="text-xs font-mono text-slate-500 mb-1">Grid: 0.1 units</p>
           <p className="text-xs text-slate-400">Scroll to Zoom • Drag to Pan</p>
         </div>
       </div>
       
       <button 
         onClick={resetView}
         className="absolute bottom-4 right-4 z-10 bg-white shadow-sm border border-slate-200 p-2 rounded-full hover:bg-slate-50 text-slate-500"
         title="Reset View"
       >
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
       </button>

      {!isValid && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-red-50/80 backdrop-blur px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold shadow-sm">
                Mechanism assembly broken
            </div>
        </div>
      )}

      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Major Grid (1.0) */}
          <pattern id="grid-major" width="1" height="1" patternUnits="userSpaceOnUse">
             <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e2e8f0" strokeWidth={0.01}/>
          </pattern>
          {/* Minor Grid (0.1) */}
          <pattern id="grid-minor" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
             <path d="M 0.1 0 L 0 0 0 0.1" fill="none" stroke="#f1f5f9" strokeWidth={0.005}/>
          </pattern>
        </defs>

        {/* Grids - Render minor first so it's behind */}
        <rect x={viewBox.x - 10} y={viewBox.y - 10} width={viewBox.w + 20} height={viewBox.h + 20} fill="url(#grid-minor)" />
        <rect x={viewBox.x - 10} y={viewBox.y - 10} width={viewBox.w + 20} height={viewBox.h + 20} fill="url(#grid-major)" />
        
        {/* Origin Marker */}
        <line x1="-0.2" y1="0" x2="0.2" y2="0" stroke="#cbd5e1" strokeWidth={STROKE_THIN} />
        <line x1="0" y1="-0.2" x2="0" y2="0.2" stroke="#cbd5e1" strokeWidth={STROKE_THIN} />

        {/* Ground Line */}
        <line 
          x1={A_star.x} y1={A_star.y} 
          x2={B_star.x} y2={B_star.y} 
          stroke="#94a3b8" 
          strokeWidth={STROKE_THIN} 
          strokeLinecap="round" 
          strokeDasharray={`${STROKE_THICK},${STROKE_THICK}`} 
        />

        {/* Trajectory */}
        <path 
          d={trajectoryPath} 
          fill="none" 
          stroke="#db2777" 
          strokeWidth={0.12} 
          strokeOpacity="0.8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Link 2 (Crank) */}
        <line 
          x1={A_star.x} y1={A_star.y} 
          x2={A.x} y2={A.y} 
          stroke="#3b82f6" 
          strokeWidth={STROKE_THICK} 
          strokeLinecap="round" 
        />

        {/* Link 3 (Coupler) including triangle to C */}
        <path 
          d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`} 
          fill="rgba(168, 85, 247, 0.1)" 
          stroke="none" 
        />
        <line 
          x1={A.x} y1={A.y} 
          x2={B.x} y2={B.y} 
          stroke="#a855f7" 
          strokeWidth={STROKE_THICK} 
          strokeLinecap="round" 
        />
        <line 
          x1={A.x} y1={A.y} 
          x2={C.x} y2={C.y} 
          stroke="#a855f7" 
          strokeWidth={STROKE_MED} 
          strokeDasharray={`${STROKE_MED},${STROKE_MED}`} 
        />
        <line 
          x1={B.x} y1={B.y} 
          x2={C.x} y2={C.y} 
          stroke="#a855f7" 
          strokeWidth={STROKE_MED} 
          strokeDasharray={`${STROKE_MED},${STROKE_MED}`} 
        />
        
        {/* Link 4 (Output) */}
        <line 
          x1={B_star.x} y1={B_star.y} 
          x2={B.x} y2={B.y} 
          stroke="#10b981" 
          strokeWidth={STROKE_THICK} 
          strokeLinecap="round" 
        />

        {/* Joints */}
        <circle cx={A_star.x} cy={A_star.y} r={JOINT_RADIUS_FIXED} fill="#1e293b" /> 
        <circle cx={B_star.x} cy={B_star.y} r={JOINT_RADIUS_FIXED} fill="#1e293b" /> 
        <circle cx={A.x} cy={A.y} r={JOINT_RADIUS_MOVING} fill="white" stroke="#3b82f6" strokeWidth={STROKE_THIN} /> 
        <circle cx={B.x} cy={B.y} r={JOINT_RADIUS_MOVING} fill="white" stroke="#10b981" strokeWidth={STROKE_THIN} /> 
        <circle cx={C.x} cy={C.y} r={JOINT_RADIUS_TRACE} fill="#ec4899" stroke="white" strokeWidth={STROKE_THIN / 2} /> 

        {/* Labels - scaling factor applied to keep them readable but positioned correctly */}
        <text 
          x={A_star.x - LABEL_OFFSET} y={A_star.y + LABEL_OFFSET} 
          fill="#64748b" fontSize={TEXT_SIZE} fontFamily="sans-serif"
          className="select-none"
        >A*</text>
        <text 
          x={B_star.x + LABEL_OFFSET/2} y={B_star.y + LABEL_OFFSET} 
          fill="#64748b" fontSize={TEXT_SIZE} fontFamily="sans-serif"
          className="select-none"
        >B*</text>
        <text 
          x={A.x - LABEL_OFFSET/2} y={A.y - LABEL_OFFSET/2} 
          fill="#2563eb" fontSize={TEXT_SIZE} fontWeight="bold" fontFamily="sans-serif"
          className="select-none"
        >A</text>
        <text 
          x={B.x + LABEL_OFFSET/2} y={B.y - LABEL_OFFSET/2} 
          fill="#059669" fontSize={TEXT_SIZE} fontWeight="bold" fontFamily="sans-serif"
          className="select-none"
        >B</text>
        <text 
          x={C.x + LABEL_OFFSET/2} y={C.y} 
          fill="#db2777" fontSize={TEXT_SIZE} fontWeight="bold" fontFamily="sans-serif"
          className="select-none"
        >C</text>
      </svg>
    </div>
  );
};

export default LinkageCanvas;