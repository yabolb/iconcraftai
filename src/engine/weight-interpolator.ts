/**
 * Weight Interpolator — Generates intermediate weights for the Thin↔Bold slider.
 * PRD §9.3: Slider from Thin/Elegant to Bold/Solid.
 */

import type { SvgDocument, SvgElement, WeightConfig } from './types.js';

/** Apply a weight value (0=thin, 1=bold) to the document. */
export function interpolateWeight(doc: SvgDocument, config: WeightConfig): SvgDocument {
  const clamped = Math.max(0, Math.min(1, config.value));
  const strokeWidth = config.minStroke + clamped * (config.maxStroke - config.minStroke);
  const elements = doc.elements.map((el) => applyWeight(el, strokeWidth));
  return { ...doc, elements };
}

/** Calculate stroke width for a given weight value. */
export function calculateStrokeForWeight(config: WeightConfig): number {
  const clamped = Math.max(0, Math.min(1, config.value));
  return config.minStroke + clamped * (config.maxStroke - config.minStroke);
}

/** Get weight value (0-1) from a stroke width. */
export function getWeightFromStroke(strokeWidth: number, minStroke: number, maxStroke: number): number {
  if (maxStroke === minStroke) return 0.5;
  return Math.max(0, Math.min(1, (strokeWidth - minStroke) / (maxStroke - minStroke)));
}

function applyWeight(el: SvgElement, strokeWidth: number): SvgElement {
  if (el.type === 'path') {
    const hasStroke = el.attributes.stroke && el.attributes.stroke !== 'none';
    if (hasStroke || el.attributes.strokeWidth !== undefined) {
      return { ...el, attributes: { ...el.attributes, strokeWidth } };
    }
    return el;
  }
  return { ...el, children: el.children.map((child) => applyWeight(child, strokeWidth)) };
}
