import { describe, it, expect } from 'vitest';
import { normalizeSvg } from '@engine/svg-normalizer';
import { parseSvg } from '@engine/svg-parser';

const MESSY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <path d="M24.5 4.3 L44.7 24.5 L24.5 44.7 L4.3 24.5 Z" fill="none" stroke="black" stroke-width="3.5"/>
</svg>`;

const SIMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12 2 L22 12 Z" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

describe('SVG Normalizer', () => {
  it('standardizes viewBox to target grid', () => {
    const doc = parseSvg(MESSY_SVG);
    const { document, changes } = normalizeSvg(doc, { gridSize: 24 });
    expect(document.viewBox).toEqual({ x: 0, y: 0, width: 24, height: 24 });
    expect(changes.some((c) => c.type === 'viewbox-standardized')).toBe(true);
  });

  it('forces stroke width to base value', () => {
    const doc = parseSvg(MESSY_SVG);
    const { document, changes } = normalizeSvg(doc, { baseStrokeWidth: 2 });
    const path = document.elements[0]!;
    if (path.type === 'path') {
      expect(path.attributes.strokeWidth).toBe(2);
    }
    expect(changes.some((c) => c.type === 'stroke-forced')).toBe(true);
  });

  it('snaps coordinates to pixel grid', () => {
    const doc = parseSvg(MESSY_SVG);
    const { document, changes } = normalizeSvg(doc, { pixelSnap: true, gridSize: 24 });
    const path = document.elements[0]!;
    if (path.type === 'path') {
      for (const cmd of path.commands) {
        for (const v of cmd.values) {
          expect(v).toBe(Math.round(v));
        }
      }
    }
    expect(changes.some((c) => c.type === 'grid-snapped')).toBe(true);
  });

  it('does not modify already-clean SVGs unnecessarily', () => {
    const doc = parseSvg(SIMPLE_SVG);
    const { document } = normalizeSvg(doc, { baseStrokeWidth: 2, gridSize: 24 });
    expect(document.viewBox).toEqual({ x: 0, y: 0, width: 24, height: 24 });
  });

  it('reports all changes made', () => {
    const doc = parseSvg(MESSY_SVG);
    const { changes } = normalizeSvg(doc, { baseStrokeWidth: 2, gridSize: 24 });
    expect(changes.length).toBeGreaterThan(0);
    for (const change of changes) {
      expect(change.type).toBeDefined();
      expect(change.description).toBeDefined();
    }
  });

  it('respects pixelSnap=false option', () => {
    const doc = parseSvg(MESSY_SVG);
    const { changes } = normalizeSvg(doc, { pixelSnap: false, gridSize: 24 });
    expect(changes.some((c) => c.type === 'grid-snapped')).toBe(false);
  });
});
