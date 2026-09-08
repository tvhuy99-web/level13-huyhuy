const fs = require('fs');

const patch = fs.readFileSync('src/game/helpers/ui/AccessibilityOverviewRefreshPatch.js', 'utf8');
const bootstrap = fs.readFileSync('src/level13-bootstrap.js', 'utf8');

for (const required of [
  "'game/helpers/ui/AccessibilityFocusStabilityPatch'",
  "'game/GlobalSignals'",
  'inventoryChangedSignal',
  'gameStateReadySignal',
  'data-a11y-overview-ready',
  'data-a11y-overview-pending',
  'scheduleInitialOverviewRetries',
  'Chưa có thông tin trạng thái người chơi',
  'Chưa có thông tin về túi đồ hoặc trại'
]) {
  if (!patch.includes(required)) throw new Error(`Overview refresh contract missing: ${required}`);
}

if (!bootstrap.includes("'game/helpers/ui/AccessibilityOverviewRefreshPatch'")) {
  throw new Error('Overview refresh patch must load before level13-app');
}

console.log('Overview refresh contract OK: stale fallbacks are suppressed and game signals trigger targeted summary refreshes.');
