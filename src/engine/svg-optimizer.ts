/**
 * SVG Optimizer — Reduces path complexity and detects overly complex icons.
 * PRD §10.1: Detects when design is "too complex for 24px" and simplifies.
 */

import type { SvgDocument, SvgElement, ComplexityReport } from './types.js';

export interface OptimizerOptions {
  /** Max total commands before warning (default: 50) */
  maxCommands?: number;
  /** Remove redundant consecutive identical points */
  deduplicatePoints?: boolean;
}

const DEFAULTS: Required<OptimizerOptions> = {
  maxCommands: 50,
  deduplicatePoints: true,
};

/** Analyze the complexity of an SVG document. */
export function analyzeComplexity(doc: SvgDocument): ComplexityReport {
  let totalNodes = 0;
  let totalCommands = 0;
  let maxDepth = 0;

  function walk(elements: SvgElement[], depth: number): void {
    maxDepth = Math.max(maxDepth, depth);
    for (const el of elements) {
      totalNodes++;
      if (el.type === 'path') {
        totalCommands += el.commands.length;
      } else {
        walk(el.children, depth + 1);
      }
    }
  }

  walk(doc.elements, 0);

  const isComplex = totalCommands > 50;
  return {
    totalNodes,
    totalCommands,
    maxDepth,
    isComplex,
    recommendation: isComplex
      ? `This design has ${totalCommands} commands — too complex for small grids. Simplification recommended.`
      : undefined,
  };
}

/** Optimize an SVG document by removing redundant points. */
export function optimizeSvg(doc: SvgDocument, options: OptimizerOptions = {}): SvgDocument {
  const opts = { ...DEFAULTS, ...options };
  let elements = doc.elements;

  if (opts.deduplicatePoints) {
    elements = elements.map(deduplicateElement);
  }

  return { ...doc, elements };
}

function deduplicateElement(el: SvgElement): SvgElement {
  if (el.type === 'path') {
    const commands = deduplicateCommands(el.commands);
    return { ...el, commands };
  }
  return { ...el, children: el.children.map(deduplicateElement) };
}

function deduplicateCommands(commands: import('./types.js').PathCommand[]): import('./types.js').PathCommand[] {
  if (commands.length <= 1) return commands;

  const result = [commands[0]!];
  for (let i = 1; i < commands.length; i++) {
    const prev = result[result.length - 1]!;
    const curr = commands[i]!;

    // Skip duplicate consecutive L commands to the same point
    if (
      prev.type === curr.type &&
      (curr.type === 'L' || curr.type === 'l') &&
      prev.values.length === curr.values.length &&
      prev.values.every((v, j) => v === curr.values[j])
    ) {
      continue;
    }

    result.push(curr);
  }

  return result;
}
