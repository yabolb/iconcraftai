import { describe, it, expect } from 'vitest';
import { remapToGrid, pixelSnap } from '@engine/grid-mapper';
import { parseSvg } from '@engine/svg-parser';

const SVG_24 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 2 L22 2 L22 22 L2 22 Z" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

describe('Grid Mapper', () => {
  it('remaps 24×24 to 32×32 (Fluent)', () => {
    const doc = parseSvg(SVG_24);
    const result = remapToGrid(doc, { width: 32, height: 32 });
    expect(result.viewBox).toEqual({ x: 0, y: 0, width: 32, height: 32 });
    const path = result.elements[0]!;
    if (path.type === 'path') {
      const mCmd = path.commands[0]!;
      // 2 * (32/24) ≈ 2.67
      expect(mCmd.values[0]).toBeCloseTo(2.67, 1);
    }
  });

  it('remaps 32×32 to 24×24 (Material)', () => {
    const svg32 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <path d="M4 4 L28 4 L28 28 L4 28 Z" fill="none" stroke="black" stroke-width="1.5"/>
    </svg>`;
    const doc = parseSvg(svg32);
    const result = remapToGrid(doc, { width: 24, height: 24 });
    expect(result.viewBox.width).toBe(24);
    const path = result.elements[0]!;
    if (path.type === 'path') {
      // 4 * (24/32) = 3
      expect(path.commands[0]!.values[0]).toBe(3);
    }
  });

  it('returns same doc when grid matches', () => {
    const doc = parseSvg(SVG_24);
    const result = remapToGrid(doc, { width: 24, height: 24 });
    expect(result).toBe(doc);
  });

  it('remaps to custom grid', () => {
    const doc = parseSvg(SVG_24);
    const result = remapToGrid(doc, { width: 48, height: 48 });
    expect(result.viewBox.width).toBe(48);
    const path = result.elements[0]!;
    if (path.type === 'path') {
      // 2 * 2 = 4
      expect(path.commands[0]!.values[0]).toBe(4);
    }
  });

  it('pixelSnap rounds all coordinates to integers', () => {
    const doc = parseSvg(SVG_24);
    const remapped = remapToGrid(doc, { width: 32, height: 32 });
    const snapped = pixelSnap(remapped);
    const path = snapped.elements[0]!;
    if (path.type === 'path') {
      for (const cmd of path.commands) {
        for (const v of cmd.values) {
          expect(v).toBe(Math.round(v));
        }
      }
    }
  });
});
