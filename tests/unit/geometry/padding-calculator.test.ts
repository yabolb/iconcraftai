import { describe, it, expect } from 'vitest';
import { applyPadding, getContentBounds, validatePadding } from '@engine/padding-calculator';
import { parseSvg } from '@engine/svg-parser';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M0 0 L24 0 L24 24 L0 24 Z" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

const PADDED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M4 4 L20 4 L20 20 L4 20 Z" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

describe('Padding Calculator', () => {
  it('applies 2px padding', () => {
    const doc = parseSvg(SVG);
    const result = applyPadding(doc, { padding: 2 });
    const bounds = getContentBounds(result);
    expect(bounds).not.toBeNull();
    if (bounds) {
      expect(bounds.x).toBeGreaterThanOrEqual(2);
      expect(bounds.y).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns same doc when padding=0', () => {
    const doc = parseSvg(SVG);
    const result = applyPadding(doc, { padding: 0 });
    expect(result).toBe(doc);
  });

  it('throws when padding is too large', () => {
    const doc = parseSvg(SVG);
    expect(() => applyPadding(doc, { padding: 13 })).toThrow('too large');
  });

  it('validates padding correctly — no padding present', () => {
    const doc = parseSvg(SVG);
    expect(validatePadding(doc, 2)).toBe(false);
  });

  it('validates padding correctly — padding present', () => {
    const doc = parseSvg(PADDED_SVG);
    expect(validatePadding(doc, 2)).toBe(true);
  });

  it('calculates content bounds', () => {
    const doc = parseSvg(PADDED_SVG);
    const bounds = getContentBounds(doc);
    expect(bounds).toEqual({ x: 4, y: 4, width: 16, height: 16 });
  });
});
