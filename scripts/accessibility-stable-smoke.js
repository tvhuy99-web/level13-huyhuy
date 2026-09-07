const fs = require('fs');
const path = require('path');

const root = process.cwd();
const initializerPath = path.join(root, 'src/game/GameGlobalsInitializer.js');
const initializer = fs.readFileSync(initializerPath, 'utf8');
const helperDir = path.join(root, 'src/game/helpers/ui');
const helpers = fs.readdirSync(helperDir).filter(name => /^Accessibility.*\.js$/.test(name));
const helperContents = helpers.map(name => ({
  name,
  content: fs.readFileSync(path.join(helperDir, name), 'utf8'),
}));

if (helpers.length < 20) {
  throw new Error(`Expected at least 20 accessibility helpers, found ${helpers.length}`);
}

for (const helper of helpers) {
  const moduleId = `game/helpers/ui/${helper.replace(/\.js$/, '')}`;
  const wiredDirectly = initializer.includes(`'${moduleId}'`);
  const wiredThroughHelper = helperContents.some(entry => entry.name !== helper && entry.content.includes(`'${moduleId}'`));
  if (!wiredDirectly && !wiredThroughHelper) {
    throw new Error(`Accessibility helper is not wired: ${moduleId}`);
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

const mobileHelper = fs.readFileSync(path.join(helperDir, 'AccessibilityMobileExperienceHelper.js'), 'utf8');
for (const required of ['data-a11y-compact', 'Status effects.', 'Player status', 'accessibility-movement-status', 'Choose Scout', 't.removeAttribute("tabindex")', 'aria-hidden']) {
  if (!mobileHelper.includes(required)) throw new Error(`Mobile accessibility regression contract missing: ${required}`);
}
if (mobileHelper.includes('setAttribute("role", "note")') || mobileHelper.includes("setAttribute('role', 'note')")) {
  throw new Error('Compact focus model must not create note-only swipe stops');
}

console.log(`Stable accessibility wiring OK: ${helpers.length} helpers, dependencies present, compact focus contract present.`);
