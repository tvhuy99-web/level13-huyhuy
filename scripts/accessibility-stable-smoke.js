const fs = require('fs');
const path = require('path');

const root = process.cwd();
const initializerPath = path.join(root, 'src/game/GameGlobalsInitializer.js');
const initializer = fs.readFileSync(initializerPath, 'utf8');
const helperDir = path.join(root, 'src/game/helpers/ui');
const helpers = fs.readdirSync(helperDir).filter(name => /^Accessibility.*\.js$/.test(name));
const helperContents = helpers.map(name => ({ name, content: fs.readFileSync(path.join(helperDir, name), 'utf8') }));

if (helpers.length < 20) throw new Error(`Expected at least 20 accessibility helpers, found ${helpers.length}`);

for (const helper of helpers) {
  const moduleId = `game/helpers/ui/${helper.replace(/\.js$/, '')}`;
  const wiredDirectly = initializer.includes(`'${moduleId}'`);
  const wiredThroughHelper = helperContents.some(entry => entry.name !== helper && entry.content.includes(`'${moduleId}'`));
  if (!wiredDirectly && !wiredThroughHelper) throw new Error(`Accessibility helper is not wired: ${moduleId}`);
}

if (!initializer.includes('init: function (engine)')) throw new Error('Stable initializer signature was not preserved');
if (initializer.includes("'game/WorldState'")) throw new Error('Development-only WorldState dependency leaked into stable initializer');

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
if (missing.length) throw new Error(`Missing AMD dependencies on stable base:\n${missing.join('\n')}`);

const mobileHelper = fs.readFileSync(path.join(helperDir, 'AccessibilityMobileExperienceHelper.js'), 'utf8');
for (const required of [
  'accessibility-player-overview',
  'accessibility-inventory-camp-overview',
  'Player overview.',
  'Inventory and camp overview.',
  'Player status.',
  'Status effects.',
  'Inventory.',
  'suppressVisualHeaders',
  'data-a11y-header-visual',
  'mobile-header',
  'header-side',
  'grid-main-header',
  'setInert',
  'accessibility-movement-status',
  'Choose Scout',
  'removeAttribute("tabindex")'
]) {
  if (!mobileHelper.includes(required)) throw new Error(`TalkBack accessibility regression contract missing: ${required}`);
}

if (mobileHelper.includes('setAttribute("role", "note")') || mobileHelper.includes("setAttribute('role', 'note')")) {
  throw new Error('Accessibility code must not create note-only swipe stops');
}

const overviewStart = mobileHelper.indexOf('H.prototype.renderHeaderOverview');
const overviewEnd = mobileHelper.indexOf('H.prototype.statusText');
const overviewBody = mobileHelper.slice(overviewStart, overviewEnd);
if (!overviewBody.includes('summary.textContent = "Player overview. "')) throw new Error('Player overview must expose real text content');
if (!overviewBody.includes('inventorySummary.textContent = "Inventory and camp overview. "')) throw new Error('Inventory and camp overview must expose real text content');
if (overviewBody.includes('setAttribute("tabindex", "0")') || overviewBody.includes("setAttribute('tabindex', '0')")) throw new Error('Header overviews must not use tabindex=0');
if (!overviewBody.includes('summaries[i].removeAttribute("aria-label")')) throw new Error('Header overviews must not depend on aria-label');
if (overviewBody.indexOf('let inventoryParts = []') < overviewBody.indexOf('Equipment stats.')) throw new Error('Inventory split must occur after equipment stats');

const suppressStart = mobileHelper.indexOf('H.prototype.suppressHeader');
const suppressEnd = mobileHelper.indexOf('H.prototype.renderHeaderOverview');
const suppressBody = mobileHelper.slice(suppressStart, suppressEnd);
if (!suppressBody.includes('setAttribute("aria-hidden", "true")') || !suppressBody.includes('setInert(root, true)')) {
  throw new Error('Visual headers must be aria-hidden and inert');
}

console.log(`Stable accessibility wiring OK: ${helpers.length} helpers, two real-text header overview contract present.`);
