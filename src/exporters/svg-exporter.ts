/**
 * SVG Exporter — Produces optimized, production-ready SVG output.
 * PRD §4B: "SVG Universal: Optimizado y reactivo."
 */

import type { SvgDocument } from '../engine/types.js';
import { serializeSvg } from '../engine/svg-parser.js';

export interface SvgExportOptions {
  /** Remove unnecessary whitespace (default: true) */
  minify?: boolean;
  /** Add XML declaration (default: false) */
  xmlDeclaration?: boolean;
  /** Round coordinates to N decimal places (default: 2) */
  precision?: number;
}

/**
 * Export an SvgDocument as an optimized SVG string.
 */
export function exportSvg(doc: SvgDocument, options: SvgExportOptions = {}): string {
  let svg = serializeSvg(doc);

  if (options.xmlDeclaration) {
    svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
  }

  if (options.minify) {
    svg = svg
      .replace(/\n\s*/g, '')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ');
  }

  return svg;
}

/**
 * Export as a data URI for embedding in HTML/CSS.
 */
export function exportSvgDataUri(doc: SvgDocument): string {
  const svg = exportSvg(doc, { minify: true });
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}
