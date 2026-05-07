/**
 * Workbench HTML Generator — Generates the interactive UI for Claude Artifacts.
 * PRD §4C: The Workbench Hybrid.
 */

import type { SvgDocument } from '../engine/types.js';
import type { SystemScore, SystemSchema } from '../schemas/schema-types.js';
import { exportSvg } from '../exporters/svg-exporter.js';

export function generateWorkbenchHtml(
  results: Record<string, { svgDoc: SvgDocument; score: SystemScore; schema: SystemSchema }>,
  iconName: string,
): string {
  // Extract default data (Material)
  const defaultKey = 'material';
  const defaultResult = results[defaultKey]!;
  
  // Serialize SVGs for JS injection
  const jsData = Object.entries(results).reduce((acc, [key, data]) => {
    acc[key] = {
      svg: exportSvg(data.svgDoc, { minify: false }),
      score: data.score,
      schema: data.schema,
    };
    return acc;
  }, {} as any);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IconCraft Workbench - ${iconName}</title>
  <style>
    :root {
      --bg: #121212;
      --panel: #1e1e1e;
      --text: #e0e0e0;
      --accent: #bb86fc;
      --border: #333;
      --success: #03dac6;
      --warning: #ffb74d;
      --danger: #cf6679;
    }
    body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    header {
      padding: 0 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--panel);
      height: 60px;
    }
    h1 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    
    .tabs {
      display: flex;
      height: 100%;
      gap: 16px;
    }
    .tab {
      background: none;
      border: none;
      color: #888;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      height: 100%;
      border-bottom: 2px solid transparent;
      padding: 0 8px;
    }
    .tab.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .tab:hover:not(.active) { color: var(--text); }

    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .canvas-area {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #0f0f0f;
      position: relative;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
      pointer-events: none;
    }
    .icon-wrapper {
      position: relative;
      width: 240px;
      height: 240px;
      color: white;
    }
    .icon-wrapper svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .sidebar {
      width: 320px;
      background: var(--panel);
      border-left: 1px solid var(--border);
      padding: 24px;
      overflow-y: auto;
    }
    .score-card {
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      border: 1px solid var(--border);
    }
    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;
    }
    .score-header h3 { margin: 0; font-size: 1rem; }
    .score-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.85rem;
      color: #aaa;
    }
    .metric-val { color: var(--text); font-weight: 500; }
    
    .panel-section { margin-bottom: 24px; }
    .panel-section h4 { margin: 0 0 12px 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; }
    
    .btn {
      display: block;
      width: 100%;
      padding: 12px;
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      margin-top: 8px;
    }
    .btn:hover { opacity: 0.9; }
    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); }

    pre {
      background: #000;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.75rem;
      color: #a9b7c6;
    }
  </style>
</head>
<body>
  <header>
    <h1>IconCraft</h1>
    <div class="tabs">
      <button class="tab active" onclick="switchTab('material')">Material</button>
      <button class="tab" onclick="switchTab('ios')">iOS (SF)</button>
      <button class="tab" onclick="switchTab('fluent')">Fluent</button>
    </div>
  </header>
  
  <div class="layout">
    <div class="canvas-area">
      <div id="grid-bg" class="grid-bg"></div>
      <div class="icon-wrapper" id="svg-container"></div>
    </div>
    
    <div class="sidebar">
      <div class="score-card">
        <div class="score-header">
          <h3>System Score</h3>
          <span class="score-value" id="val-overall"></span>
        </div>
        <div class="metric"><span>Grid Compliance</span> <span class="metric-val" id="val-grid"></span></div>
        <div class="metric"><span>Stroke Fidelity</span> <span class="metric-val" id="val-stroke"></span></div>
        <div class="metric"><span>Padding/Safezone</span> <span class="metric-val" id="val-padding"></span></div>
        <div class="metric"><span>Pixel Perfect</span> <span class="metric-val" id="val-pixel"></span></div>
      </div>

      <div class="panel-section">
        <h4>Specs</h4>
        <div class="metric"><span>Size</span> <span class="metric-val" id="val-size"></span></div>
        <div class="metric"><span>Stroke</span> <span class="metric-val" id="val-sw"></span></div>
        <div class="metric"><span>Corners</span> <span class="metric-val" id="val-corners"></span></div>
      </div>
      
      <div class="panel-section">
        <h4>Actions</h4>
        <button class="btn" onclick="alert('In the full version, this connects to the Headless Dashboard via Stripe.')">
          Buy Package ($2.99)
        </button>
        <button class="btn btn-secondary" onclick="toggleCode()">
          Toggle SVG Code
        </button>
      </div>

      <pre id="code" style="display: none;"></pre>
    </div>
  </div>

  <script>
    const stateData = ${JSON.stringify(jsData)};
    
    function updateColor(score) {
      if (score >= 90) return 'var(--success)';
      if (score >= 70) return 'var(--warning)';
      return 'var(--danger)';
    }

    function switchTab(systemKey) {
      // Update active tab styles
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.currentTarget.classList.add('active');

      const data = stateData[systemKey];
      
      // Update SVG
      document.getElementById('svg-container').innerHTML = data.svg;
      
      // Update Grid Background size
      document.getElementById('grid-bg').style.backgroundSize = \`\${data.schema.grid.width}px \${data.schema.grid.height}px\`;

      // Update Score
      const ov = document.getElementById('val-overall');
      ov.innerText = data.score.overall + '%';
      ov.style.color = updateColor(data.score.overall);
      
      document.getElementById('val-grid').innerText = data.score.grid + '%';
      document.getElementById('val-stroke').innerText = data.score.stroke + '%';
      document.getElementById('val-padding').innerText = data.score.padding + '%';
      document.getElementById('val-pixel').innerText = data.score.pixelPerfect + '%';

      // Update Specs
      document.getElementById('val-size').innerText = \`\${data.schema.grid.width}x\${data.schema.grid.height}px\`;
      document.getElementById('val-sw').innerText = data.schema.stroke.default + 'px';
      document.getElementById('val-corners').innerText = data.schema.corner.style;

      // Update Code Snippet
      document.getElementById('code').innerText = data.svg;
    }

    function toggleCode() {
      const code = document.getElementById('code');
      code.style.display = code.style.display === 'none' ? 'block' : 'none';
    }

    // Initialize with default
    // We mock an event target to reuse the switchTab logic
    window.onload = () => {
      const firstTab = document.querySelector('.tab');
      if (firstTab) {
        firstTab.click();
      }
    };
  </script>
</body>
</html>
`;
}
