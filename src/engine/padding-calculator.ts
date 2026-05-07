/**
 * Padding Calculator — Applies safe zones per design system.
 *
 * Each system has a required padding (safe zone) around the icon content.
 * This module calculates the padding and rescales the content to fit within it.
 */

import type { SvgDocument, SvgElement, PathCommand, BoundingBox } from './types.js';

export interface PaddingConfig {
  /** Padding in pixels on each side */
  padding: number;
}

/**
 * Apply padding (safe zone) to the document.
 * Scales content inward to respect the padding area.
 */
export function applyPadding(doc: SvgDocument, config: PaddingConfig): SvgDocument {
  if (config.padding === 0) return doc;

  const p = config.padding;
  const vw = doc.viewBox.width;
  const vh = doc.viewBox.height;

  // Content area after padding
  const contentWidth = vw - 2 * p;
  const contentHeight = vh - 2 * p;

  if (contentWidth <= 0 || contentHeight <= 0) {
    throw new Error(`Padding ${p}px is too large for viewBox ${vw}×${vh}`);
  }

  // Get current bounds of all elements
  const bounds = calculateBounds(doc.elements);
  if (!bounds) return doc;

  // Scale to fit within content area
  const scaleX = contentWidth / bounds.width;
  const scaleY = contentHeight / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  // Center within content area
  const scaledW = bounds.width * scale;
  const scaledH = bounds.height * scale;
  const offsetX = p + (contentWidth - scaledW) / 2 - bounds.x * scale;
  const offsetY = p + (contentHeight - scaledH) / 2 - bounds.y * scale;

  const elements = doc.elements.map((el) =>
    transformElement(el, scale, scale, offsetX, offsetY),
  );

  return { ...doc, elements };
}

/**
 * Calculate the content bounds relative to the viewBox.
 */
export function getContentBounds(doc: SvgDocument): BoundingBox | null {
  return calculateBounds(doc.elements);
}

/**
 * Check if the content respects the required padding.
 */
export function validatePadding(doc: SvgDocument, requiredPadding: number): boolean {
  const bounds = calculateBounds(doc.elements);
  if (!bounds) return true;

  return (
    bounds.x >= requiredPadding &&
    bounds.y >= requiredPadding &&
    bounds.x + bounds.width <= doc.viewBox.width - requiredPadding &&
    bounds.y + bounds.height <= doc.viewBox.height - requiredPadding
  );
}

// ─── Bounding Box Calculation ──────────────────────────────────

function calculateBounds(elements: SvgElement[]): BoundingBox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPoints = false;

  for (const el of elements) {
    const points = getElementPoints(el);
    for (const p of points) {
      hasPoints = true;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  if (!hasPoints) return null;

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getElementPoints(el: SvgElement): Array<{ x: number; y: number }> {
  if (el.type === 'path') {
    return getPathPoints(el.commands);
  }
  return el.children.flatMap(getElementPoints);
}

function getPathPoints(commands: PathCommand[]): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
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
      // Include control points for accurate bounds
      points.push({ x: cmd.values[0] ?? 0, y: cmd.values[1] ?? 0 });
      points.push({ x: cmd.values[2] ?? 0, y: cmd.values[3] ?? 0 });
      cx = cmd.values[4] ?? cx;
      cy = cmd.values[5] ?? cy;
      points.push({ x: cx, y: cy });
    } else if (t === 'Q' || t === 'S') {
      points.push({ x: cmd.values[0] ?? 0, y: cmd.values[1] ?? 0 });
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

// ─── Transform Helper ──────────────────────────────────────────

function transformElement(
  el: SvgElement,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
): SvgElement {
  if (el.type === 'path') {
    const commands = el.commands.map((cmd) =>
      transformCommand(cmd, scaleX, scaleY, offsetX, offsetY),
    );
    return { ...el, commands };
  }

  return {
    ...el,
    children: el.children.map((child) =>
      transformElement(child, scaleX, scaleY, offsetX, offsetY),
    ),
  };
}

function transformCommand(
  cmd: PathCommand,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
): PathCommand {
  const t = cmd.type.toUpperCase();

  if (t === 'Z') return cmd;

  // Relative commands don't need offset
  const isRelative = cmd.type !== cmd.type.toUpperCase();
  const ox = isRelative ? 0 : offsetX;
  const oy = isRelative ? 0 : offsetY;

  if (t === 'H') {
    return { ...cmd, values: cmd.values.map((v) => v * scaleX + ox) };
  }
  if (t === 'V') {
    return { ...cmd, values: cmd.values.map((v) => v * scaleY + oy) };
  }

  // Alternate x, y
  const values = cmd.values.map((v, i) => {
    if (i % 2 === 0) return v * scaleX + ox;
    return v * scaleY + oy;
  });

  return { ...cmd, values };
}
