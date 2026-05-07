/**
 * Bundle Packager — Assembles all exported assets into a production bundle.
 * PRD §4B: The single payment unlocks a package of assets.
 */

import type { SvgDocument } from '../engine/types.js';
import type { SystemSchema } from '../schemas/schema-types.js';
import { exportSvg } from './svg-exporter.js';
import { prepareFontConfig, generateFont } from './font-generator.js';
import { emitReact } from './code-emitters/react-emitter.js';
import { emitAngular } from './code-emitters/angular-emitter.js';
import { emitVue } from './code-emitters/vue-emitter.js';
import { emitSwift } from './code-emitters/swift-emitter.js';
import { emitCompose } from './code-emitters/compose-emitter.js';
import { emitXaml } from './code-emitters/xaml-emitter.js';
import { emitCssSprite } from './code-emitters/css-sprite-emitter.js';

export type TargetFramework = 'react' | 'angular' | 'vue' | 'swift' | 'compose' | 'xaml' | 'css-sprite';

export interface BundleRequest {
  iconName: string;
  doc: SvgDocument;
  schema: SystemSchema;
  frameworks: TargetFramework[];
  includeFont?: boolean;
}

export interface BundleFile {
  filename: string;
  content: string;
  type: 'svg' | 'code' | 'font' | 'css';
}

export interface ProductionBundle {
  iconName: string;
  system: string;
  files: BundleFile[];
}

/**
 * Generate a full production bundle for an icon.
 */
export function generateBundle(request: BundleRequest): ProductionBundle {
  const { iconName, doc, schema, frameworks, includeFont = false } = request;
  const pascalName = toPascalCase(iconName);
  const files: BundleFile[] = [];

  // 1. SVG file (always included)
  files.push({
    filename: `${iconName}.svg`,
    content: exportSvg(doc, { minify: true }),
    type: 'svg',
  });

  // 2. Code emitters per framework
  for (const fw of frameworks) {
    const emitted = emitForFramework(doc, fw, pascalName, iconName);
    if (emitted) files.push(emitted);
  }

  // 3. Font (optional)
  if (includeFont) {
    const config = prepareFontConfig([{ name: iconName, doc }]);
    const font = generateFont(config);
    files.push({
      filename: `${iconName}-font.svg`,
      content: font.svgFontSource,
      type: 'font',
    });
  }

  return {
    iconName,
    system: schema.id,
    files,
  };
}

function emitForFramework(
  doc: SvgDocument,
  framework: TargetFramework,
  pascalName: string,
  kebabName: string,
): BundleFile | null {
  switch (framework) {
    case 'react':
      return { filename: `${pascalName}.tsx`, content: emitReact(doc, { componentName: pascalName }), type: 'code' };
    case 'angular':
      return { filename: `${kebabName}.component.ts`, content: emitAngular(doc, { componentName: pascalName }), type: 'code' };
    case 'vue':
      return { filename: `${pascalName}.vue`, content: emitVue(doc, { componentName: pascalName }), type: 'code' };
    case 'swift':
      return { filename: `${pascalName}.swift`, content: emitSwift(doc, { structName: pascalName }), type: 'code' };
    case 'compose':
      return { filename: `${pascalName}.kt`, content: emitCompose(doc, { functionName: pascalName }), type: 'code' };
    case 'xaml':
      return { filename: `${pascalName}.xaml`, content: emitXaml(doc, { resourceKey: pascalName }), type: 'code' };
    case 'css-sprite':
      return { filename: `${kebabName}.css`, content: emitCssSprite(doc, { className: `icon-${kebabName}` }), type: 'css' };
    default:
      return null;
  }
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}
