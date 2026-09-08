const fs = require('fs');
const path = require('path');

const root = process.cwd();
const helperPath = path.join(root, 'src/game/helpers/ui/AccessibilityMovementPositionHelper.js');
const bootstrapPath = path.join(root, 'src/level13-bootstrap.js');
const helper = fs.readFileSync(helperPath, 'utf8');
const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');

for (const required of [
  'Trạng thái vị trí.',
  'Có thể đi.',
  'Tạm thời không đi được.',
  'Không đi được.',
  'Hướng bị chặn, không đi được:',
  'data-a11y-movement-state',
  'btn-disabled-reason',
  'buttonStateChangedSignal',
  'playerLocationChangedSignal',
  'playerMoveCompletedSignal',
  'movementBlockerClearedSignal'
]) {
  if (!helper.includes(required)) throw new Error(`Movement position warning contract missing: ${required}`);
}

if (!bootstrap.includes("'game/helpers/ui/AccessibilityMovementPositionHelper'")) {
  throw new Error('Movement position helper is not loaded by bootstrap');
}
if (!bootstrap.includes('new AccessibilityMovementPositionHelper()')) {
  throw new Error('Movement position helper is not started independently by bootstrap');
}

console.log('Movement position warning contract OK: independent helper restores available, temporary, and blocked direction feedback.');
