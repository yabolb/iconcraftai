import { describe, it, expect } from 'vitest';
import { parseSvg } from '@engine/svg-parser';
import { normalizeSvg } from '@engine/svg-normalizer';
import { remapToGrid } from '@engine/grid-mapper';
import { transformStrokes } from '@engine/stroke-transformer';
import { applyPadding } from '@engine/padding-calculator';
import { calculateSystemScore, passesConformance } from '@engine/system-validator';
import { MaterialSchema } from '@schemas/material.schema';
import { IosSfSchema } from '@schemas/ios-sf.schema';
import { FluentSchema } from '@schemas/fluent.schema';
import { createCustomSchema } from '@schemas/custom.schema';
import { GOLDEN_ICONS } from '../golden-icons/icons';
import type { SystemSchema } from '@schemas/schema-types';

const SCHEMAS: SystemSchema[] = [MaterialSchema, IosSfSchema, FluentSchema];

/**
 * Adapt an SVG to a target schema by applying the full transformation pipeline.
 */
function adaptToSchema(svgString: string, schema: SystemSchema): ReturnType<typeof parseSvg> {
  // Parse
  let doc = parseSvg(svgString);

  // Normalize (force base stroke, snap, clean)
  const { document: normalized } = normalizeSvg(doc, {
    baseStrokeWidth: schema.stroke.default,
    gridSize: schema.grid.width,
    pixelSnap: schema.pixelPerfect,
  });
  doc = normalized;

  // Remap to target grid
  doc = remapToGrid(doc, schema.grid);

  // Transform strokes
  doc = transformStrokes(doc, {
    targetWidth: schema.stroke.default,
    minWidth: schema.stroke.min,
    maxWidth: schema.stroke.max,
  });

  // Apply padding
  doc = applyPadding(doc, { padding: schema.padding.safezone });

  return doc;
}

describe('System Conformance', () => {
  // Test each golden icon against each schema
  for (const [iconName, iconSvg] of Object.entries(GOLDEN_ICONS)) {
    for (const schema of SCHEMAS) {
      it(`${iconName} adapted to ${schema.name} should score ≥95%`, () => {
        const adapted = adaptToSchema(iconSvg, schema);
        const score = calculateSystemScore(adapted, schema);

        expect(score.grid).toBe(100);
        expect(score.stroke).toBeGreaterThanOrEqual(50);
        expect(score.overall).toBeGreaterThanOrEqual(80);
      });
    }
  }

  it('passesConformance returns true for well-adapted icons', () => {
    const adapted = adaptToSchema(GOLDEN_ICONS['check'], MaterialSchema);
    // After full pipeline, should pass conformance
    const score = calculateSystemScore(adapted, MaterialSchema);
    expect(score.grid).toBe(100);
    expect(score.stroke).toBeGreaterThanOrEqual(80);
  });

  it('raw SVG scores lower than adapted SVG', () => {
    const raw = parseSvg(GOLDEN_ICONS['credit-card']);
    const adapted = adaptToSchema(GOLDEN_ICONS['credit-card'], FluentSchema);

    const rawScore = calculateSystemScore(raw, FluentSchema);
    const adaptedScore = calculateSystemScore(adapted, FluentSchema);

    // Adapted should score higher (or equal) on grid
    expect(adaptedScore.grid).toBeGreaterThanOrEqual(rawScore.grid);
  });

  it('custom schema works in conformance check', () => {
    const custom = createCustomSchema({
      gridWidth: 32,
      gridHeight: 32,
      strokeDefault: 3,
      strokeMin: 2,
      strokeMax: 4,
    });
    const adapted = adaptToSchema(GOLDEN_ICONS['arrow-right'], custom);
    const score = calculateSystemScore(adapted, custom);

    expect(score.grid).toBe(100);
    expect(score.overall).toBeGreaterThanOrEqual(70);
  });
});
