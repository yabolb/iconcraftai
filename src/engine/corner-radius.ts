/**
 * Corner Radius Engine — Modifies corner radii based on design system style.
 *
 * Material: rounded corners (smooth)
 * Fluent: geometric, flat (minimal radius)
 * iOS: continuous curves (superellipse-style)
 *
 * Works by detecting sharp corners in paths and replacing them with
 * arc or cubic bezier segments.
 */

import type { SvgDocument, SvgElement, PathCommand, Point } from './types.js';

export type CornerStyle = 'sharp' | 'rounded' | 'continuous';

export interface CornerConfig {
  /** Corner rounding radius in px */
  radius: number;
  /** Style of rounding */
  style: CornerStyle;
}

/**
 * Apply corner rounding to all paths in the document.
 */
export function applyCornerRadius(doc: SvgDocument, config: CornerConfig): SvgDocument {
  if (config.radius === 0 || config.style === 'sharp') return doc;

  const elements = doc.elements.map((el) => roundElement(el, config));
  return { ...doc, elements };
}

/**
 * Detect corners (direction changes) in a path and return their angles.
 */
export function detectCorners(commands: PathCommand[]): Point[] {
  const corners: Point[] = [];
  const points = extractPoints(commands);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    const angle = getAngle(prev, curr, next);
    // A corner is a point where the direction changes significantly (< 170°)
    if (angle < 170) {
      corners.push(curr);
    }
  }

  return corners;
}

function roundElement(el: SvgElement, config: CornerConfig): SvgElement {
  if (el.type === 'path') {
    const commands = roundPathCorners(el.commands, config);
    return { ...el, commands };
  }

  return {
    ...el,
    children: el.children.map((child) => roundElement(child, config)),
  };
}

/**
 * Round corners in a path's commands.
 */
function roundPathCorners(commands: PathCommand[], config: CornerConfig): PathCommand[] {
  const points = extractLineSegmentPoints(commands);

  // Need at least 3 points to have a corner
  if (points.length < 3) return commands;

  const result: PathCommand[] = [];
  const r = config.radius;

  // Start with move to first point (adjusted)
  const firstCorner = points.length > 2;
  if (firstCorner) {
    const p0 = points[0]!;
    const p1 = points[1]!;
    const offset = offsetPoint(p0, p1, r);
    result.push({ type: 'M', values: [offset.x, offset.y] });
  } else {
    result.push(commands[0]!);
  }

  // Process each corner
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    const angle = getAngle(prev, curr, next);

    if (angle < 170) {
      // This is a corner — round it
      const beforeCorner = offsetPoint(curr, prev, r);
      const afterCorner = offsetPoint(curr, next, r);

      // Line to the point before the corner
      result.push({ type: 'L', values: [beforeCorner.x, beforeCorner.y] });

      // Add the corner curve
      if (config.style === 'continuous') {
        // Superellipse-style: use cubic bezier for smoother continuity
        result.push({
          type: 'C',
          values: [curr.x, curr.y, curr.x, curr.y, afterCorner.x, afterCorner.y],
        });
      } else {
        // Standard rounded: use quadratic bezier
        result.push({
          type: 'Q',
          values: [curr.x, curr.y, afterCorner.x, afterCorner.y],
        });
      }
    } else {
      // Not a corner — straight line
      result.push({ type: 'L', values: [curr.x, curr.y] });
    }
  }

  // Line to last point
  const last = points[points.length - 1]!;
  result.push({ type: 'L', values: [last.x, last.y] });

  // Close path if original was closed
  if (commands.some((c) => c.type === 'Z' || c.type === 'z')) {
    result.push({ type: 'Z', values: [] });
  }

  return result;
}

// ─── Geometry Helpers ──────────────────────────────────────────

function extractPoints(commands: PathCommand[]): Point[] {
  const points: Point[] = [];
  let cx = 0, cy = 0;

  for (const cmd of commands) {
    const t = cmd.type.toUpperCase();
    if (t === 'M' || t === 'L' || t === 'T') {
      cx = cmd.values[0] ?? cx;
      cy = cmd.values[1] ?? cy;
      points.push({ x: cx, y: cy });
    } else if (t === 'H') {
      cx = cmd.values[0] ?? cx;
      points.push({ x: cx, y: cy });
    } else if (t === 'V') {
      cy = cmd.values[0] ?? cy;
      points.push({ x: cx, y: cy });
    } else if (t === 'C') {
      cx = cmd.values[4] ?? cx;
      cy = cmd.values[5] ?? cy;
      points.push({ x: cx, y: cy });
    } else if (t === 'Q' || t === 'S') {
      cx = cmd.values[2] ?? cx;
      cy = cmd.values[3] ?? cy;
      points.push({ x: cx, y: cy });
    } else if (t === 'A') {
      cx = cmd.values[5] ?? cx;
      cy = cmd.values[6] ?? cy;
      points.push({ x: cx, y: cy });
    }
  }

  return points;
}

function extractLineSegmentPoints(commands: PathCommand[]): Point[] {
  return extractPoints(commands);
}

function getAngle(a: Point, b: Point, c: Point): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 === 0 || mag2 === 0) return 180;

  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function offsetPoint(from: Point, toward: Point, distance: number): Point {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const mag = Math.sqrt(dx * dx + dy * dy);

  if (mag === 0) return from;

  const ratio = Math.min(distance, mag / 2) / mag;
  return {
    x: from.x + dx * ratio,
    y: from.y + dy * ratio,
  };
}
