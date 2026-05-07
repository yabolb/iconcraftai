/**
 * Grid Mapper — Remaps SVG coordinates to a target grid.
 *
 * Scales all path coordinates from the current viewBox to the target grid size
 * (e.g., 24×24 for Material, 32×32 for Fluent) and pixel-snaps the result.
 */

import type { SvgDocument, SvgElement, PathCommand, GridConfig } from './types.js';

/**
 * Remap an SvgDocument to a new grid size.
 */
export function remapToGrid(doc: SvgDocument, target: GridConfig): SvgDocument {
  const scaleX = target.width / doc.viewBox.width;
  const scaleY = target.height / doc.viewBox.height;

  if (scaleX === 1 && scaleY === 1) return doc;

  const elements = doc.elements.map((el) => remapElement(el, scaleX, scaleY));

  return {
    ...doc,
    viewBox: { x: 0, y: 0, width: target.width, height: target.height },
    width: target.width,
    height: target.height,
    elements,
  };
}

/**
 * Snap all coordinates in a document to the nearest pixel.
 */
export function pixelSnap(doc: SvgDocument): SvgDocument {
  const elements = doc.elements.map(snapElement);
  return { ...doc, elements };
}

function remapElement(el: SvgElement, scaleX: number, scaleY: number): SvgElement {
  if (el.type === 'path') {
    return {
      ...el,
      commands: remapCommands(el.commands, scaleX, scaleY),
    };
  }

  return {
    ...el,
    children: el.children.map((child) => remapElement(child, scaleX, scaleY)),
  };
}

function remapCommands(commands: PathCommand[], scaleX: number, scaleY: number): PathCommand[] {
  return commands.map((cmd) => {
    const upper = cmd.type.toUpperCase();

    if (upper === 'Z') return cmd;
    if (upper === 'H') return { ...cmd, values: cmd.values.map((v) => v * scaleX) };
    if (upper === 'V') return { ...cmd, values: cmd.values.map((v) => v * scaleY) };

    if (upper === 'A') {
      // Arc: rx ry x-rotation large-arc-flag sweep-flag x y
      return {
        ...cmd,
        values: cmd.values.map((v, i) => {
          if (i % 7 === 0) return v * scaleX;      // rx
          if (i % 7 === 1) return v * scaleY;      // ry
          if (i % 7 === 5) return v * scaleX;      // x
          if (i % 7 === 6) return v * scaleY;      // y
          return v;                                  // rotation, flags
        }),
      };
    }

    // M, L, C, S, Q, T — alternate x, y
    const values = cmd.values.map((v, i) => v * (i % 2 === 0 ? scaleX : scaleY));
    return { ...cmd, values };
  });
}

function snapElement(el: SvgElement): SvgElement {
  if (el.type === 'path') {
    return {
      ...el,
      commands: el.commands.map((cmd) => ({
        ...cmd,
        values: cmd.values.map(Math.round),
      })),
    };
  }

  return {
    ...el,
    children: el.children.map(snapElement),
  };
}
