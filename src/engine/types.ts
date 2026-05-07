/**
 * IconCraft AI — Core Types
 * Internal representation of SVG elements for the transformation engine.
 */

// ─── Geometry Primitives ───────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── SVG Path Commands ─────────────────────────────────────────

export type PathCommandType =
  | 'M' | 'm'  // moveTo
  | 'L' | 'l'  // lineTo
  | 'H' | 'h'  // horizontal line
  | 'V' | 'v'  // vertical line
  | 'C' | 'c'  // cubic bezier
  | 'S' | 's'  // smooth cubic
  | 'Q' | 'q'  // quadratic bezier
  | 'T' | 't'  // smooth quadratic
  | 'A' | 'a'  // arc
  | 'Z' | 'z'; // close path

export interface PathCommand {
  type: PathCommandType;
  values: number[];
}

// ─── SVG Document Model ────────────────────────────────────────

export interface SvgAttributes {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  opacity?: number;
  transform?: string;
  [key: string]: string | number | undefined;
}

export interface SvgPath {
  type: 'path';
  commands: PathCommand[];
  attributes: SvgAttributes;
}

export interface SvgGroup {
  type: 'group';
  children: SvgElement[];
  attributes: SvgAttributes;
}

export type SvgElement = SvgPath | SvgGroup;

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SvgDocument {
  viewBox: ViewBox;
  width?: number;
  height?: number;
  elements: SvgElement[];
  metadata?: Record<string, string>;
}

// ─── Engine Types ──────────────────────────────────────────────

export interface GridConfig {
  width: number;
  height: number;
}

export interface NormalizationResult {
  document: SvgDocument;
  changes: NormalizationChange[];
}

export interface NormalizationChange {
  type: 'stroke-forced' | 'grid-snapped' | 'junk-removed' | 'viewbox-standardized' | 'shape-converted';
  description: string;
}

export interface TransformResult {
  document: SvgDocument;
  changes: string[];
}

export interface ComplexityReport {
  totalNodes: number;
  totalCommands: number;
  maxDepth: number;
  isComplex: boolean;
  recommendation?: string;
}

export interface WeightConfig {
  /** 0 = thinnest, 1 = boldest */
  value: number;
  minStroke: number;
  maxStroke: number;
}
