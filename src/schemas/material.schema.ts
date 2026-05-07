/**
 * Material Design Schema — Google
 * PRD §4A: Grid 24x24, trazo 2px, esquinas redondeadas suaves.
 */
import type { SystemSchema } from './schema-types.js';

export const MaterialSchema: SystemSchema = {
  id: 'material',
  name: 'Material Design (Google)',
  grid: { width: 24, height: 24 },
  stroke: { default: 2, min: 1.5, max: 2.5 },
  corner: { style: 'rounded', minRadius: 0, maxRadius: 2 },
  padding: { safezone: 2 },
  alignment: 'geometric-center',
  pixelPerfect: true,
};
