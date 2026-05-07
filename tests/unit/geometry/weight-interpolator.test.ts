import { describe, it, expect } from 'vitest';
import { interpolateWeight, calculateStrokeForWeight, getWeightFromStroke } from '@engine/weight-interpolator';
import { parseSvg } from '@engine/svg-parser';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 12 L22 12" stroke="black" stroke-width="2"/>
</svg>`;

describe('Weight Interpolator', () => {
  it('weight=0 gives minStroke', () => {
    expect(calculateStrokeForWeight({ value: 0, minStroke: 1, maxStroke: 4 })).toBe(1);
  });

  it('weight=1 gives maxStroke', () => {
    expect(calculateStrokeForWeight({ value: 1, minStroke: 1, maxStroke: 4 })).toBe(4);
  });

  it('weight=0.5 gives midpoint', () => {
    expect(calculateStrokeForWeight({ value: 0.5, minStroke: 1, maxStroke: 3 })).toBe(2);
  });

  it('clamps below 0', () => {
    expect(calculateStrokeForWeight({ value: -1, minStroke: 1, maxStroke: 4 })).toBe(1);
  });

  it('clamps above 1', () => {
    expect(calculateStrokeForWeight({ value: 2, minStroke: 1, maxStroke: 4 })).toBe(4);
  });

  it('applies weight to document', () => {
    const doc = parseSvg(SVG);
    const result = interpolateWeight(doc, { value: 0, minStroke: 1, maxStroke: 4 });
    const path = result.elements[0]!;
    if (path.type === 'path') {
      expect(path.attributes.strokeWidth).toBe(1);
    }
  });

  it('getWeightFromStroke inverts correctly', () => {
    expect(getWeightFromStroke(1, 1, 4)).toBe(0);
    expect(getWeightFromStroke(4, 1, 4)).toBe(1);
    expect(getWeightFromStroke(2.5, 1, 4)).toBe(0.5);
  });

  it('handles equal min/max', () => {
    expect(getWeightFromStroke(2, 2, 2)).toBe(0.5);
  });
});
