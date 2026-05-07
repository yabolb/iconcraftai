import { describe, it, expect } from 'vitest';
import { analyzeComplexity, optimizeSvg } from '@engine/svg-optimizer';
import { parseSvg } from '@engine/svg-parser';

const SIMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 2 L22 2 L22 22 L2 22 Z" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

const DUPLICATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 2 L10 10 L10 10 L20 20" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

describe('SVG Optimizer', () => {
  describe('analyzeComplexity', () => {
    it('simple icon is not complex', () => {
      const doc = parseSvg(SIMPLE_SVG);
      const report = analyzeComplexity(doc);
      expect(report.isComplex).toBe(false);
      expect(report.totalNodes).toBe(1);
      expect(report.totalCommands).toBe(5);
      expect(report.recommendation).toBeUndefined();
    });

    it('reports recommendation for complex icons', () => {
      // Build a doc with 60 commands
      const commands = Array.from({ length: 60 }, (_, i) => `L${i} ${i}`).join(' ');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0 ${commands}" stroke="black" stroke-width="2"/></svg>`;
      const doc = parseSvg(svg);
      const report = analyzeComplexity(doc);
      expect(report.isComplex).toBe(true);
      expect(report.recommendation).toBeDefined();
    });
  });

  describe('optimizeSvg', () => {
    it('removes duplicate consecutive L commands', () => {
      const doc = parseSvg(DUPLICATE_SVG);
      const result = optimizeSvg(doc);
      const path = result.elements[0]!;
      if (path.type === 'path') {
        // Should have M, L, L (deduplicated) instead of M, L, L, L
        expect(path.commands.length).toBeLessThan(4);
      }
    });

    it('preserves non-duplicate commands', () => {
      const doc = parseSvg(SIMPLE_SVG);
      const result = optimizeSvg(doc);
      const path = result.elements[0]!;
      if (path.type === 'path') {
        expect(path.commands).toHaveLength(5);
      }
    });
  });
});
