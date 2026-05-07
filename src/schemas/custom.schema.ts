/**
 * Custom Schema — User-defined rules for agencies/brands.
 * PRD §4A: "El usuario define sus propias reglas"
 */
import type { SystemSchema, CustomSchemaInput } from './schema-types.js';

/** Default values for custom schemas when user doesn't specify all fields */
const CUSTOM_DEFAULTS: SystemSchema = {
  id: 'custom',
  name: 'Custom',
  grid: { width: 24, height: 24 },
  stroke: { default: 2, min: 1, max: 4 },
  corner: { style: 'rounded', minRadius: 0, maxRadius: 4 },
  padding: { safezone: 2 },
  alignment: 'geometric-center',
  pixelPerfect: true,
};

/**
 * Create a custom schema from user input.
 * Any field not provided uses sensible defaults.
 */
export function createCustomSchema(input: CustomSchemaInput): SystemSchema {
  return {
    id: input.id ?? 'custom',
    name: input.name ?? 'Custom',
    grid: {
      width: input.gridWidth ?? CUSTOM_DEFAULTS.grid.width,
      height: input.gridHeight ?? CUSTOM_DEFAULTS.grid.height,
    },
    stroke: {
      default: input.strokeDefault ?? CUSTOM_DEFAULTS.stroke.default,
      min: input.strokeMin ?? CUSTOM_DEFAULTS.stroke.min,
      max: input.strokeMax ?? CUSTOM_DEFAULTS.stroke.max,
    },
    corner: {
      style: input.cornerStyle ?? CUSTOM_DEFAULTS.corner.style,
      minRadius: input.cornerMinRadius ?? CUSTOM_DEFAULTS.corner.minRadius,
      maxRadius: input.cornerMaxRadius ?? CUSTOM_DEFAULTS.corner.maxRadius,
    },
    padding: {
      safezone: input.safezone ?? CUSTOM_DEFAULTS.padding.safezone,
    },
    alignment: input.alignment ?? CUSTOM_DEFAULTS.alignment,
    pixelPerfect: input.pixelPerfect ?? CUSTOM_DEFAULTS.pixelPerfect,
  };
}
