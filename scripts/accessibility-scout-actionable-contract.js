const fs = require('fs');

const patch = fs.readFileSync('src/game/helpers/ui/AccessibilityScoutActionablePatch.js', 'utf8');
const bootstrap = fs.readFileSync('src/level13-bootstrap.js', 'utf8');

for (const required of [
  "AccessibilityActionCalloutHelper",
  "sectorScoutedSignal",
  "playerLocationChangedSignal",
  "updateButtonsSignal.dispatch()",
  "action !== \"scout\"",
  "data-a11y-scout-actionable",
  "buttonContainer.removeAttribute(\"aria-disabled\")",
  "button.removeAttribute(\"aria-disabled\")"
]) {
  if (!patch.includes(required)) throw new Error(`Scout actionable contract missing: ${required}`);
}

if (!bootstrap.includes("'game/helpers/ui/AccessibilityScoutActionablePatch'")) {
  throw new Error('Scout actionable patch must load before level13-app');
}

console.log('Scout actionable contract OK: Scout remains activatable to TalkBack and sector scouting refreshes dependent buttons.');
