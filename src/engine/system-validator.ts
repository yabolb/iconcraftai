/**
 * System Validator — Calculates System Score (0-100%).
 * PRD §6: "Validator: Chequea el System Score"
 * PRD §11: "Material Score: indicador de 0-100% de cumplimiento"
 *
 * Scores an SVG document against a SystemSchema across 5 dimensions:
 * grid, stroke, padding, corners, pixelPerfect.
 */

import type { SvgDocument, SvgElement } from './types.js';
import type { SystemSchema, SystemScore } from '../schemas/schema-types.js';

/** Weights for overall score calculation */
const WEIGHTS = {
  grid: 0.25,
  stroke: 0.25,
  padding: 0.20,
  corners: 0.15,
  pixelPerfect: 0.15,
};

/**
 * Calculate the System Score for a document against a schema.
 */
export function calculateSystemScore(doc: SvgDocument, schema: SystemSchema): SystemScore {
  const grid = scoreGrid(doc, schema);
  const stroke = scoreStroke(doc, schema);
  const padding = scorePadding(doc, schema);
  const corners = scoreCorners(doc, schema);
  const pixelPerfect = scorePixelPerfect(doc, schema);

  const overall = Math.round(
    grid * WEIGHTS.grid +
    stroke * WEIGHTS.stroke +
    padding * WEIGHTS.padding +
    corners * WEIGHTS.corners +
    pixelPerfect * WEIGHTS.pixelPerfect,
  );

  return { grid, stroke, padding, corners, pixelPerfect, overall };
}

/**
 * Check if a document passes the minimum score threshold.
 */
export function passesConformance(doc: SvgDocument, schema: SystemSchema, threshold = 95): boolean {
  const score = calculateSystemScore(doc, schema);
  return score.overall >= threshold;
}

// ─── Dimension Scorers ─────────────────────────────────────────

function scoreGrid(doc: SvgDocument, schema: SystemSchema): number {
  const vw = doc.viewBox.width;
  const vh = doc.viewBox.height;
  const tw = schema.grid.width;
  const th = schema.grid.height;

  if (vw === tw && vh === th) return 100;

  // Partial score based on how close
  const diffW = Math.abs(vw - tw) / tw;
  const diffH = Math.abs(vh - th) / th;
  const avgDiff = (diffW + diffH) / 2;

  return Math.max(0, Math.round(100 * (1 - avgDiff)));
}

function scoreStroke(doc: SvgDocument, schema: SystemSchema): number {
  const widths = collectStrokeWidths(doc.elements);
  if (widths.length === 0) return 100; // No strokes = nothing to penalize

  let totalScore = 0;
  for (const w of widths) {
    if (w >= schema.stroke.min && w <= schema.stroke.max) {
      // Within range — score based on closeness to default
      const diff = Math.abs(w - schema.stroke.default);
      const range = schema.stroke.max - schema.stroke.min;
      const score = range > 0 ? 100 * (1 - diff / range) : 100;
      totalScore += Math.max(50, score); // At least 50 if within range
    } else {
      // Out of range
      const dist = w < schema.stroke.min
        ? schema.stroke.min - w
        : w - schema.stroke.max;
      totalScore += Math.max(0, 50 - dist * 20);
    }
  }

  return Math.round(totalScore / widths.length);
}

function scorePadding(doc: SvgDocument, schema: SystemSchema): number {
  const bounds = calculateBounds(doc.elements);
  if (!bounds) return 100;

  const p = schema.padding.safezone;
  const vw = doc.viewBox.width;
  const vh = doc.viewBox.height;

  const left = bounds.minX;
  const top = bounds.minY;
  const right = vw - bounds.maxX;
  const bottom = vh - bounds.maxY;

  // Score each side
  const sides = [left, top, right, bottom];
  let totalScore = 0;

  for (const side of sides) {
    if (side >= p) {
      totalScore += 100;
    } else if (side >= 0) {
      totalScore += Math.round((side / p) * 100);
    } else {
      totalScore += 0; // Content overflows viewBox
    }
  }

  return Math.round(totalScore / 4);
}

function scoreCorners(_doc: SvgDocument, _schema: SystemSchema): number {
  // Corner style scoring requires deeper path analysis.
  // For now, return 100 if we've already applied corner-radius transform.
  // Full implementation will analyze path commands for Q/C vs L segments.
  return 100;
}

function scorePixelPerfect(doc: SvgDocument, schema: SystemSchema): number {
  if (!schema.pixelPerfect) return 100; // System doesn't require it

  const allValues = collectAllCoordinates(doc.elements);
  if (allValues.length === 0) return 100;

  let integerCount = 0;
  for (const v of allValues) {
    if (Number.isInteger(v)) integerCount++;
  }

  return Math.round((integerCount / allValues.length) * 100);
}

// ─── Helpers ───────────────────────────────────────────────────

function collectStrokeWidths(elements: SvgElement[]): number[] {
  const widths: number[] = [];
  for (const el of elements) {
    if (el.type === 'path') {
      if (el.attributes.strokeWidth !== undefined) {
        widths.push(el.attributes.strokeWidth);
      }
    } else {
      widths.push(...collectStrokeWidths(el.children));
    }
  }
  return widths;
}

function collectAllCoordinates(elements: SvgElement[]): number[] {
  const values: number[] = [];
  for (const el of elements) {
    if (el.type === 'path') {
      for (const cmd of el.commands) {
        values.push(...cmd.values);
      }
    } else {
      values.push(...collectAllCoordinates(el.children));
    }
  }
  return values;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function calculateBounds(elements: SvgElement[]): Bounds | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPoints = false;

  for (const el of elements) {
    if (el.type === 'path') {
      let cx = 0, cy = 0;
      for (const cmd of el.commands) {
        const t = cmd.type.toUpperCase();
        if (t === 'M' || t === 'L' || t === 'T') {
          cx = cmd.values[0] ?? cx; cy = cmd.values[1] ?? cy;
        } else if (t === 'H') {
          cx = cmd.values[0] ?? cx;
        } else if (t === 'V') {
          cy = cmd.values[0] ?? cy;
        } else if (t === 'C') {
          cx = cmd.values[4] ?? cx; cy = cmd.values[5] ?? cy;
        } else if (t === 'Q' || t === 'S') {
          cx = cmd.values[2] ?? cx; cy = cmd.values[3] ?? cy;
        } else if (t === 'A') {
          cx = cmd.values[5] ?? cx; cy = cmd.values[6] ?? cy;
        } else {
          continue;
        }
        hasPoints = true;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
      }
    } else {
      const childBounds = calculateBounds(el.children);
      if (childBounds) {
        hasPoints = true;
        minX = Math.min(minX, childBounds.minX);
        minY = Math.min(minY, childBounds.minY);
        maxX = Math.max(maxX, childBounds.maxX);
        maxY = Math.max(maxY, childBounds.maxY);
      }
    }
  }

  return hasPoints ? { minX, minY, maxX, maxY } : null;
}
