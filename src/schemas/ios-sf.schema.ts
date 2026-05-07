/**
 * iOS / SF Symbols Schema — Apple
 * PRD §4A: Óptica centrada, trazos variables según peso, curvas continuas.
 */
import type { SystemSchema } from './schema-types.js';

export const IosSfSchema: SystemSchema = {
  id: 'ios-sf',
  name: 'SF Symbols (Apple)',
  grid: { width: 24, height: 24 },
  stroke: { default: 1.5, min: 0.5, max: 3.5 },
  corner: { style: 'continuous', minRadius: 0, maxRadius: 4 },
  padding: { safezone: 2 },
  alignment: 'optical-center',
  pixelPerfect: false,
};
