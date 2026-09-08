const fs = require('fs');
const path = require('path');

const root = process.cwd();
const initializerPath = path.join(root, 'src/game/GameGlobalsInitializer.js');
const initializer = fs.readFileSync(initializerPath, 'utf8');
const bootstrapPath = path.join(root, 'src/level13-bootstrap.js');
const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
const configPaths = [path.join(root, 'src/config.js'), path.join(root, 'src/config-vi.js')];
const configContents = configPaths.filter(fs.existsSync).map(file => fs.readFileSync(file, 'utf8'));
const helperDir = path.join(root, 'src/game/helpers/ui');
const helpers = fs.readdirSync(helperDir).filter(name => /^Accessibility.*\.js$/.test(name));
const helperContents = helpers.map(name => ({ name, content: fs.readFileSync(path.join(helperDir, name), 'utf8') }));

if (helpers.length < 20) throw new Error(`Expected at least 20 accessibility helpers, found ${helpers.length}`);

for (const helper of helpers) {
  const moduleId = `game/helpers/ui/${helper.replace(/\.js$/, '')}`;
  const wiredDirectly = initializer.includes(`'${moduleId}'`);
  const wiredThroughHelper = helperContents.some(entry => entry.name !== helper && entry.content.includes(`'${moduleId}'`));
  const wiredThroughConfig = configContents.some(content => content.includes(`'${moduleId}'`) || content.includes(`\"${moduleId}\"`));
  const wiredThroughBootstrap = bootstrap.includes(`'${moduleId}'`) || bootstrap.includes(`\"${moduleId}\"`);
  if (!wiredDirectly && !wiredThroughHelper && !wiredThroughConfig && !wiredThroughBootstrap) throw new Error(`Accessibility helper is not wired: ${moduleId}`);
}

if (!initializer.includes('init: function (engine, gameManager, headless)')) {
  throw new Error('Master initializer signature was not preserved');
}
if (!initializer.includes("'game/WorldState'") || !initializer.includes("'game/helpers/WorldHelper'")) {
  throw new Error('Master world-state dependencies were not preserved');
}
if (!initializer.includes('if (!headless)')) {
  throw new Error('Accessibility/UI initialization must stay out of headless mode');
}

const sourceFiles = [initializerPath, bootstrapPath, ...helpers.map(name => path.join(helperDir, name))];
const missing = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/define\s*\(\s*\[([\s\S]*?)\]\s*,/);
  if (!match) continue;
  const deps = [...match[1].matchAll(/['\"]([^'\"]+)['\"]/g)].map(m => m[1]);
  for (const dep of deps) {
    if (!/^(game|text|utils|worldcreator)\//.test(dep)) continue;
    const target = path.join(root, 'src', `${dep}.js`);
    if (!fs.existsSync(target)) missing.push(`${path.relative(root, file)} -> ${dep}`);
  }
}
if (missing.length) throw new Error(`Missing AMD dependencies on master:\n${missing.join('\n')}`);

const mobileHelper = fs.readFileSync(path.join(helperDir, 'AccessibilityMobileExperienceHelper.js'), 'utf8');
for (const required of [
  ['accessibility-player-overview'],
  ['accessibility-inventory-camp-overview'],
  ['Player overview.', 'Tổng quan người chơi.'],
  ['Inventory and camp overview.', 'Tổng quan túi đồ và trại.'],
  ['Player status.', 'Trạng thái người chơi.'],
  ['Inventory.', 'Túi đồ.'],
  ['suppressVisualHeaders'],
  ['accessibility-movement-status']
]) {
  if (!required.some(value => mobileHelper.includes(value))) {
    throw new Error(`TalkBack accessibility regression contract missing: ${required.join(' or ')}`);
  }
}

const focusPatch = fs.readFileSync(path.join(helperDir, 'AccessibilityFocusStabilityPatch.js'), 'utf8');
for (const required of [
  "'game/helpers/ui/AccessibilityOverviewCleanupPatch'",
  "'game/helpers/ui/AccessibilityAutoScoutCoordinatesHelper'",
  'isRealtimeVisualHeaderMutationTarget',
  'accessibility-movement-status'
]) {
  if (!focusPatch.includes(required)) throw new Error(`Focus/movement accessibility contract missing: ${required}`);
}

const autoScout = fs.readFileSync(path.join(helperDir, 'AccessibilityAutoScoutCoordinatesHelper.js'), 'utf8');
for (const required of [
  'autoPressScout',
  'autoScoutAttempted',
  'checkAvailability("scout", false, sector)',
  'actions.startAction("scout")',
  'accessibility-location-coordinates',
  'Vị trí. Tầng '
]) {
  if (!autoScout.includes(required)) throw new Error(`Auto-scout/coordinates contract missing: ${required}`);
}
if (autoScout.includes('sectorStatus.scouted = true')) {
  throw new Error('Auto-scout must execute the original Scout action instead of reimplementing it');
}

const actionCallout = fs.readFileSync(path.join(helperDir, 'AccessibilityActionCalloutHelper.js'), 'utf8');
for (const required of [
  'updateActionButtonLabel',
  'data-a11y-action-base-label',
  '.btn-disabled-reason',
  'data-a11y-disabled-proxy',
  'aria-live'
]) {
  if (!actionCallout.includes(required)) throw new Error(`Disabled-action feedback contract missing: ${required}`);
}

const directError = fs.readFileSync(path.join(helperDir, 'AccessibilityDirectErrorPopupHelper.js'), 'utf8');
for (const required of [
  'Level13.prototype.handleException',
  'showQuestionPopup',
  'Chi tiết kỹ thuật.',
  '__level13LastDetailedError',
  'Ngăn xếp:'
]) {
  if (!directError.includes(required)) throw new Error(`Direct fatal-error detail contract missing: ${required}`);
}
if (!bootstrap.includes("'game/helpers/ui/AccessibilityDirectErrorPopupHelper'")) {
  throw new Error('Direct fatal-error popup patch must load before level13-app');
}

console.log(`Master accessibility wiring OK: ${helpers.length} helpers, master 0.7.x initializer preserved, TalkBack summaries, movement, auto-scout, direct detailed errors, and disabled-action feedback present.`);
