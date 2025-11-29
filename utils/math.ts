import { LinkageConfig, LinkageSolution, Point } from '../types';

export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Solves the four-bar linkage vector loop equations using the intersection of two circles.
 * Circle 1: Centered at A(r2, theta2), radius r3.
 * Circle 2: Centered at B*(r1, 0), radius r4.
 */
export const solveLinkage = (
  config: LinkageConfig,
  assemblyMode: -1 | 1 = 1 // 1 for one branch, -1 for the other
): LinkageSolution => {
  const { r1, r2, r3, r4, r6, beta, theta2 } = config;
  const theta2Rad = toRad(theta2);
  const betaRad = toRad(beta);

  // A* is at (0,0)
  // B* is at (r1, 0)
  const B_star: Point = { x: r1, y: 0 };

  // Calculate A
  const Ax = r2 * Math.cos(theta2Rad);
  const Ay = r2 * Math.sin(theta2Rad);

  // Distance between A and B*
  const d2 = (Ax - B_star.x) ** 2 + (Ay - B_star.y) ** 2;
  const d = Math.sqrt(d2);

  // Check valid assembly (Grashof/geometric limits)
  // Triangle inequality: |r3 - r4| <= d <= r3 + r4
  if (d > r3 + r4 || d < Math.abs(r3 - r4) || d === 0) {
    return {
      Ax, Ay, Bx: NaN, By: NaN, Cx: NaN, Cy: NaN, theta3: NaN, theta4: NaN, isValid: false, mode: assemblyMode === 1 ? 'open' : 'crossed'
    };
  }

  // Circle intersection logic
  const a = (r3 ** 2 - r4 ** 2 + d2) / (2 * d);
  const h = Math.sqrt(Math.max(0, r3 ** 2 - a ** 2));

  // Midpoint P2 between intersections on the line connecting centers
  const x2 = Ax + (a * (B_star.x - Ax)) / d;
  const y2 = Ay + (a * (B_star.y - Ay)) / d;

  // Two solutions for B
  const x3_1 = x2 + (h * (B_star.y - Ay)) / d;
  const y3_1 = y2 - (h * (B_star.x - Ax)) / d;

  const x3_2 = x2 - (h * (B_star.y - Ay)) / d;
  const y3_2 = y2 + (h * (B_star.x - Ax)) / d;

  // Select solution based on assemblyMode
  const Bx = assemblyMode === 1 ? x3_1 : x3_2;
  const By = assemblyMode === 1 ? y3_1 : y3_2;

  // Calculate Theta3 (Angle of AB)
  const theta3Rad = Math.atan2(By - Ay, Bx - Ax);
  const theta3 = toDeg(theta3Rad);

  // Calculate Theta4 (Angle of B*B)
  const theta4Rad = Math.atan2(By - B_star.y, Bx - B_star.x);
  const theta4 = toDeg(theta4Rad);

  // Calculate C
  // Vector AC has length r6 and angle theta3 + beta
  // Note: beta is relative to line AB.
  // Standard convention: if beta is positive, it's counter-clockwise from AB.
  const angleAC = theta3Rad + betaRad;
  const Cx = Ax + r6 * Math.cos(angleAC);
  const Cy = Ay + r6 * Math.sin(angleAC);

  return {
    Ax,
    Ay,
    Bx,
    By,
    Cx,
    Cy,
    theta3,
    theta4,
    isValid: true,
    mode: assemblyMode === 1 ? 'open' : 'crossed',
  };
};

/**
 * Pre-computes the full cycle for plotting.
 */
export const computeTrajectory = (config: LinkageConfig, assemblyMode: -1 | 1) => {
  const data = [];
  // Sample every 2 degrees for smoothness
  for (let t2 = 0; t2 <= 360; t2 += 2) {
    const sol = solveLinkage({ ...config, theta2: t2 }, assemblyMode);
    if (sol.isValid) {
      data.push({
        theta2: t2,
        theta3: sol.theta3,
        theta4: sol.theta4,
        Cx: sol.Cx,
        Cy: sol.Cy,
      });
    }
  }
  return data;
};
