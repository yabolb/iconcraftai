import { describe, it, expect } from 'vitest';
import { transformStrokes, getStrokeWidths, hasUniformStrokes } from '@engine/stroke-transformer';
import { parseSvg } from '@engine/svg-parser';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 12 L22 12" stroke="black" stroke-width="3"/>
  <path d="M12 2 L12 22" stroke="black" stroke-width="1"/>
</svg>`;

describe('Stroke Transformer', () => {
  it('transforms all strokes to target width', () => {
    const doc = parseSvg(SVG);
    const result = transformStrokes(doc, { targetWidth: 2 });
    for (const el of result.elements) {
      if (el.type === 'path') expect(el.attributes.strokeWidth).toBe(2);
    }
  });

  it('clamps to max width', () => {
    const doc = parseSvg(SVG);
    const result = transformStrokes(doc, { targetWidth: 5, maxWidth: 3 });
    for (const el of result.elements) {
      if (el.type === 'path') expect(el.attributes.strokeWidth).toBe(3);
    }
  });

  it('clamps to min width', () => {
    const doc = parseSvg(SVG);
    const result = transformStrokes(doc, { targetWidth: 0.5, minWidth: 1 });
    for (const el of result.elements) {
      if (el.type === 'path') expect(el.attributes.strokeWidth).toBe(1);
    }
  });

  it('getStrokeWidths returns unique widths', () => {
    const doc = parseSvg(SVG);
    const widths = getStrokeWidths(doc);
    expect(widths).toContain(3);
    expect(widths).toContain(1);
    expect(widths).toHaveLength(2);
  });

  it('hasUniformStrokes detects non-uniform', () => {
    const doc = parseSvg(SVG);
    expect(hasUniformStrokes(doc)).toBe(false);
  });

  it('hasUniformStrokes detects uniform after transform', () => {
    const doc = parseSvg(SVG);
    const result = transformStrokes(doc, { targetWidth: 2 });
    expect(hasUniformStrokes(result)).toBe(true);
  });
});
