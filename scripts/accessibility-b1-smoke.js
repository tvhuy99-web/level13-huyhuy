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
	if (!pattern.test(source)) {
		failures.push(`${path}: missing ${description}`);
	}
}

const indexPath = 'index.html';
const index = read(indexPath);
requireMatch(indexPath, index, /id=["']switch-out["']/, 'Explore tab');
requireMatch(indexPath, index, /id=["']out-action-sca["'][^>]*action=["']scavenge["']|action=["']scavenge["'][^>]*id=["']out-action-sca["']/, 'native Scavenge action');
requireMatch(indexPath, index, /id=["']switch-bag["']/, 'Inventory tab');
requireMatch(indexPath, index, /id=["']switch-map["']/, 'Map tab');
requireMatch(indexPath, index, /id=["']bag-items["']/, 'inventory item container');
requireMatch(indexPath, index, /id=["']container-equipment-slots["']/, 'equipment slot container');
requireMatch(indexPath, index, /id=["']mainmap-overlay["']/, 'map overlay');

const accessibilityPath = 'src/game/helpers/ui/AccessibilityHelper.js';
const accessibility = read(accessibilityPath);
requireMatch(accessibilityPath, accessibility, /setAttribute\(["']role["'],\s*["']tablist["']\)/, 'tablist semantics');
requireMatch(accessibilityPath, accessibility, /setAttribute\(["']role["'],\s*["']tab["']\)/, 'tab semantics');
requireMatch(accessibilityPath, accessibility, /setAttribute\(["']role["'],\s*["']tabpanel["']\)/, 'tabpanel semantics');
requireMatch(accessibilityPath, accessibility, /bindCalloutFocusBehavior/, 'focus-driven info callouts');

const mapPath = 'src/game/helpers/ui/AccessibilityMapHelper.js';
const map = read(mapPath);
requireMatch(mapPath, map, /setAttribute\(["']role["'],\s*["']button["']\)/, 'sector button role');
requireMatch(mapPath, map, /setAttribute\(["']tabindex["'],\s*["']0["']\)/, 'keyboard-focusable sectors');
requireMatch(mapPath, map, /aria-pressed/, 'selected sector state');
requireMatch(mapPath, map, /event\.key\s*!==\s*["']Enter["']\s*&&\s*event\.key\s*!==\s*["'] ["']/, 'Enter/Space sector activation');

const b1Path = 'src/game/helpers/ui/AccessibilityB1Helper.js';
const b1 = read(b1Path);
requireMatch(b1Path, b1, /addEventListener\(["']focusin["']/, 'focus tracking');
requireMatch(b1Path, b1, /\.item-bag-options button\.action/, 'inventory callout action tracking');
requireMatch(b1Path, b1, /\^\(equip_\|unequip_\)/, 'Equip/Unequip focus restoration trigger');
requireMatch(b1Path, b1, /updateButtonDisabledState/, 'focus-time item action state refresh');
requireMatch(b1Path, b1, /queueInventoryFocusRestore/, 'inventory focus restoration');
requireMatch(b1Path, b1, /queueSectorFocusRestore/, 'sector focus restoration');
requireMatch(b1Path, b1, /\.map-overlay-cell/, 'map sector focus tracking');
requireMatch(b1Path, b1, /isFocusLost/, 'non-invasive focus restoration guard');

const uiConstantsPath = 'src/game/constants/UIConstants.js';
const uiConstants = read(uiConstantsPath);
requireMatch(uiConstantsPath, uiConstants, /action\s*=\s*["']equip_["']\s*\+\s*item\.itemID/, 'Equip action generation');
requireMatch(uiConstantsPath, uiConstants, /action\s*=\s*["']unequip_["']\s*\+\s*item\.id/, 'Unequip action generation');

const bagPath = 'src/game/systems/ui/UIOutBagSystem.js';
const bag = read(bagPath);
requireMatch(bagPath, bag, /generateInfoCallouts\(["']#bag-items["']\)/, 'inventory info callout generation');
requireMatch(bagPath, bag, /createButtons\(["']#bag-items["']\)/, 'inventory callout action binding');
requireMatch(bagPath, bag, /updateItemComparisonIndicators/, 'inventory comparison state updates');

const initializerPath = 'src/game/GameGlobalsInitializer.js';
const initializer = read(initializerPath);
requireMatch(initializerPath, initializer, /game\/helpers\/ui\/AccessibilityB1Helper/, 'B1 helper RequireJS dependency');
requireMatch(initializerPath, initializer, /new AccessibilityB1Helper\(GameGlobals\.accessibilityHelper\)/, 'B1 helper initialization');

if (failures.length > 0) {
	console.error('B1 accessibility source-contract check failed:');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log('B1 accessibility source-contract check passed.');
console.log('Covered path: Explore -> Scavenge -> Inventory -> Equip/Unequip -> Map -> select sector -> return with preserved focus.');
