import { describe, it, expect } from 'vitest';
import { parseSvg, parsePathData, parseViewBox, serializeSvg, serializePathData } from '@engine/svg-parser';

// ─── Test SVGs ─────────────────────────────────────────────────

const SIMPLE_PATH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`;

const RECT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="black" stroke-width="2"/>
</svg>`;

const CIRCLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="none" stroke="black" stroke-width="1.5"/>
</svg>`;

const LINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <line x1="2" y1="2" x2="22" y2="22" stroke="black" stroke-width="2"/>
</svg>`;

// ─── Tests ─────────────────────────────────────────────────────

describe('SVG Parser', () => {
  describe('parseSvg', () => {
    it('parses a simple path SVG', () => {
      const doc = parseSvg(SIMPLE_PATH_SVG);
      expect(doc.viewBox).toEqual({ x: 0, y: 0, width: 24, height: 24 });
      expect(doc.width).toBe(24);
      expect(doc.height).toBe(24);
      expect(doc.elements).toHaveLength(1);
      expect(doc.elements[0]!.type).toBe('path');
    });

    it('parses rect and converts to path', () => {
      const doc = parseSvg(RECT_SVG);
      expect(doc.elements).toHaveLength(1);
      expect(doc.elements[0]!.type).toBe('path');
    });

    it('parses circle and converts to path', () => {
      const doc = parseSvg(CIRCLE_SVG);
      expect(doc.elements).toHaveLength(1);
      const path = doc.elements[0]!;
      expect(path.type).toBe('path');
      if (path.type === 'path') {
        expect(path.attributes.strokeWidth).toBe(1.5);
      }
    });

    it('parses line and converts to path', () => {
      const doc = parseSvg(LINE_SVG);
      expect(doc.elements).toHaveLength(1);
      const path = doc.elements[0]!;
      if (path.type === 'path') {
        expect(path.commands).toHaveLength(2);
        expect(path.commands[0]!.type).toBe('M');
        expect(path.commands[1]!.type).toBe('L');
      }
    });

    it('throws on invalid SVG', () => {
      expect(() => parseSvg('not an svg')).toThrow('Invalid SVG');
    });

    it('parses style attributes correctly', () => {
      const doc = parseSvg(SIMPLE_PATH_SVG);
      const path = doc.elements[0]!;
      if (path.type === 'path') {
        expect(path.attributes.fill).toBe('none');
        expect(path.attributes.stroke).toBe('currentColor');
        expect(path.attributes.strokeWidth).toBe(2);
      }
    });
  });

  describe('parseViewBox', () => {
    it('parses standard viewBox', () => {
      expect(parseViewBox('viewBox="0 0 24 24"')).toEqual({ x: 0, y: 0, width: 24, height: 24 });
    });

    it('parses viewBox with commas', () => {
      expect(parseViewBox('viewBox="0,0,32,32"')).toEqual({ x: 0, y: 0, width: 32, height: 32 });
    });

    it('falls back to width/height when no viewBox', () => {
      expect(parseViewBox('width="48" height="48"')).toEqual({ x: 0, y: 0, width: 48, height: 48 });
    });
  });

  describe('parsePathData', () => {
    it('parses M L Z commands', () => {
      const commands = parsePathData('M12 2 L22 12 L12 22 Z');
      expect(commands).toHaveLength(4);
      expect(commands[0]).toEqual({ type: 'M', values: [12, 2] });
      expect(commands[3]).toEqual({ type: 'Z', values: [] });
    });

    it('parses cubic bezier', () => {
      const commands = parsePathData('M0 0 C10 0 20 10 20 20');
      expect(commands).toHaveLength(2);
      expect(commands[1]!.type).toBe('C');
      expect(commands[1]!.values).toEqual([10, 0, 20, 10, 20, 20]);
    });

    it('parses arc commands', () => {
      const commands = parsePathData('M10 80 A25 25 0 0 1 50 80');
      expect(commands).toHaveLength(2);
      expect(commands[1]!.type).toBe('A');
      expect(commands[1]!.values).toHaveLength(7);
    });
  });

  describe('Serialization', () => {
    it('round-trips a simple SVG', () => {
      const doc = parseSvg(SIMPLE_PATH_SVG);
      const output = serializeSvg(doc);
      expect(output).toContain('viewBox="0 0 24 24"');
      expect(output).toContain('<path');
      expect(output).toContain('M12 2');
    });

    it('serializes path data correctly', () => {
      const commands = parsePathData('M12 2 L22 12 Z');
      const result = serializePathData(commands);
      expect(result).toBe('M12 2 L22 12 Z');
    });
  });
});
