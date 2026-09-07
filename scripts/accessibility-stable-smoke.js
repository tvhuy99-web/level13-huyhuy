const fs = require('fs');
const path = require('path');

const root = process.cwd();
const initializerPath = path.join(root, 'src/game/GameGlobalsInitializer.js');
const initializer = fs.readFileSync(initializerPath, 'utf8');
const helperDir = path.join(root, 'src/game/helpers/ui');
const helpers = fs.readdirSync(helperDir).filter(name => /^Accessibility.*\.js$/.test(name));

if (helpers.length < 19) {
  throw new Error(`Expected at least 19 accessibility helpers, found ${helpers.length}`);
}

for (const helper of helpers) {
  const moduleId = `game/helpers/ui/${helper.replace(/\.js$/, '')}`;
  if (!initializer.includes(`'${moduleId}'`)) {
    throw new Error(`Accessibility helper is not wired in initializer: ${moduleId}`);
  }
}

if (!initializer.includes('init: function (engine)')) {
  throw new Error('Stable initializer signature was not preserved');
}
if (initializer.includes("'game/WorldState'")) {
  throw new Error('Development-only WorldState dependency leaked into stable initializer');
}

const sourceFiles = [initializerPath, ...helpers.map(name => path.join(helperDir, name))];
const missing = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/define\s*\(\s*\[([\s\S]*?)\]\s*,/);
  if (!match) continue;
  const deps = [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (const dep of deps) {
    if (!/^(game|text|utils|worldcreator)\//.test(dep)) continue;
    const target = path.join(root, 'src', `${dep}.js`);
    if (!fs.existsSync(target)) missing.push(`${path.relative(root, file)} -> ${dep}`);
  }
}
if (missing.length) {
  throw new Error(`Missing AMD dependencies on stable base:\n${missing.join('\n')}`);
}

console.log(`Stable accessibility wiring OK: ${helpers.length} helpers, dependencies present.`);
