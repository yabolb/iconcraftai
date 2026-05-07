/**
 * Fluent Design Schema — Microsoft
 * PRD §4A: Grid 32x32, trazo 1.5px, estilo más geométrico y plano.
 */
import type { SystemSchema } from './schema-types.js';

export const FluentSchema: SystemSchema = {
  id: 'fluent',
  name: 'Fluent Design (Microsoft)',
  grid: { width: 32, height: 32 },
  stroke: { default: 1.5, min: 1, max: 2 },
  corner: { style: 'sharp', minRadius: 0, maxRadius: 1 },
  padding: { safezone: 2 },
  alignment: 'geometric-center',
  pixelPerfect: true,
};
