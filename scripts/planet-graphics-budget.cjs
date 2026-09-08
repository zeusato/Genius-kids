// Static geometry accounting, not an FPS/GPU benchmark. Uses the installed compiler.
const fs = require('fs');
const ts = require('typescript');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => {
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } });
    module._compile(result.outputText, filename);
};
const { BUILDINGS, createRegion } = require('../src/components/planetmaker/engine/region.ts');
const { environmentInstances } = require('../src/components/planetmaker/rendering/environment.ts');
const { buildingInstances } = require('../src/components/planetmaker/rendering/architecture.ts');
const { vehicleParts } = require('../src/components/planetmaker/rendering/vehicleModels.ts');
const { shapeGeometry } = require('../src/components/planetmaker/rendering/Instances.tsx');
const weights = Object.fromEntries(['box', 'cone', 'sphere', 'cylinder', 'gable'].map(shape => {
    const g = shapeGeometry(shape), triangles = (g.index ? g.index.count : g.getAttribute('position').count) / 3; g.dispose(); return [shape, triangles];
}));
const count = parts => Object.entries(parts).reduce((n, [shape, items]) => n + weights[shape] * items.length, 0);
const types = Object.keys(BUILDINGS);
let buildings = 200 * weights.box; // port markers
for (let i = 0; i < 200; i++) buildings += count(buildingInstances({ id: 'sample', type: types[i % types.length], x: 10, z: 10, foundation: 1, yaw: i % 4, color: '#d5b483', floors: 1, style: i % 3, roof: i % 3 }));
const report = [];
for (const [trees, roads, cars] of [[1000, 300, 8], [5000, 4096, 24]]) {
    const r = createRegion('meadow', 42); r.height.fill(1); r.roads.fill(1, 0, roads);
    // Independent component budget: these density maxima need not fit together with buildings.
    r.trees = Array.from({ length: trees }, (_, i) => ({ id: i + 1, x: i % 60 + .5, z: Math.floor(i / 60) % 60 + .5, scale: 1 }));
    const vehicles = Array.from({ length: cars }, (_, i) => count(vehicleParts(i % 6))).reduce((a, b) => a + b, 0);
    for (const quality of ['light', 'balanced', 'detailed']) {
        const scenery = environmentInstances(r, quality), environment = count(scenery);
        report.push({ trees, roads, cars, quality, environmentTriangles: environment, buildingTriangles: buildings, vehicleTriangles: vehicles, mainPassTriangles: 32768 + 14 + buildings + vehicles + environment + 48 * 116, environmentBatches: Object.values(scenery).filter(v => v.length).length });
    }
}
console.log(JSON.stringify({ geometryTriangles: weights, assumptions: '200 mixed single-floor buildings, 48 pedestrians; no culling, shadows or preview; independent component upper bounds, not a playable benchmark scene', report }, null, 2));
