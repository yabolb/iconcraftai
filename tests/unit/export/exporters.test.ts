import { describe, it, expect } from 'vitest';
import { parseSvg } from '@engine/svg-parser';
import { exportSvg, exportSvgDataUri } from '@exporters/svg-exporter';
import { prepareFontConfig, generateFont } from '@exporters/font-generator';
import { emitReact } from '@exporters/code-emitters/react-emitter';
import { emitAngular } from '@exporters/code-emitters/angular-emitter';
import { emitVue } from '@exporters/code-emitters/vue-emitter';
import { emitSwift } from '@exporters/code-emitters/swift-emitter';
import { emitCompose } from '@exporters/code-emitters/compose-emitter';
import { emitXaml } from '@exporters/code-emitters/xaml-emitter';
import { emitCssSprite } from '@exporters/code-emitters/css-sprite-emitter';
import { generateBundle } from '@exporters/bundle-packager';
import { MaterialSchema } from '@schemas/material.schema';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M5 12 L19 12 M12 5 L19 12 L12 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

describe('SVG Exporter', () => {
  it('exports valid SVG', () => {
    const doc = parseSvg(SVG);
    const output = exportSvg(doc);
    expect(output).toContain('<svg');
    expect(output).toContain('viewBox="0 0 24 24"');
    expect(output).toContain('<path');
  });

  it('minifies SVG', () => {
    const doc = parseSvg(SVG);
    const normal = exportSvg(doc);
    const mini = exportSvg(doc, { minify: true });
    expect(mini.length).toBeLessThan(normal.length);
  });

  it('generates data URI', () => {
    const doc = parseSvg(SVG);
    const uri = exportSvgDataUri(doc);
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
  });
});

describe('Font Generator', () => {
  it('prepares font config with glyphs', () => {
    const doc = parseSvg(SVG);
    const config = prepareFontConfig([{ name: 'arrow-right', doc }]);
    expect(config.fontFamily).toBe('IconCraftIcons');
    expect(config.glyphs).toHaveLength(1);
    expect(config.glyphs[0]!.name).toBe('arrow-right');
    expect(config.glyphs[0]!.ligature).toBe('arrowright');
  });

  it('generates SVG font source', () => {
    const doc = parseSvg(SVG);
    const config = prepareFontConfig([{ name: 'test', doc }]);
    const font = generateFont(config);
    expect(font.svgFontSource).toContain('<font');
    expect(font.svgFontSource).toContain('IconCraftIcons');
  });
});

describe('Code Emitters', () => {
  const doc = parseSvg(SVG);

  it('React: generates valid TSX component', () => {
    const code = emitReact(doc, { componentName: 'ArrowRight' });
    expect(code).toContain('export const ArrowRight');
    expect(code).toContain('React.SVGProps');
    expect(code).toContain('viewBox="0 0 24 24"');
    expect(code).toContain('{...props}');
  });

  it('Angular: generates standalone component', () => {
    const code = emitAngular(doc, { componentName: 'ArrowRight' });
    expect(code).toContain('@Component');
    expect(code).toContain('standalone: true');
    expect(code).toContain('ArrowRightComponent');
  });

  it('Vue: generates SFC with script setup', () => {
    const code = emitVue(doc, { componentName: 'ArrowRight' });
    expect(code).toContain('<script setup lang="ts">');
    expect(code).toContain('<template>');
    expect(code).toContain('<style scoped>');
  });

  it('Swift: generates SwiftUI view', () => {
    const code = emitSwift(doc, { structName: 'ArrowRight' });
    expect(code).toContain('struct ArrowRight: View');
    expect(code).toContain('Canvas');
    expect(code).toContain('#Preview');
  });

  it('Compose: generates Composable function', () => {
    const code = emitCompose(doc, { functionName: 'ArrowRight' });
    expect(code).toContain('@Composable');
    expect(code).toContain('fun ArrowRight');
    expect(code).toContain('Canvas');
  });

  it('XAML: generates Viewbox resource', () => {
    const code = emitXaml(doc, { resourceKey: 'ArrowRight' });
    expect(code).toContain('x:Key="ArrowRight"');
    expect(code).toContain('<Path');
  });

  it('CSS Sprite: generates class with data URI', () => {
    const code = emitCssSprite(doc, { className: 'icon-arrow' });
    expect(code).toContain('.icon-arrow');
    expect(code).toContain('background-image: url("data:image/svg+xml,');
    expect(code).toContain('24px');
  });
});

describe('Bundle Packager', () => {
  it('generates a full bundle with SVG + React', () => {
    const doc = parseSvg(SVG);
    const bundle = generateBundle({
      iconName: 'arrow-right',
      doc,
      schema: MaterialSchema,
      frameworks: ['react'],
    });

    expect(bundle.iconName).toBe('arrow-right');
    expect(bundle.system).toBe('material');
    expect(bundle.files).toHaveLength(2); // SVG + React
    expect(bundle.files[0]!.filename).toBe('arrow-right.svg');
    expect(bundle.files[1]!.filename).toBe('ArrowRight.tsx');
  });

  it('generates multi-framework bundle', () => {
    const doc = parseSvg(SVG);
    const bundle = generateBundle({
      iconName: 'check',
      doc,
      schema: MaterialSchema,
      frameworks: ['react', 'angular', 'vue', 'swift', 'compose', 'xaml', 'css-sprite'],
      includeFont: true,
    });

    // SVG + 7 frameworks + font = 9 files
    expect(bundle.files).toHaveLength(9);
    expect(bundle.files.map((f) => f.type)).toContain('svg');
    expect(bundle.files.map((f) => f.type)).toContain('code');
    expect(bundle.files.map((f) => f.type)).toContain('font');
    expect(bundle.files.map((f) => f.type)).toContain('css');
  });
});
