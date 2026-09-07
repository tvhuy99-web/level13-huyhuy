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
for (const required of [
  'data-a11y-summary',
  'accessibility-compact-summary',
  'Status effects.',
  'Player status',
  'data-a11y-layout-inactive',
  'setInert',
  'header-side',
  'grid-main-header',
  'player-perks-list-regular',
  'container-equipment-stats',
  'accessibility-movement-status',
  'Choose Scout',
  't.removeAttribute("tabindex")'
]) {
  if (!mobileHelper.includes(required)) {
    throw new Error(`TalkBack accessibility regression contract missing: ${required}`);
  }
}

if (mobileHelper.includes('setAttribute("role", "note")') || mobileHelper.includes("setAttribute('role', 'note')")) {
  throw new Error('Accessibility code must not create note-only swipe stops');
}

// The new model intentionally migrates old data-a11y-compact nodes, but it must
// never create a new generic focus stop for a read-only summary.
const setSummaryStart = mobileHelper.indexOf('H.prototype.setReadOnlySummary');
const setSummaryEnd = mobileHelper.indexOf('H.prototype.clearReadOnlySummary');
const setSummaryBody = mobileHelper.slice(setSummaryStart, setSummaryEnd);
if (setSummaryBody.includes('setAttribute("tabindex", "0")') || setSummaryBody.includes("setAttribute('tabindex', '0')")) {
  throw new Error('Read-only summaries must not use tabindex=0');
}
if (!setSummaryBody.includes('summary.textContent = label')) {
  throw new Error('Read-only summaries must expose real text content');
}
if (!setSummaryBody.includes('summary.removeAttribute("aria-label")')) {
  throw new Error('Read-only summaries must not depend on synthetic aria-label text');
}

console.log(`Stable accessibility wiring OK: ${helpers.length} helpers, real-text TalkBack summary contract present.`);
