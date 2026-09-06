const fs = require('fs');

const failures = [];

function read(path) {
	try {
		return fs.readFileSync(path, 'utf8');
	} catch (error) {
		failures.push(`Cannot read ${path}: ${error.message}`);
		return '';
	}
}

function requireMatch(path, source, pattern, description) {
	if (!pattern.test(source)) failures.push(`${path}: missing ${description}`);
}

const indexPath = 'index.html';
const index = read(indexPath);
requireMatch(indexPath, index, /id=["']btn-settings["']/, 'Settings opener');
requireMatch(indexPath, index, /id=["']settings-popup["'][^>]*role=["']dialog["']|role=["']dialog["'][^>]*id=["']settings-popup["']/, 'Settings dialog semantics');
requireMatch(indexPath, index, /id=["']settings-checkbox-sfx-enabled["']/, 'sound setting');
requireMatch(indexPath, index, /id=["']settings-checkbox-hotkeys-enabled["']/, 'hotkey setting');
requireMatch(indexPath, index, /id=["']settings-checkbox-hotkeys-numpad["']/, 'numpad setting');
requireMatch(indexPath, index, /id=["']language-dropdown["']/, 'language selector');
requireMatch(indexPath, index, /id=["']common-popup["'][^>]*role=["']dialog["']|role=["']dialog["'][^>]*id=["']common-popup["']/, 'common popup dialog semantics');
requireMatch(indexPath, index, /id=["']common-popup-header["']/, 'common popup title');
requireMatch(indexPath, index, /id=["']common-popup-desc["']/, 'common popup description');
requireMatch(indexPath, index, /id=["']common-popup-input-container["']/, 'common popup input container');

const popupPath = 'src/game/helpers/ui/AccessibilityPopupHelper.js';
const popup = read(popupPath);
requireMatch(popupPath, popup, /captureExternalInteractions/, 'opener interaction capture');
requireMatch(popupPath, popup, /lastExternalInteraction/, 'fallback opener memory');
requireMatch(popupPath, popup, /bindFocusTrap/, 'focus trap');
requireMatch(popupPath, popup, /event\.key\s*!==\s*["']Tab["']/, 'Tab trapping');
requireMatch(popupPath, popup, /getPreferredInitialFocus/, 'preferred initial focus');
requireMatch(popupPath, popup, /popup\.id\s*===\s*["']common-popup["']/, 'common input preferred focus');
requireMatch(popupPath, popup, /popup\.id\s*===\s*["']settings-popup["']/, 'Settings preferred focus');
requireMatch(popupPath, popup, /restoreFocus/, 'focus restoration');
requireMatch(popupPath, popup, /aria-modal/, 'modal semantics');
requireMatch(popupPath, popup, /aria-describedby/, 'popup field description association');

const b2Path = 'src/game/helpers/ui/AccessibilityB2Helper.js';
const b2 = read(b2Path);
requireMatch(b2Path, b2, /Enable sounds/, 'explicit sound checkbox name');
requireMatch(b2Path, b2, /Enable hotkeys/, 'explicit hotkey checkbox name');
requireMatch(b2Path, b2, /Use Numpad for movement/, 'explicit numpad checkbox name');
requireMatch(b2Path, b2, /Language/, 'language selector name');
requireMatch(b2Path, b2, /aria-invalid/, 'invalid input state');
requireMatch(b2Path, b2, /Input was not accepted/, 'invalid input announcement');
requireMatch(b2Path, b2, /input\.focus\(\)/, 'invalid input focus return');
requireMatch(b2Path, b2, /announceAssertive/, 'assertive invalid-input feedback');

const uiPath = 'src/game/UIFunctions.js';
const ui = read(uiPath);
requireMatch(uiPath, ui, /showSpecialPopup\(["']settings-popup["']/, 'Settings popup opening path');
requireMatch(uiPath, ui, /showInput:\s*function/, 'common input popup API');
requireMatch(uiPath, ui, /popupManager\.showPopup\(title, msg, ["']Confirm["']/, 'input popup Confirm action');
requireMatch(uiPath, ui, /toggle\(["']#common-popup-input-container["'],\s*true\)/, 'input field visibility');

const popupManagerPath = 'src/game/helpers/ui/UIPopupManager.js';
const popupManager = read(popupManagerPath);
requireMatch(popupManagerPath, popupManager, /hidden-by-popups[^\n]*aria-hidden|aria-hidden[^\n]*hidden-by-popups/, 'background aria hiding while popup open');
requireMatch(popupManagerPath, popupManager, /hidden-by-popups[^\n]*inert|inert[^\n]*hidden-by-popups/, 'background inert while popup open');

const initializerPath = 'src/game/GameGlobalsInitializer.js';
const initializer = read(initializerPath);
requireMatch(initializerPath, initializer, /game\/helpers\/ui\/AccessibilityB2Helper/, 'B2 helper RequireJS dependency');
requireMatch(initializerPath, initializer, /new AccessibilityB2Helper\(GameGlobals\.accessibilityHelper\)/, 'B2 helper initialization');

if (failures.length > 0) {
	console.error('B2 accessibility source-contract check failed:');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log('B2 accessibility source-contract check passed.');
console.log('Covered path: Settings dialog and common input popup with labelled controls, preferred focus, focus trap, invalid-input recovery, and opener restoration.');
