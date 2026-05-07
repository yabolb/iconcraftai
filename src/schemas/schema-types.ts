/**
 * Schema Types — Shared interface for all Design System schemas.
 * Every schema (Material, iOS, Fluent, Custom) implements this interface.
 */

export type CornerStyle = 'sharp' | 'rounded' | 'continuous';
export type Alignment = 'geometric-center' | 'optical-center';

export interface GridSpec {
  width: number;
  height: number;
}

export interface StrokeSpec {
  default: number;
  min: number;
  max: number;
}

export interface CornerSpec {
  style: CornerStyle;
  minRadius: number;
  maxRadius: number;
}

export interface PaddingSpec {
  /** Padding in px on each side */
  safezone: number;
}

export interface SystemSchema {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Grid dimensions */
  grid: GridSpec;
  /** Stroke rules */
  stroke: StrokeSpec;
  /** Corner rounding rules */
  corner: CornerSpec;
  /** Safe zone padding */
  padding: PaddingSpec;
  /** Alignment strategy */
  alignment: Alignment;
  /** Whether coordinates must be integers */
  pixelPerfect: boolean;
}

/** Score breakdown per dimension */
export interface SystemScore {
  grid: number;       // 0-100
  stroke: number;     // 0-100
  padding: number;    // 0-100
  corners: number;    // 0-100
  pixelPerfect: number; // 0-100
  overall: number;    // 0-100 (weighted average)
}

/** Custom schema input from user (all fields optional except id/name) */
export interface CustomSchemaInput {
  id?: string;
  name?: string;
  gridWidth?: number;
  gridHeight?: number;
  strokeDefault?: number;
  strokeMin?: number;
  strokeMax?: number;
  cornerStyle?: CornerStyle;
  cornerMinRadius?: number;
  cornerMaxRadius?: number;
  safezone?: number;
  alignment?: Alignment;
  pixelPerfect?: boolean;
}
