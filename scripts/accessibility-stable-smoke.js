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

const focusPatchPath = path.join(helperDir, 'AccessibilityFocusStabilityPatch.js');
if (!fs.existsSync(focusPatchPath)) throw new Error('TalkBack focus stability patch is missing');
const focusPatch = fs.readFileSync(focusPatchPath, 'utf8');
if (!focusPatch.includes("'game/helpers/ui/AccessibilityOverviewCleanupPatch'")) {
  throw new Error('Focus stability patch must load after the overview cleanup patch');
}
if (!focusPatch.includes("'game/helpers/ui/AccessibilityAutoScoutCoordinatesHelper'")) {
  throw new Error('Automatic sector scouting helper must be loaded with the stable accessibility patch');
}
if (!focusPatch.includes('if (summary.textContent !== label) summary.textContent = label;')) {
  throw new Error('Read-only summaries must not replace identical text nodes');
}
if (!focusPatch.includes('isGeneratedAccessibilityMutationTarget')) {
  throw new Error('Generated accessibility mutations must be ignored by the mobile observer');
}
if (!focusPatch.includes('hasInitializedHeaderOverviews') ||
    !focusPatch.includes('isRealtimeVisualHeaderMutationTarget') ||
    !focusPatch.includes('#mobile-header,#header-side,#grid-main-header') ||
    !focusPatch.includes('if (this.isRealtimeVisualHeaderMutationTarget(mutation.target)) continue;')) {
  throw new Error('Live visual-header mutations must not rebuild initialized TalkBack overviews');
}
if (!focusPatch.includes('playerText.indexOf("Player status.") >= 0') ||
    !focusPatch.includes('inventoryText.indexOf("Inventory.") >= 0')) {
  throw new Error('Header mutation filtering must wait until both TalkBack overviews are initialized');
}
const observerStart = focusPatch.indexOf('H.prototype.observe');
const observerBody = focusPatch.slice(observerStart);
if (!observerBody.includes('attributeFilter: ["class", "style", "hidden", "description"]')) {
  throw new Error('Mobile observer must be limited to game-state attributes');
}
for (const noisyAttr of ['aria-label', 'aria-describedby', 'aria-valuenow', 'aria-valuetext', '"role"']) {
  const filterLine = observerBody.match(/attributeFilter:\s*\[[^\]]*\]/);
  if (filterLine && filterLine[0].includes(noisyAttr)) throw new Error(`Observer must not watch helper-written attribute: ${noisyAttr}`);
}

for (const movementContract of [
  'table-out-actions-movement',
  'visibleDirectionCount',
  "button[action='build_out_camp']",
  'build a camp, enter it, then leave camp when ready to explore',
  'Direction buttons follow',
  'container-tab-two-out-actions'
]) {
  if (!focusPatch.includes(movementContract)) throw new Error(`Movement accessibility contract missing: ${movementContract}`);
}
if (focusPatch.includes('let move = this.visible(compass)')) {
  throw new Error('Movement availability must not be inferred from the scout-gated compass container');
}

const actionCalloutPath = path.join(helperDir, 'AccessibilityActionCalloutHelper.js');
const actionCallout = fs.readFileSync(actionCalloutPath, 'utf8');
for (const actionContract of [
  'updateActionButtonLabel',
  'data-a11y-action-base-label',
  'data-a11y-action-details',
  '.action-cost',
  '.action-description',
  '.action-effect-description',
  'Cost: ',
  'button.classList.contains("action-build")',
  'characterData: true',
  'attributeFilter: ["class", "style", "disabled"]'
]) {
  if (!actionCallout.includes(actionContract)) throw new Error(`Action detail accessibility contract missing: ${actionContract}`);
}
if (!actionCallout.includes('this.updateActionButtonLabel(button, callout);')) {
  throw new Error('Action callout helper must apply purpose and cost to the same button focus');
}

const autoScoutPath = path.join(helperDir, 'AccessibilityAutoScoutCoordinatesHelper.js');
if (!fs.existsSync(autoScoutPath)) throw new Error('Automatic sector scouting / coordinate helper is missing');
const autoScout = fs.readFileSync(autoScoutPath, 'utf8');
for (const autoScoutContract of [
  'autoPressScout',
  'checkAvailability("scout", false, sector)',
  'actions.startAction("scout")',
  'accessibility-location-coordinates',
  'Vị trí. Tầng ',
  'data-a11y-summary-key", "location-coordinates',
  'summary.textContent !== text',
  'formatCoordinate',
  'playerLocationChangedSignal',
  'playerMoveCompletedSignal',
  'featureUnlockedSignal',
  'visionChangedSignal',
  'actionCompletedSignal',
  '#out-action-scout{display:none !important;}'
]) {
  if (!autoScout.includes(autoScoutContract)) throw new Error(`Automatic scouting/coordinates contract missing: ${autoScoutContract}`);
}
if (autoScout.includes('sectorStatus.scouted = true') || autoScout.includes('GlobalSignals.sectorScoutedSignal.dispatch(sector)')) {
  throw new Error('Automatic scouting must not reimplement Scout state changes; it must execute the original action');
}
if (autoScout.includes('unlockFeature("evidence")') || autoScout.includes('unlockFeature("scout")')) {
  throw new Error('Automatic scouting must leave feature unlocks to the original Scout action');
}
if (autoScout.includes('setAttribute("role", "status")') || autoScout.includes('setAttribute("aria-live"')) {
  throw new Error('Coordinates must be stable browse text, not a live region that can steal TalkBack attention');
}

console.log(`Stable accessibility wiring OK: ${helpers.length} helpers, stable TalkBack overviews, action details, original-action automatic scouting, coordinates, and movement guidance present.`);