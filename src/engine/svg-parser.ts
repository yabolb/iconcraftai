/**
 * SVG Parser — Parses raw SVG strings into the internal SvgDocument model.
 *
 * This is the entry point for all SVG processing. It converts XML-based SVG
 * into a structured, manipulable representation that the engine can transform.
 */

import type {
  SvgDocument,
  SvgElement,
  SvgPath,

  SvgAttributes,
  PathCommand,
  PathCommandType,
  ViewBox,
} from './types.js';

/**
 * Parse a raw SVG string into an SvgDocument.
 */
export function parseSvg(svgString: string): SvgDocument {
  const cleaned = svgString.trim();

  if (!cleaned.startsWith('<svg') && !cleaned.startsWith('<?xml')) {
    throw new Error('Invalid SVG: must start with <svg or <?xml');
  }

  const viewBox = parseViewBox(cleaned);
  const width = parseNumericAttribute(cleaned, 'width');
  const height = parseNumericAttribute(cleaned, 'height');
  const elements = parseElements(cleaned);

  return { viewBox, width, height, elements };
}

/**
 * Parse the viewBox attribute from SVG root.
 */
export function parseViewBox(svg: string): ViewBox {
  const match = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  if (match?.[1]) {
    const parts = match[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      return { x: parts[0]!, y: parts[1]!, width: parts[2]!, height: parts[3]! };
    }
  }

  // Fallback: try width/height attributes
  const w = parseNumericAttribute(svg, 'width') ?? 24;
  const h = parseNumericAttribute(svg, 'height') ?? 24;
  return { x: 0, y: 0, width: w, height: h };
}

/**
 * Parse a numeric attribute from an SVG tag.
 */
export function parseNumericAttribute(svg: string, attr: string): number | undefined {
  const regex = new RegExp(`${attr}\\s*=\\s*"([^"]+)"`);
  const match = svg.match(regex);
  if (match?.[1]) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? undefined : val;
  }
  return undefined;
}

/**
 * Parse all <path> and <g> elements from SVG markup.
 */
export function parseElements(svg: string): SvgElement[] {
  const elements: SvgElement[] = [];

  // Parse <path> elements
  const pathRegex = /<path\s+([^/>]+)\/?>/g;
  let pathMatch;
  while ((pathMatch = pathRegex.exec(svg)) !== null) {
    const attrsStr = pathMatch[1] ?? '';
    const path = parseSvgPath(attrsStr);
    if (path) {
      elements.push(path);
    }
  }

  // Parse <rect> elements → convert to path
  const rectRegex = /<rect\s+([^/>]+)\/?>/g;
  let rectMatch;
  while ((rectMatch = rectRegex.exec(svg)) !== null) {
    const attrsStr = rectMatch[1] ?? '';
    const path = parseRect(attrsStr);
    if (path) {
      elements.push(path);
    }
  }

  // Parse <circle> elements → convert to path
  const circleRegex = /<circle\s+([^/>]+)\/?>/g;
  let circleMatch;
  while ((circleMatch = circleRegex.exec(svg)) !== null) {
    const attrsStr = circleMatch[1] ?? '';
    const path = parseCircle(attrsStr);
    if (path) {
      elements.push(path);
    }
  }

  // Parse <line> elements → convert to path
  const lineRegex = /<line\s+([^/>]+)\/?>/g;
  let lineMatch;
  while ((lineMatch = lineRegex.exec(svg)) !== null) {
    const attrsStr = lineMatch[1] ?? '';
    const path = parseLine(attrsStr);
    if (path) {
      elements.push(path);
    }
  }

  return elements;
}

/**
 * Parse a single <path> element's attributes into an SvgPath.
 */
function parseSvgPath(attrsStr: string): SvgPath | null {
  const dMatch = attrsStr.match(/\bd\s*=\s*"([^"]+)"/);
  if (!dMatch?.[1]) return null;

  const commands = parsePathData(dMatch[1]);
  const attributes = parseStyleAttributes(attrsStr);

  return { type: 'path', commands, attributes };
}

/**
 * Parse SVG path `d` attribute into PathCommand array.
 */
export function parsePathData(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const regex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let match;

  while ((match = regex.exec(d)) !== null) {
    const type = match[1] as PathCommandType;
    const valStr = (match[2] ?? '').trim();
    const values = valStr.length > 0
      ? valStr.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n))
      : [];

    commands.push({ type, values });
  }

  return commands;
}

/**
 * Convert <rect> to a path.
 */
function parseRect(attrsStr: string): SvgPath | null {
  const x = parseAttrValue(attrsStr, 'x') ?? 0;
  const y = parseAttrValue(attrsStr, 'y') ?? 0;
  const w = parseAttrValue(attrsStr, 'width');
  const h = parseAttrValue(attrsStr, 'height');
  if (w === undefined || h === undefined) return null;

  const rx = parseAttrValue(attrsStr, 'rx') ?? 0;
  const ry = parseAttrValue(attrsStr, 'ry') ?? rx;

  let commands: PathCommand[];

  if (rx === 0 && ry === 0) {
    commands = [
      { type: 'M', values: [x, y] },
      { type: 'L', values: [x + w, y] },
      { type: 'L', values: [x + w, y + h] },
      { type: 'L', values: [x, y + h] },
      { type: 'Z', values: [] },
    ];
  } else {
    const r = Math.min(rx, w / 2);
    const rv = Math.min(ry, h / 2);
    commands = [
      { type: 'M', values: [x + r, y] },
      { type: 'L', values: [x + w - r, y] },
      { type: 'A', values: [r, rv, 0, 0, 1, x + w, y + rv] },
      { type: 'L', values: [x + w, y + h - rv] },
      { type: 'A', values: [r, rv, 0, 0, 1, x + w - r, y + h] },
      { type: 'L', values: [x + r, y + h] },
      { type: 'A', values: [r, rv, 0, 0, 1, x, y + h - rv] },
      { type: 'L', values: [x, y + rv] },
      { type: 'A', values: [r, rv, 0, 0, 1, x + r, y] },
      { type: 'Z', values: [] },
    ];
  }

  return { type: 'path', commands, attributes: parseStyleAttributes(attrsStr) };
}

/**
 * Convert <circle> to a path using two arcs.
 */
function parseCircle(attrsStr: string): SvgPath | null {
  const cx = parseAttrValue(attrsStr, 'cx') ?? 0;
  const cy = parseAttrValue(attrsStr, 'cy') ?? 0;
  const r = parseAttrValue(attrsStr, 'r');
  if (r === undefined) return null;

  const commands: PathCommand[] = [
    { type: 'M', values: [cx - r, cy] },
    { type: 'A', values: [r, r, 0, 1, 1, cx + r, cy] },
    { type: 'A', values: [r, r, 0, 1, 1, cx - r, cy] },
    { type: 'Z', values: [] },
  ];

  return { type: 'path', commands, attributes: parseStyleAttributes(attrsStr) };
}

/**
 * Convert <line> to a path.
 */
function parseLine(attrsStr: string): SvgPath | null {
  const x1 = parseAttrValue(attrsStr, 'x1') ?? 0;
  const y1 = parseAttrValue(attrsStr, 'y1') ?? 0;
  const x2 = parseAttrValue(attrsStr, 'x2') ?? 0;
  const y2 = parseAttrValue(attrsStr, 'y2') ?? 0;

  const commands: PathCommand[] = [
    { type: 'M', values: [x1, y1] },
    { type: 'L', values: [x2, y2] },
  ];

  return { type: 'path', commands, attributes: parseStyleAttributes(attrsStr) };
}

/**
 * Parse style-related attributes from an element's attribute string.
 */
function parseStyleAttributes(attrsStr: string): SvgAttributes {
  const attrs: SvgAttributes = {};

  const fill = parseAttrString(attrsStr, 'fill');
  if (fill) attrs.fill = fill;

  const stroke = parseAttrString(attrsStr, 'stroke');
  if (stroke) attrs.stroke = stroke;

  const strokeWidth = parseAttrValue(attrsStr, 'stroke-width');
  if (strokeWidth !== undefined) attrs.strokeWidth = strokeWidth;

  const strokeLinecap = parseAttrString(attrsStr, 'stroke-linecap');
  if (strokeLinecap) attrs.strokeLinecap = strokeLinecap as SvgAttributes['strokeLinecap'];

  const strokeLinejoin = parseAttrString(attrsStr, 'stroke-linejoin');
  if (strokeLinejoin) attrs.strokeLinejoin = strokeLinejoin as SvgAttributes['strokeLinejoin'];

  const opacity = parseAttrValue(attrsStr, 'opacity');
  if (opacity !== undefined) attrs.opacity = opacity;

  const transform = parseAttrString(attrsStr, 'transform');
  if (transform) attrs.transform = transform;

  return attrs;
}

/**
 * Parse a numeric attribute value from an attribute string.
 */
function parseAttrValue(attrsStr: string, name: string): number | undefined {
  const regex = new RegExp(`\\b${name}\\s*=\\s*"([^"]+)"`);
  const match = attrsStr.match(regex);
  if (match?.[1]) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? undefined : val;
  }
  return undefined;
}

/**
 * Parse a string attribute value from an attribute string.
 */
function parseAttrString(attrsStr: string, name: string): string | undefined {
  const regex = new RegExp(`\\b${name}\\s*=\\s*"([^"]+)"`);
  const match = attrsStr.match(regex);
  return match?.[1];
}

// ─── Serialization ─────────────────────────────────────────────

/**
 * Serialize an SvgDocument back to an SVG string.
 */
export function serializeSvg(doc: SvgDocument): string {
  const vb = `${doc.viewBox.x} ${doc.viewBox.y} ${doc.viewBox.width} ${doc.viewBox.height}`;
  const w = doc.width ?? doc.viewBox.width;
  const h = doc.height ?? doc.viewBox.height;

  const children = doc.elements.map(serializeElement).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">\n  ${children}\n</svg>`;
}

function serializeElement(el: SvgElement): string {
  if (el.type === 'path') {
    const d = serializePathData(el.commands);
    const attrs = serializeAttributes(el.attributes);
    return `<path d="${d}"${attrs}/>`;
  }
  // group
  const attrs = serializeAttributes(el.attributes);
  const children = el.children.map(serializeElement).join('\n    ');
  return `<g${attrs}>\n    ${children}\n  </g>`;
}

/**
 * Serialize PathCommand array back to SVG path `d` string.
 */
export function serializePathData(commands: PathCommand[]): string {
  return commands
    .map((cmd) => {
      if (cmd.values.length === 0) return cmd.type;
      return `${cmd.type}${cmd.values.map((v) => roundCoord(v)).join(' ')}`;
    })
    .join(' ');
}

function serializeAttributes(attrs: SvgAttributes): string {
  const parts: string[] = [];
  if (attrs.fill) parts.push(`fill="${attrs.fill}"`);
  if (attrs.stroke) parts.push(`stroke="${attrs.stroke}"`);
  if (attrs.strokeWidth !== undefined) parts.push(`stroke-width="${attrs.strokeWidth}"`);
  if (attrs.strokeLinecap) parts.push(`stroke-linecap="${attrs.strokeLinecap}"`);
  if (attrs.strokeLinejoin) parts.push(`stroke-linejoin="${attrs.strokeLinejoin}"`);
  if (attrs.opacity !== undefined) parts.push(`opacity="${attrs.opacity}"`);
  if (attrs.transform) parts.push(`transform="${attrs.transform}"`);
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function roundCoord(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString();
}
