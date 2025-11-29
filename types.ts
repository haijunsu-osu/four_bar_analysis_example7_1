export interface Point {
  x: number;
  y: number;
}

export interface LinkageConfig {
  r1: number; // Ground A*B*
  r2: number; // Crank A*A
  r3: number; // Coupler AB
  r4: number; // Output B*B
  r6: number; // Coupler point distance AC
  beta: number; // Angle of AC relative to AB (degrees)
  theta2: number; // Driver angle (degrees)
}

export interface LinkageSolution {
  Ax: number;
  Ay: number;
  Bx: number;
  By: number;
  Cx: number;
  Cy: number;
  theta3: number; // degrees
  theta4: number; // degrees
  isValid: boolean;
  mode: 'open' | 'crossed';
}

export interface TrajectoryPoint {
  theta2: number;
  theta3: number;
  theta4: number;
  Cx: number;
  Cy: number;
}
