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

const helperPath = 'src/game/helpers/ui/AccessibilityFinalAuditHelper.js';
const helper = read(helperPath);

// Save management
requireMatch(helperPath, helper, /#save-list \.li-save-slot/, 'save slot handling');
requireMatch(helperPath, helper, /setAttribute\("role", "listbox"\)/, 'save listbox semantics');
requireMatch(helperPath, helper, /setAttribute\("role", "option"\)/, 'save slot option semantics');
requireMatch(helperPath, helper, /aria-selected/, 'save slot selected state');
requireMatch(helperPath, helper, /textarea-export-save/, 'export textarea label');
requireMatch(helperPath, helper, /textarea-import-save/, 'import textarea label');
requireMatch(helperPath, helper, /handleSaveViewFocus/, 'save view focus management');

// Inventory result and incoming caravan custom list controls
for (const id of [
	'resultlist-inventorymanagement-found',
	'resultlist-inventorymanagement-kept',
	'inventorylist-incoming-caravan-trader-inventory',
	'inventorylist-incoming-caravan-trader-offer',
	'inventorylist-incoming-caravan-camp-inventory',
	'inventorylist-incoming-caravan-camp-offer',
]) {
	requireMatch(helperPath, helper, new RegExp(id), `${id} accessibility coverage`);
}
requireMatch(helperPath, helper, /configureSelectionItem/, 'selection item semantics');
requireMatch(helperPath, helper, /setAttribute\("role", "button"\)/, 'custom selection button role');
requireMatch(helperPath, helper, /bindActivateOnKeyboard/, 'Enter/Space activation');
requireMatch(helperPath, helper, /queueSelectionFocusRestore/, 'selection focus restoration queue');
requireMatch(helperPath, helper, /maybeRestoreSelectionFocus/, 'selection focus restoration');

// HorizontalSelect
requireMatch(helperPath, helper, /horizontal-select-option/, 'horizontal select option coverage');
requireMatch(helperPath, helper, /setAttribute\("role", "radiogroup"\)/, 'horizontal select radiogroup');
requireMatch(helperPath, helper, /setAttribute\("role", "radio"\)/, 'horizontal select radio options');
requireMatch(helperPath, helper, /aria-checked/, 'horizontal select selected state');
requireMatch(helperPath, helper, /ArrowLeft/, 'horizontal select arrow navigation');
requireMatch(helperPath, helper, /ArrowRight/, 'horizontal select arrow navigation');

// Embark and World
requireMatch(helperPath, helper, /Amount of .* to carry/, 'Embark contextual amount labels');
requireMatch(helperPath, helper, /embark-warning/, 'Embark warning status');
requireMatch(helperPath, helper, /#camp-overview tr\.camp-overview-camp/, 'World camp overview coverage');
requireMatch(helperPath, helper, /Go to /, 'contextual World Go labels');

// Confirm the original click-only patterns remain protected by the helper.
const manageSavePath = 'src/game/systems/ui/UIOutManageSaveSystem.js';
const manageSave = read(manageSavePath);
requireMatch(manageSavePath, manageSave, /class='li li-save-slot'/, 'save-slot custom control source');
requireMatch(manageSavePath, manageSave, /li\.\$root\.click/, 'save-slot click behavior');

const popupInventoryPath = 'src/game/systems/ui/UIOutPopupInventorySystem.js';
const popupInventory = read(popupInventoryPath);
requireMatch(popupInventoryPath, popupInventory, /resultlist-inventorymanagement-kept li/, 'result inventory kept click source');
requireMatch(popupInventoryPath, popupInventory, /resultlist-inventorymanagement-found li/, 'result inventory found click source');

const popupTradePath = 'src/game/systems/ui/UIOutPopupTradeSystem.js';
const popupTrade = read(popupTradePath);
requireMatch(popupTradePath, popupTrade, /inventorylist-incoming-caravan-trader-inventory li/, 'incoming caravan trader list source');
requireMatch(popupTradePath, popupTrade, /registerLongTap/, 'incoming caravan long-tap source');

const horizontalPath = 'src/game/elements/HorizontalSelect.js';
const horizontal = read(horizontalPath);
requireMatch(horizontalPath, horizontal, /horizontal-select-option/, 'HorizontalSelect source component');
requireMatch(horizontalPath, horizontal, /\$li\.click/, 'HorizontalSelect click source');

const initializerPath = 'src/game/GameGlobalsInitializer.js';
const initializer = read(initializerPath);
requireMatch(initializerPath, initializer, /game\/helpers\/ui\/AccessibilityFinalAuditHelper/, 'final audit helper RequireJS dependency');
requireMatch(initializerPath, initializer, /new AccessibilityFinalAuditHelper\(GameGlobals\.accessibilityHelper\)/, 'final audit helper initialization');

if (failures.length > 0) {
	console.error('Final accessibility audit source-contract check failed:');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log('Final accessibility audit source-contract check passed.');
console.log('Covered: save management, result inventory, incoming caravan, horizontal select, Embark, World overview, keyboard operation and focus restoration.');
