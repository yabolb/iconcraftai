/**
 * Stroke Transformer — Adjusts stroke width according to system rules.
 *
 * Material: 2px | Fluent: 1.5px | iOS: variable by weight
 * Maintains visual proportions without distorting the shape.
 */

import type { SvgDocument, SvgElement } from './types.js';

export interface StrokeConfig {
  /** Target stroke width */
  targetWidth: number;
  /** Minimum allowed stroke width */
  minWidth?: number;
  /** Maximum allowed stroke width */
  maxWidth?: number;
}

/**
 * Transform all stroke widths in the document.
 */
export function transformStrokes(doc: SvgDocument, config: StrokeConfig): SvgDocument {
  const target = clampStroke(config.targetWidth, config);
  const elements = doc.elements.map((el) => transformElementStroke(el, target));
  return { ...doc, elements };
}

/**
 * Get the current stroke widths in a document.
 */
export function getStrokeWidths(doc: SvgDocument): number[] {
  const widths: number[] = [];
  collectStrokeWidths(doc.elements, widths);
  return [...new Set(widths)];
}

/**
 * Check if all strokes are uniform (same width).
 */
export function hasUniformStrokes(doc: SvgDocument): boolean {
  const widths = getStrokeWidths(doc);
  return widths.length <= 1;
}

function transformElementStroke(el: SvgElement, targetWidth: number): SvgElement {
  if (el.type === 'path') {
    const hasStroke = el.attributes.stroke && el.attributes.stroke !== 'none';
    if (hasStroke || el.attributes.strokeWidth !== undefined) {
      return {
        ...el,
        attributes: { ...el.attributes, strokeWidth: targetWidth },
      };
    }
    return el;
  }

  return {
    ...el,
    children: el.children.map((child) => transformElementStroke(child, targetWidth)),
  };
}

function collectStrokeWidths(elements: SvgElement[], widths: number[]): void {
  for (const el of elements) {
    if (el.type === 'path') {
      if (el.attributes.strokeWidth !== undefined) {
        widths.push(el.attributes.strokeWidth);
      }
    } else {
      collectStrokeWidths(el.children, widths);
    }
  }
}

function clampStroke(width: number, config: StrokeConfig): number {
  let result = width;
  if (config.minWidth !== undefined) result = Math.max(result, config.minWidth);
  if (config.maxWidth !== undefined) result = Math.min(result, config.maxWidth);
  return result;
}
