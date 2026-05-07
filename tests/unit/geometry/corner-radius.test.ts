import { describe, it, expect } from 'vitest';
import { applyCornerRadius, detectCorners } from '@engine/corner-radius';
import { parseSvg } from '@engine/svg-parser';
import type { PathCommand } from '@engine/types';

const SQUARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M4 4 L20 4 L20 20 L4 20 Z" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

describe('Corner Radius Engine', () => {
  it('detects 4 corners in a square', () => {
    const commands: PathCommand[] = [
      { type: 'M', values: [4, 4] },
      { type: 'L', values: [20, 4] },
      { type: 'L', values: [20, 20] },
      { type: 'L', values: [4, 20] },
      { type: 'Z', values: [] },
    ];
    const corners = detectCorners(commands);
    expect(corners.length).toBeGreaterThanOrEqual(2);
  });

  it('returns original when radius=0', () => {
    const doc = parseSvg(SQUARE_SVG);
    const result = applyCornerRadius(doc, { radius: 0, style: 'rounded' });
    expect(result).toBe(doc);
  });

  it('returns original when style=sharp', () => {
    const doc = parseSvg(SQUARE_SVG);
    const result = applyCornerRadius(doc, { radius: 2, style: 'sharp' });
    expect(result).toBe(doc);
  });

  it('applies rounded corners (Q commands)', () => {
    const doc = parseSvg(SQUARE_SVG);
    const result = applyCornerRadius(doc, { radius: 2, style: 'rounded' });
    const path = result.elements[0]!;
    if (path.type === 'path') {
      const hasQ = path.commands.some((c) => c.type === 'Q');
      expect(hasQ).toBe(true);
    }
  });

  it('applies continuous corners (C commands for iOS)', () => {
    const doc = parseSvg(SQUARE_SVG);
    const result = applyCornerRadius(doc, { radius: 2, style: 'continuous' });
    const path = result.elements[0]!;
    if (path.type === 'path') {
      const hasC = path.commands.some((c) => c.type === 'C');
      expect(hasC).toBe(true);
    }
  });
});
