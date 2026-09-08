// Singleton with helper methods for UI elements used throughout the game
define(['ash',
	'text/Text',
	'game/GameGlobals',
	'game/constants/CharacterConstants',
	'game/constants/ColorConstants',
	'game/constants/GameConstants',
	'game/constants/StoryConstants',
	'game/constants/ExplorerConstants',
	'game/constants/ItemConstants',
	'game/constants/BagConstants',
	'game/constants/PerkConstants',
	'game/constants/UpgradeConstants',
	'game/constants/PlayerActionConstants',
	'game/constants/TextConstants',
	'utils/UIAnimations'
], function (Ash, Text, GameGlobals,
	CharacterConstants, ColorConstants, GameConstants, StoryConstants, ExplorerConstants, ItemConstants, BagConstants, PerkConstants, UpgradeConstants, PlayerActionConstants, TextConstants,
	UIAnimations) {

	let UIConstants = {

		THEME_SUNLIT: "sunlit",
		THEME_DUSKY: "dusky",
		THEME_DARK: "dark",

		FEATURE_MISSING_TITLE: "Thiếu tính năng",
		FEATURE_MISSING_COPY: "Tính năng này chưa được triển khai. Hãy quay lại sau!",

		MAP_MINIMAP_SIZE: 7,
		SCROLL_INDICATOR_SIZE: 5,

		SMALL_LAYOUT_THRESHOLD: 850,  // make sure this corresponds to something in gridism.css
		
		UNLOCKABLE_FEATURE_WORKER_AUTO_ASSIGNMENT: "workerAutoAssignment",
		UNLOCKABLE_FEATURE_MAP_MODES: "mapModes",
		
		ICON_FALLBACK: "img/eldorado/icon_placeholder.png",
		
		LAUNCH_FADEOUT_DURATION: 1000,
		THEME_TRANSITION_DURATION: 1200,

		POPUP_OVERLAY_FADE_IN_DURATION: 50,
		POPUP_OVERLAY_FADE_OUT_DURATION: 50,
		POPUP_FADE_IN_DURATION: 100,
		POPUP_FADE_OUT_DURATION: 50,

		ASCII_MAP_SYMBOL_PLAYER: "P",
		ASCII_MAP_SYMBOL_UNVISITED: "?",
		ASCII_MAP_SYMBOL_HAZARD_AFFECTED: "H",
		ASCII_MAP_SYMBOL_HAZARD_LOW: "h",
		ASCII_MAP_SYMBOL_VISITED: "0",
		ASCII_MAP_SYMBOL_CLEARED: "X",
		ASCII_MAP_SYMBOL_GENERIC_SECTOR: "x",
		ASCII_MAP_SYMBOL_CAMP: "C",
		ASCII_MAP_SYMBOL_PASSAGE_UP: "U",
		ASCII_MAP_SYMBOL_PASSAGE_DOWN: "D",
		ASCII_MAP_SYMBOL_POINT_OF_INTEREST: "!",
		ASCII_MAP_SYMBOL_RES_WATER: "W",
		ASCII_MAP_SYMBOL_RES_FOOD: "F",
		ASCII_MAP_SYMBOL_RES_METAL: "M",
		ASCII_MAP_SYMBOL_RES_INGREDIENT: "I",

		CAMP_UNIQUE_FEATURE_HABITABILITY: "habitability",
		CAMP_UNIQUE_FEATURE_RAID_DANGER_FACTOR: "raid_danger",
		CAMP_UNIQUE_FEATURE_TRADER_FACTOR: "trader_freq",
		CAMP_UNIQUE_FEATURE_DISEASE_FACTOR: "disease_factor",
		CAMP_UNIQUE_FEATURE_DISASTER: "disaster",
		CAMP_UNIQUE_FEATURE_WORKER_METAL: "worker_metal",
		CAMP_UNIQUE_FEATURE_WORKER_FOOD: "worker_food",
		CAMP_UNIQUE_FEATURE_WORKER_WATER: "worker_water",
		CAMP_UNIQUE_FEATURE_WORKER_ARTISAN: "worker_artisan",
		CAMP_UNIQUE_FEATURE_WORKER_ACADEMIC: "worker_academic",
		CAMP_UNIQUE_FEATURE_WORKER_HOPE: "worker_hope",
		CAMP_UNIQUE_FEATURE_WORKSHOP: "workshop",

		names: {
			resources: {
				stamina: "stamina",
				resource_metal: "metal",
				resource_fuel: "fuel",
				resource_rubber: "rubber",
				resource_rope: "rope",
				resource_food: "food",
				resource_water: "water",
				resource_concrete: "concrete",
				resource_herbs: "herbs",
				resource_medicine: "medicine",
				resource_tools: "tools",
				resource_robots: "robots",
				item_exploration_1: "lock pick",
				rumours: "rumours",
				evidence: "evidence",
				insight: "insight",
			}
		},

		soundTriggerIDs: {
			actionStarted: "actionStarted",
			actionCompleted: "actionCompleted",
			buttonClicked: "buttonClicked",
			moveTransition: "moveTransition",
			moveNormal: "moveNormal",
			logMessage: "logMessage",
			openPopup: "openPopup",
			closePopup: "closePopup",
		},

		getCurrentTheme: function ($body) {
			if ($body.hasClass("sunlit")) return UIConstants.THEME_SUNLIT;
			if ($body.hasClass("dark")) return UIConstants.THEME_DARK;
			if ($body.hasClass("dusky")) return UIConstants.THEME_DUSKY;
			return null;
		},

		getThemedIcon: function (src, alt, tooltip, classes) {
			let result = "<img ";

			let srcD = src.replace(/(\.[^/.]+)$/, "-dark$1");
			let srcS = src;

			result += "src='" + srcD + "' ";
			result += "data-src-dark='" + srcD + "' ";
			result += "data-src-sunlit='" + srcS + "' ";

			classes = classes || [];
			if (typeof classes == "string") classes = [ classes ];
			classes.push("img-themed");
			if (tooltip) classes.push("info-callout-target");
			if (tooltip) classes.push("info-callout-target-small");

			result += "class='" + classes.join(" ") + "' ";

			if (alt) result += "alt='" + alt + "' ";
			if (tooltip) result += "description='" + tooltip + "' ";
			
			result += "/>";

			return result;
		},
		
		getIconOrFallback: function (icon) {
			if (icon) return icon;
			return this.ICON_FALLBACK;
		},

		getItemDiv: function (itemsComponent, item, count, calloutContent, hideComparisonIndicator) {
			var url = item ? item.icon : null;
			var hasCount = count || count === 0;

			var classes = "item";
			if (item && item.equipped) classes += " item-equipped";
			if (item && item.broken) classes += " item-broken";
			if (hasCount) classes += " item-with-count";
			
			let div = "";

			if (item && calloutContent) {
				div += "<div class='info-callout-target info-callout-target-small' description='" + this.cleanupText(calloutContent) + "'>";
			}
			
			div += "<div class='" + classes + (item ? "' data-itemid='" + item.id + "' data-iteminstanceid='" + item.itemID + "'>" : ">");

			let itemName = ItemConstants.getItemDisplayName(item);
			if (item) div += "<img src='" + url + "' alt='" + itemName + "'/>";

			if (hasCount)
				div += "<div class='item-count lvl13-box-1 vision-text'>" + count + "x </div>";

			if (!hideComparisonIndicator && item && item.equippable) {
				var comparisonClass = "indicator-even";
				if (item.equipped) {
					comparisonClass = "indicator-equipped";
				} else {
					var comparison = itemsComponent.getEquipmentComparison(item);
					if (comparison > 0) {
						comparisonClass = "indicator-increase";
					} else if (comparison < 0) {
						comparisonClass = "indicator-decrease";
					}
				}
				div += "<div class='item-comparison-badge'><div class='item-comparison-indicator " + comparisonClass + "'/></div>";
			}

			if (calloutContent) div += "</div>";

			div += "</div>"

			return div;
		},
		
		getItemSlot: function (itemsComponent, item, count, isLost, simple, showBagOptions, bagOptions, tab) {
			let itemCategory = ItemConstants.getItemCategory(item);
			let itemDev = this.getItemDiv(itemsComponent, item, count, this.getItemCallout(item, false, showBagOptions, bagOptions, tab));
			let imageDiv = "<div class='item-slot-image'>"+ itemDev + "</div>";
			let liclasses = "item-slot item-slot-small lvl13-box-1 ";
			if (simple) liclasses += "item-slot-simple";
			if (isLost) liclasses += "item-slot-lost";
			if (itemCategory == ItemConstants.itemCategories.equipment) liclasses += " item-slot-equipment";
			if (itemCategory == ItemConstants.itemCategories.ingredient) liclasses += " item-slot-ingredient";
			if (itemCategory == ItemConstants.itemCategories.consumable) liclasses += " item-slot-consumable";
			if (itemCategory == ItemConstants.itemCategories.other) liclasses += " item-slot-other";
			return "<li class='" + liclasses + "'>" + imageDiv + "</li>"
		},

		updateItemSlot: function (slot, count) {
			var $slot = this.parseElement(slot);
			if (!$slot) return;
			$slot.find(".item-count").text(Text.t("ui.common.item_count_field", count));
			GameGlobals.uiFunctions.toggle($slot, count > 0);
		},

		getItemCallout: function (item, smallCallout, showBagOptions, bagOptions, tab) {
			if (!item) return "";
			var detail = " (" + this.getItemBonusDescription(item, false) + ")";
			if (detail.length < 5) detail = "";
			var weight = BagConstants.getItemCapacity(item);
			let itemName = ItemConstants.getItemDisplayName(item);
			var itemCalloutContent = "<b>" + itemName + "</b><br/>Loại: " + ItemConstants.getItemTypeDisplayName(item.type, false) + " " + detail;
			itemCalloutContent += "</br>Khối lượng: " + weight;
			if (ItemConstants.hasItemTypeQualityLevels(item.type)) {
				let quality = ItemConstants.getItemQuality(item);
				itemCalloutContent += "</br>Chất lượng: " + ItemConstants.getQualityDisplayName(quality);
			}
			if (item.broken) itemCalloutContent += "<br><span class='warning'>Hỏng</span>";
			itemCalloutContent += "</br>" + ItemConstants.getItemDescription(item);
			if (smallCallout) itemCalloutContent = itemName + (detail.length > 0 ? " " + detail : "");
			
			var makeButton = function (action, name) {
				if (!tab) {
					 return "<button class='action btn-narrow' action='" + action + "'>" + name + "</button>";
				} else {
					 return "<button class='action tabbutton btn-narrow' data-tab='" + tab + "' action='" + action + "'>" + name + "</button>";
				}
			};

			if (showBagOptions) {
				let options = "<div class='item-bag-options'>";

				if (bagOptions.canUse) {
					var action = "use_item_" + item.id;
					options += makeButton(action, ItemConstants.getUseItemVerb(item));
				}

				if (bagOptions.canRepair) {
					var action = "repair_item_" + item.itemID;
					options += makeButton(action, "Sửa chữa");
				}

				if (bagOptions.canEquip) {
					var action = "equip_" + item.itemID;
					options += makeButton(action, "Trang bị");
				} else if (bagOptions.canUnequip) {
					var action = "unequip_" + item.id;
					options += makeButton(action, "Tháo trang bị");
				}

				if (bagOptions.canDiscard) {
					var action = "discard_" + item.itemID;
					options += makeButton(action, "Bỏ");
				}

				options += "</div>";
				itemCalloutContent += options;
			}

			return itemCalloutContent;
		},

		getItemList: function (items) {
			var html = "";
			var itemsCounted = {};
			var itemsById = {};
			for (let i = 0; i < items.length; i++) {
				if (typeof itemsCounted[items[i].id] === 'undefined') {
					itemsCounted[items[i].id] = 1;
					itemsById[items[i].id] = items[i];
				} else {
					itemsCounted[items[i].id]++;
				}
			}

			for (var key in itemsById) {
				var item = itemsById[key];
				var amount = itemsCounted[key];
				html += "<li>" + this.getItemDiv(itemsComponent, item, amount, this.getItemCallout(item, true)) + "</li>";
			}
			return html;
		},

		getExplorerDivWithOptions: function (explorerVO, isRecruited, isInCamp, questTextKey, isForced) {
			let classes = "npc-container";
			let div = "<div class='" + classes + "' data-explorerid='" + explorerVO.id + "'>";
			let isAnimal = ExplorerConstants.isAnimal(explorerVO.abilityType);
			
			// portrait
			let calloutContent = this.getExplorerCallout(explorerVO, isRecruited, isInCamp, true, questTextKey, isForced);

			let hideComparisonIndicator = explorerVO.inParty;
			
			div += "<div class='npc-portrait info-callout-target info-callout-target-small' description='" + this.cleanupText(calloutContent) + "'>";
			div += UIConstants.getExplorerPortrait(explorerVO);

			div += "</div>";

			// name
			div += "<span>" + this.warning(explorerVO.name, explorerVO.injuredTimer >= 0) + "</span>";

			// status icons
			div += "<span class='explorer-icons'>";

			let explorerType = ExplorerConstants.getExplorerTypeForAbilityType(explorerVO.abilityType);
			let explorerTypeIconDefault = "img/eldorado/icon_explorer_type_" + explorerType + "-dark.png";
			let explorerTypeIconSunlit = "img/eldorado/icon_explorer_type_" + explorerType + ".png";
			div += "<img class='stat-icon img-themed' src='" + explorerTypeIconDefault + "' data-src-sunlit='" + explorerTypeIconSunlit + "' alt='" + explorerType + "'/>";

			if (!hideComparisonIndicator) {
				div += "<div class='item-comparison-indicator indicator-even'></div>";
			}
			div += "<div class='npc-dialogue-indicator'></div>";

			if (!explorerVO.inParty && explorerVO.injuredTimer >= 0) {
				let healIconDefault = "img/eldorado/icon_heal-dark.png";
				let healIconSunlit = "img/eldorado/icon_heal.png";
				div += "<img class='stat-icon img-themed' src='" + healIconDefault + "' data-src-sunlit='" + healIconSunlit + "' alt='healing'/>";
			}

			div += "<div class='npc-quest-indicator hidden'></div>";

			div += "<div class='bubble hidden'>!</div>";
			
			div += "</span>";

			// interaction options
			let talkLabel = Text.t(isAnimal ? "ui.actions.start_dialogue_pet_label" : "ui.actions.start_dialogue_default_label");
			let talkAction = "start_explorer_dialogue_" + explorerVO.id;
			let switchLabel = "⇵";
			let switchAction = explorerVO.inParty ? "deselect_explorer_" + explorerVO.id : "select_explorer_" + explorerVO.id;
			let dismissLabel = "×";
			let dismissAction = "dismiss_explorer_" + explorerVO.id;
			let healAction = "heal_explorer_" + explorerVO.id;
			div += "<div class='interaction-options'>";
			div += "<button class='action btn-narrow' action='" + talkAction + "'>" + talkLabel + "</button>";
			div += "<table class='button-row-2'><tr>";
			div += "<td><button class='action btn-mini' action='" + switchAction + "' aria-label='đổi thành viên'>" + switchLabel + "</button></td>";
			div += "<td><button class='action btn-mini' action='" + dismissAction + "' aria-label='cho thôi'>" + dismissLabel + "</button></td>";
			div += "</tr></table>";

			// hack to avoid temporary empty space in layout when changing to explorers tab
			// this assumes an explorer never gets injured while this div is active (explorers tab open)
			if (!isInCamp && explorerVO.injuredTimer > 0) div += "<button class='action btn-narrow btn-heal-explorer' action='" + healAction + "' style='display:none'>Chữa trị</button>";
			div += "</div>";

			div += "</div>";
			
			return div;
		},
		
		getExplorerDivSimple: function (explorer, isRecruited, isInCamp, hideComparisonIndicator, questTextKey, isForced) {
			let classes = "npc-container npc-container-mini";
			let div = "<div class='" + classes + "' data-explorerid='" + explorer.id + "'>";
			let calloutContent = this.getExplorerCallout(explorer, isRecruited, isInCamp, false, questTextKey, isForced);
			
			div += "<div class='info-callout-target info-callout-target-small' description='" + this.cleanupText(calloutContent) + "'>";

			div += "<div class='npc-portrait'>";
			div += UIConstants.getExplorerPortrait(explorer);
			div += "</div>";
			
			if (!hideComparisonIndicator) {
				div += "<div class='item-comparison-badge'><div class='item-comparison-indicator indicator-even'/></div>";
			}
			
			div += "</div>";
			div += "</div>"
			
			return div;
		},
		
		getExplorerCallout: function (explorer, isRecruited, isInCamp, hideButtons, questTextKey, isForced) {
			let explorerType = ExplorerConstants.getExplorerTypeForAbilityType(explorer.abilityType);
			let result = "<b>" + explorer.name + "</b>";
			if (isRecruited) {
				result += "<br/>Trong đội: " + (explorer.inParty ? "có" : "không");
			}
			result += "<br/>Loại: " + ExplorerConstants.getExplorerTypeDisplayName(explorerType);
			result += "<br/>Khả năng: " + Text.t(ExplorerConstants.getAbilityTypeDisplayNameKey(explorer.abilityType))
				+ " (" + Text.t(UIConstants.getExplorerAbilityDescriptionTextVO(explorer, [])) + ")";

			if (questTextKey) {
				result += "<br/>Nhiệm vụ: " + Text.t(questTextKey);
			}

			if (explorer.injuredTimer >= 0) {
				if (explorer.inParty) {
					result += "<br/>Trạng thái: " + this.warning("Bị thương");
				} else {
					result += "<br/>Trạng thái: " + this.warning("Bị thương (đang hồi phục)");
				}
			} else if (explorer.hasUrgentDialogue) {
				result += "<br/>Trạng thái: Muốn nói chuyện";
			} else if (isForced) {
				result += "<br/>Trạng thái: Muốn đi khám phá";
			}

			if (GameConstants.isCheatsEnabled) {
				result += "<br/>" + "<span class='debug-info'>" + this.meta("Mức tin cậy: " + explorer.trust) + "</span>";;
			}
			
			if (isRecruited && isInCamp && !hideButtons) {
				var makeButton = function (action, name) {
					 return "<button class='action btn-narrow' action='" + action + "'>" + name + "</button>";
				};

				var options = "<div class='item-bag-options'>";
				options += makeButton("dismiss_explorer_" + explorer.id, "Sa thải");
				if (!explorer.inParty) {
					options += makeButton("select_explorer_" + explorer.id, "Thêm vào đội");
				} else {
					options += makeButton("deselect_explorer_" + explorer.id, "Đổi ra");
				}
				options += "</div>";
				result += options;
			}

			return result;
		},
		
		getExplorerAbilityDescriptionTextVO: function (explorer, explorers) {
			let textParams = {};

			switch (explorer.abilityType) {
				case ExplorerConstants.abilityType.ATTACK:
					textParams.value = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.fight_att);
					break;
				case ExplorerConstants.abilityType.DEFENCE:
					textParams.value = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.fight_def);
					break;
				case ExplorerConstants.abilityType.COST_MOVEMENT:
					let movementCostReduction = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.movement);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(movementCostReduction);
					break;
				case ExplorerConstants.abilityType.COST_SCAVENGE:
					let scavengeCostReduction = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.scavenge_cost);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(scavengeCostReduction);
					break;
				case ExplorerConstants.abilityType.COST_SCOUT:
					let scoutCostReduction = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.scout_cost);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(scoutCostReduction);
					break;
				case ExplorerConstants.abilityType.SCAVENGE_GENERAL:
					let scaBonus = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.scavenge_general);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(scaBonus);
					break;
				case ExplorerConstants.abilityType.SCAVENGE_INGREDIENTS:
					let ingredientBonus = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.scavenge_ingredients);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(ingredientBonus);
					break;
				case ExplorerConstants.abilityType.SCAVENGE_SUPPLIES:
					let suppliesBonus = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.scavenge_supplies);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(suppliesBonus);
					break;
				case ExplorerConstants.abilityType.SCAVENGE_VALUABLES:
					let valuablesBonus = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.scavenge_valuables);
					textParams.value = UIConstants.getMultiplierBonusDisplayValue(valuablesBonus);
					break;
				case ExplorerConstants.abilityType.SCAVENGE_CAPACITY:
					let capacityBonus = ExplorerConstants.getExplorerItemBonus(explorer, explorers, ItemConstants.itemBonusTypes.bag);
					textParams.value = capacityBonus;
					break;
			}

			return { textKey: "ui.characters.explorer_ability_type_" + explorer.abilityType + "_description", textParams: textParams };
		},

		getExplorerPortrait: function (explorerVO) {
			return "<img src='" + explorerVO.icon + "' alt='" + explorerVO.name + "' class='portrait' />";
		},

		getNPCDiv: function (characterType, talkActionID, randomIndex, options) {
			options = options || {};

			let $div = $(this.createNPCDiv());
			this.updateNPCDiv($div, characterType, talkActionID, randomIndex, options);
			return $div;
		},

		createNPCDiv: function () {
			let div = "<div class='npc-container'>";
			let calloutContent = "Khách";
			
			div += "<div class='npc-type-indicator'><img src='img/eldorado/icon_time-dark.png'/></div>";
			div += "<div class='info-callout-target info-callout-target-small fullwidth' description='" + this.cleanupText(calloutContent) + "'>";
			div += this.createNPCPortrait();
			div += "</div>";

			let talkLabel = Text.t("ui.actions.start_dialogue_default_label");
			div += "<button class='action btn-compact' action=''>" + talkLabel + "</button>";
			
			div += "</div>"
			
			return div;
		},

		updateNPCDiv: function ($div, characterType, talkActionID, randomIndex, options) {
			let icon = this.getNPCIcon(characterType, randomIndex);
			let action = talkActionID;

			options = options || {};
			options.isTemporary = options.isTemporary || false;

			let showName = options.showName || false;
			let displayName = Text.t(this.getNPCDisplayNameKey(characterType));

			let name = showName ? displayName : "";

			$div.toggleClass("npc-visitor", options.isTemporary);
			$div.attr("data-characterType", characterType);
			$div.find(".npc-portrait").find("img").attr("src", icon);
			$div.find(".npc-name").text(name);
			$div.find("button").attr("action", action);
			$div.find(".info-callout-target").attr("description", displayName);
			
			$div.find(".npc-type-indicator").toggleClass("hidden", !options.isTemporary);
		},

		getNPCPortrait: function (characterType, randomIndex) {
			let $portrait = $(this.createNPCPortrait());
			this.updateNPCPortrait($portrait, characterType, randomIndex);
			return $portrait;
		},

		createNPCPortrait: function () {
			let div = "<div class='npc-portrait'>";
			div += "<img src='' alt='npc-portrait' />";
			div += "<span class='npc-name'></span>";
			div += "</div>";
			return div;
		},

		updateNPCPortrait: function ($div, characterType, randomIndex) {
			let icon = this.getNPCIcon(characterType, randomIndex);
			let name = Text.t(this.getNPCDisplayNameKey(characterType));

			$div.find("img").attr("src", icon);
			$div.find(".npc-name").text(name);
		},

		getNPCDisplayNameKey: function (characterType) {
			return "game.characters." + characterType + "_name";
		},

		getNPCIcon: function (characterType, randomIndex) {
			return characterType ? CharacterConstants.getIcon(characterType, randomIndex) : null;
		},

		getResourceLi: function (name, amount, isLost, simple) {
			var divclasses = "res item-with-count";
			var div = "<div class='" + divclasses + "' data-resourcename='" + name + "'>";
			let displayName = TextConstants.getResourceDisplayName(name);
			div += "<div class='info-callout-target info-callout-target-small' description='" + displayName + "'>";
			div += this.getResourceImg(name);
			if (amount || amount === 0)
				div += "<div class='item-count lvl13-box-1'>" + Math.floor(amount) + "x</div>";
			div += "</div>";
			div += "</div>";
			var liclasses = "item-slot item-slot-small lvl13-box-1 ";
			if (simple) liclasses += "item-slot-simple";
			if (isLost) liclasses += "item-slot-lost";
			var imageDiv = "<div class='item-slot-image'>" + div + "</div>";
			return "<li class='" + liclasses + "'>" + imageDiv + "</li>";
		},

		updateResourceLi: function (li, amount) {
			var $li = this.parseElement(li);
			if (!$li) return;
			var showAmount = Math.floor(amount);
			$li.find(".item-count").text(Text.t("ui.common.item_count_field", showAmount));
			GameGlobals.uiFunctions.toggle($li, showAmount > 0);
		},

		getCurrencyLi: function (amount, simple) {
			var classes = "res item-with-count";
			var div = "<div class='" + classes + "' data-resourcename='currency'>";
			div += "<div class='info-callout-target info-callout-target-small' description='" + TextConstants.getResourceDisplayName("currency") + "'>";
			div += this.getResourceImg("currency");
			div += "<div class='item-count lvl13-box-1'>" + Math.floor(amount) + "x </div>";
			div += "</div>";
			div += "</div>";
			var liclasses = "item-slot item-slot-small lvl13-box-1 ";
			if (simple) liclasses += "item-slot-simple";
			var imageDiv = "<div class='item-slot-image'>" + div + "</div>";
			return "<li class='" + liclasses + "'>" + imageDiv + "</li>";
		},

		updateCurrencyLi: function (li, amount) {
			var $li = this.parseElement(li);
			if (!$li) return;
			var showAmount = Math.floor(amount);
			$li.find(".item-count").text(Text.t("ui.common.item_count_field", showAmount));
			GameGlobals.uiFunctions.toggle($li, showAmount > 0);
		},

		getBlueprintPieceLI: function (upgradeID) {
			let name = TextConstants.getUpgradeDisplayName(upgradeID);
			return "<li><div class='info-callout-target' description='Bản thiết kế (" + name + ")'>" + this.getBlueprintPieceIcon(upgradeID) + " bản thiết kế</li>";
		},

		getResourceList: function (resourceVO) {
			var html = "";
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var amount = resourceVO.getResource(name);
				if (Math.round(amount) > 0) {
					var li = this.getResourceLi(name, amount);
					html += li;
				}
			}
			return html;
		},

		getItemBonusDescription: function (item, useLineBreaks) {
			let result = "";
			if (!item) return result;
			let defaultType = ItemConstants.getItemDefaultBonus(item);
			for (var bonusKey in ItemConstants.itemBonusTypes) {
				var bonusType = ItemConstants.itemBonusTypes[bonusKey];
				let baseValue = ItemConstants.getDefaultBonus(item, bonusType);
				if (baseValue <= 0) continue;
				let currentValue = ItemConstants.getCurrentBonus(item, bonusType);
				
				result += this.getItemBonusName(bonusType, true);
				if (currentValue == baseValue) {
					result += this.getItemBonusText(item, bonusType, baseValue);
				} else {
					result += "<span class='strike-through'>";
					result += this.getItemBonusText(item, bonusType, baseValue);
					result += "</span>";
					result += "<span class='warning'>";
					result += this.getItemBonusText(item, bonusType, currentValue);
					result += "</span>";
				}
				result += useLineBreaks ? "<br/>" : ", ";
			}

			result = result.substring(0, result.length - (useLineBreaks ? 5 : 2));

			return result;
		},

		getItemBonusName: function (bonusType, short) {
			switch (bonusType) {
				case ItemConstants.itemBonusTypes.light: return "ánh sáng";
				case ItemConstants.itemBonusTypes.fight_att: return "tấn công";
				case ItemConstants.itemBonusTypes.fight_def: return "phòng thủ";
				case ItemConstants.itemBonusTypes.fight_shield: return "khiên";
				case ItemConstants.itemBonusTypes.fight_speed: return "tốc độ tấn công";
				case ItemConstants.itemBonusTypes.movement: return "chi phí di chuyển";
				case ItemConstants.itemBonusTypes.scavenge_cost: return "chi phí lục soát";
				case ItemConstants.itemBonusTypes.scavenge_general: return "thưởng lục soát";
				case ItemConstants.itemBonusTypes.scavenge_supplies: return "thưởng lục soát";
				case ItemConstants.itemBonusTypes.scavenge_ingredients: return "thưởng lục soát";
				case ItemConstants.itemBonusTypes.scavenge_blueprints: return "thưởng lục soát";
				case ItemConstants.itemBonusTypes.scavenge_valuables: return "thưởng lục soát";
				case ItemConstants.itemBonusTypes.scout_cost: return "chi phí trinh sát";
				case ItemConstants.itemBonusTypes.collector_cost: return "chi phí bẫy/xô";
				case ItemConstants.itemBonusTypes.bag: return "sức chứa túi";
				case ItemConstants.itemBonusTypes.res_cold: return "giữ ấm";
				case ItemConstants.itemBonusTypes.res_radiation: return short ? "kháng phóng xạ" : "khả năng kháng phóng xạ";
				case ItemConstants.itemBonusTypes.res_poison: return short ? "kháng độc" : "khả năng kháng độc";
				case ItemConstants.itemBonusTypes.res_water: return short ? "kháng nước" : "khả năng kháng nước";
				case ItemConstants.itemBonusTypes.shade: return short ? "kháng nắng" : "khả năng chống chói nắng";
				case ItemConstants.itemBonusTypes.detect_hazards: return short ? "mối nguy" : "khảo sát (mối nguy)";
				case ItemConstants.itemBonusTypes.detect_supplies: return short ? "vật tư" : "khảo sát (vật tư)";
				case ItemConstants.itemBonusTypes.detect_ingredients: return short ? "nguyên liệu" : "khảo sát (nguyên liệu)";
				case ItemConstants.itemBonusTypes.detect_poi: return short ? "điểm đáng chú ý" : "khảo sát (điểm đáng chú ý)";
				default:
					log.w("no display name defined for item bonus type: " + bonusType);
					return "";
			}
		},

		getItemBonusText: function (item, bonusType, bonusValue) {
			var baseValue = item.getBaseBonus(bonusType);
			
			if (ItemConstants.isStaticValue(baseValue)) {
				return " " + bonusValue;
			} else if (bonusValue === 0) {
				return "+0";
			} else if (ItemConstants.isMultiplier(bonusType) && ItemConstants.isIncreasing(bonusType)) {
				// increasing multiplier: fight speed
				var val = Math.abs(Math.round((1 - bonusValue) * 100));
				return bonusValue == 1 ? "+0%" : (bonusValue < 1 ? "-" + val + "%" : "+" + val + "%");
			} else if (baseValue >= 1) {
				return " +" + bonusValue;
			} else if (baseValue > 0) {
				return " -" + UIConstants.getMultiplierBonusDisplayValue(bonusValue);
			} else if (baseValue > -1) {
				return " +" + UIConstants.getMultiplierBonusDisplayValue(bonusValue);
			} else {
				return " " + bonusValue;
			}
		},

		getPerkDetailText: function (perk, isResting) {
			let bonusText = this.getPerkBonusText(perk);
			let timerText = this.getPerkTimerText(perk, isResting);
			let result = "";
			if (bonusText) result += bonusText;
			if (timerText) {
				if (bonusText && bonusText.length > 0) result += ", ";
				result += timerText;
			}
			return result;
		},
		
		getPerkTimerText: function (perk, isResting) {
			if (perk.removeTimer >= 0) {
				var factor = PerkConstants.getRemoveTimeFactor(perk, isResting);
				var timeleft = perk.removeTimer / factor;
				return "thời gian còn lại: " + this.getTimeToNum(timeleft);
			} else if (perk.startTimer >= 0) {
				return "thời gian đến khi hồi đầy: " + this.getTimeToNum(perk.startTimer);
			} else {
				return null;
			}
		},

		getPerkBonusText: function (perk) {
			let value = 0;
			if (PerkConstants.isPercentageEffect(perk.type)) {
				if (perk.effect == 1) return null;
				if (perk.effect < 1) {
					value = "-" + UIConstants.getMultiplierBonusDisplayValue(PerkConstants.getCurrentEffect(perk));
				} else {
					value = "+" + UIConstants.getMultiplierBonusDisplayValue(PerkConstants.getCurrentEffect(perk));
				}
			} else {
				if (perk.effect == 0) return null;
				value = "+" + PerkConstants.getCurrentEffect(perk);
			}

			let effect = perk.type;
			switch (perk.type) {
				case PerkConstants.perkTypes.movement:
					effect = "chi phí di chuyển";
					break;
				case PerkConstants.perkTypes.injury:
				case PerkConstants.perkTypes.health:
					effect = "sức khỏe";
					break;
				case PerkConstants.perkTypes.stamina:
					effect = "thể lực";
					break;
				case PerkConstants.perkTypes.light:
					effect = "ánh sáng";
					break;
				case PerkConstants.perkTypes.visualNegative:
				case PerkConstants.perkTypes.visualPositive:
					effect = "tầm nhìn";
					break;
				case PerkConstants.perkTypes.luck:
					if (perk.effect > 0) {
						return "Giảm khả năng gặp sự kiện ngẫu nhiên tiêu cực khi thám hiểm";
					} else { 
						return "Tăng khả năng gặp sự kiện ngẫu nhiên tiêu cực khi thám hiểm";
					}
			}

			return effect + " " + value;
		},

		getCostsSpans: function (action, costs) {
			let result = "";
			let hasCosts = action && costs && Object.keys(costs).length > 0;
			if (hasCosts) {
				for (let key in costs) {
					let name = UIConstants.getCostDisplayName(key).toLowerCase();
					let value = costs[key];
					result += "<span class='action-cost action-cost-" + key + "'>" + name + ": <span class='action-cost-value'>" + UIConstants.getDisplayValue(value) + "</span><br/></span>";
				}
			} else if (this.isActionFreeCostShown(action)) {
				result += "<span class='action-cost p-meta'>miễn phí</span><br />";
			}
			return result;
		},
		
		getCostsSpansElements: function (action, costs, elements, $container) {
			elements.costSpans = {};
			elements.costSpanValues = {};
			for (let key in costs) {
				elements.costSpans[key] = $container.children(".action-cost-" + key);
				elements.costSpanValues[key] = elements.costSpans[key].children(".action-cost-value");
			}
		},
		
		isActionFreeCostShown: function (action) {
			let baseId = GameGlobals.playerActionsHelper.getBaseActionID(action);
			switch (baseId) {
				case "recruit_explorer": return true;
				case "wait": return true;
			}
			return false;
		},
		
		canHideProject: function (projectID) {
			if (projectID.indexOf("greenhouse") >= 0) return false;
			if (projectID.indexOf("passage") >= 0) return false;
			if (projectID.indexOf("tradepost_") >= 0) return false;
			return true;
		},
		
		getMultiplierBonusDisplayValue: function (value, includeSign) {
			let result = Math.round(Math.abs(1 - value) * 100) + "%";
			if (includeSign && value < 1) result = "-" + result;
			if (includeSign && value > 1) result = "+" + result;
			return result;
		},

		sortItemsByType: function (a, b) {
			let getItemSortVal = function (itemVO) {
				let typeVal = UIConstants.getItemSortValueByType(itemVO);
				return typeVal * 1000 - itemVO.getBaseTotalBonus();
			};
			var aVal = getItemSortVal(a);
			var bVal = getItemSortVal(b);
			return aVal - bVal;
		},

		sortItemsByRelevance: function (a, b) {
			let getItemRelevanceVal = function (itemVO) {
				let typeVal = UIConstants.getItemSortValueByType(itemVO);
				let result = typeVal * 1000 + itemVO.getBaseTotalBonus();
				// TODO move this to item data
				if (itemVO.id == "exploration_1") result -= 50;
				return result;
			};
			let aVal = getItemRelevanceVal(a);
			let bVal = getItemRelevanceVal(b);
			return aVal - bVal;
		},

		getItemSortValueByType: function (itemVO) {
			let typeVal = 0;
			switch (itemVO.type) {
				case ItemConstants.itemTypes.uniqueEquipment: typeVal = 0; break;
				case ItemConstants.itemTypes.exploration: typeVal = 1; break;
				
				case ItemConstants.itemTypes.bag: typeVal = 11; break;
				case ItemConstants.itemTypes.light: typeVal = 12; break;
				case ItemConstants.itemTypes.weapon: typeVal = 13; break;
				case ItemConstants.itemTypes.clothing_over: typeVal = 14; break;
				case ItemConstants.itemTypes.clothing_upper: typeVal = 15; break;
				case ItemConstants.itemTypes.clothing_lower: typeVal = 16; break;
				case ItemConstants.itemTypes.clothing_hands: typeVal = 17; break;
				case ItemConstants.itemTypes.clothing_head: typeVal = 18; break;
				case ItemConstants.itemTypes.shoes: typeVal = 19; break;
				
				case ItemConstants.itemTypes.ingredient: typeVal = 21; break;
				case ItemConstants.itemTypes.voucher: typeVal = 22; break;
				case ItemConstants.itemTypes.trade: typeVal = 23; break;
				
				case ItemConstants.itemTypes.artefact: typeVal = 31; break;
				case ItemConstants.itemTypes.note: typeVal = 32; break;
			}

			return typeVal;
		},
		
		sortExplorersByType: function (a, b) {
			let getExplorerSortVal = function (explorerVO) {
				let abilityType = explorerVO.abilityType;
				let explorerType = ExplorerConstants.getExplorerTypeForAbilityType(abilityType);
				let typeVal = 0;
				switch (explorerType) {
					case ExplorerConstants.explorerType.FIGHTER: typeVal = 1; break;
					case ExplorerConstants.explorerType.SCOUT: typeVal = 2; break;
					case ExplorerConstants.explorerType.SCAVENGER: typeVal = 3; break;
				}
				return typeVal * 1000 - explorerVO.abilityLevel;
			};
			let aVal = getExplorerSortVal(a);
			let bVal = getExplorerSortVal(b);
			return aVal - bVal;
		},

		createResourceIndicator: function (name, showName, id, showAmount, showChange, showDetails, showFill) {
			let classes = [ "stat-indicator" ];
			if (showFill) classes.push("stat-indicator-with-fill");

			let displayName = TextConstants.getResourceDisplayName(name);
			
			let div = "<div class='" + classes.join(" ") + "' id='" + id + "'>";

			if (!showName) div = "<div class='info-callout-target info-callout-target-small' description='" + displayName + "'>" + div;
			else if (showChange) div = "<div class='info-callout-target' description=''>" + div;

			div += "<span class='icon'>";
			div += this.getResourceImg(name);
			if (!showName && !showChange) div += "</div>";
			div += "</span>";

			if (showName) div += "<span class='label'>" + displayName + "</span>";

			if (showAmount) div += "<span class='value'></span>";
			div += "<span class='change-indicator'></span>";
			if (showDetails) div += "<span class='change'></span>";
			if (showDetails) div += "<span class='forecast'></span>";
			div += "</div>";

			if (!showName || showChange) div = div + "</div>";

			return div;
		},
		
		completeResourceIndicatorAnimations: function (id) {
			let $valueElement = $(id).children(".value");
			UIAnimations.animateNumberEnd($valueElement);
		},

		updateResourceIndicator: function (id, value, change, storage, showChangeIcon, showChange, showDetails, showWarning, visible, animate, previousTime, currentTime) {
			let $indicator = $(id);
			GameGlobals.uiFunctions.toggle($indicator, visible);
			GameGlobals.uiFunctions.toggle($indicator.parent(), visible);

			if (visible) {
				let $valueElement = $indicator.children(".value");

				let isAnimating = UIAnimations.isActivelyAnimating($valueElement, previousTime, currentTime);
				if (isAnimating) {
					if (GameConstants.isDebugVersion) log.w("skipping resource indicator update because it's still animating a previous one: #" + id);
					return;
				}
				
				animate = animate || UIAnimations.isAnimating($valueElement);

				UIAnimations.animateOrSetNumber($valueElement, animate, value, "", false, (v) => { return UIConstants.roundValue(v, true, false); });
				$indicator.children(".value").toggleClass("warning", showWarning && value < 5);
				$indicator.children(".change").toggleClass("warning", change < 0);
				GameGlobals.uiFunctions.toggle($indicator.children(".change"), showChange);
				GameGlobals.uiFunctions.toggle($indicator.children(".forecast"), showDetails);
				$indicator.children(".forecast").toggleClass("warning", change < 0);

				var isCappedByStorage = change > 0 && value >= storage;

				if (showChange) {
					$indicator.children(".change").text(Math.round(change * 10000) / 10000 + "/s");
				}
				
				if (showDetails) {
					if (change > 0 && (storage - value > 0)) {
						$indicator.children(".forecast").text("(còn " + this.getTimeToNum((storage - value) / change) + " để đầy)");
					} else if (change < 0 && value > 0) {
						$indicator.children(".forecast").text("(còn " + this.getTimeToNum(value / change) + " để hết)");
					} else if (value >= storage) {
						$indicator.children(".forecast").text("(đầy)");
					} else {
						$indicator.children(".forecast").text("");
					}
				}
				
				if ($indicator.hasClass("stat-indicator-with-fill")) {
					let sunlit = $("body").hasClass("sunlit");
					let fillColor = ColorConstants.getColor(sunlit, "bg_element_1");
					let fillPercent = Math.round(value / storage * 100);
					$(id).css("background", "linear-gradient(to right, " + fillColor + " " + fillPercent + "%, transparent " + fillPercent + "%)");
				}

				change = Math.round(change * 10000) / 10000;
				$indicator.children(".change-indicator").toggleClass("indicator-increase", change > 0 && !isCappedByStorage);
				$indicator.children(".change-indicator").toggleClass("indicator-decrease", change < 0);
				$indicator.children(".change-indicator").toggleClass("indicator-even", change === 0 || isCappedByStorage);
				GameGlobals.uiFunctions.toggle($indicator.children(".change-indicator"), showChangeIcon);
			}
		},

		updateResourceIndicatorCallout: function (id, name, changeSources) {
			let content = "";
			var source;
			for (let i in changeSources) {
				source = changeSources[i];
				if (source.amount != 0) {
					content += this.getResourceAccumulationSourceText(source) + "<br/>";
				}
			}

			let displayName = TextConstants.getResourceDisplayName(name);

			if (content.length <= 0) {
				content = displayName + " (không thay đổi)";
			} else {
				content = displayName + "<br/>" + content;
			}

			this.updateCalloutContent(id,  content);
		},
		
		getResourceAccumulationSourceText: function (source) {
			let divisor = 10000;
			if (source.amount < 0.0001) divisor = 100000;
			return source.source + " (" + source.sourceCount + ")" + ": " + Math.round(source.amount * divisor) / divisor + "/s";
		},

		getAccumulationText: function (value) {
			if (value == 0) return "-";

			if (Math.abs(value) < 0.01) {
				let minutesValue = value * 60;
				return this.roundValue(minutesValue, true) + "/m";
			}

			return this.roundValue(value, true) + "/s";
		},

		updateCalloutContent: function ($targetElement, content, isTargetDirect) {
			$targetElement = UIConstants.parseElement($targetElement);
			let $calloutTarget = isTargetDirect ? $targetElement : $targetElement.parents(".info-callout-target");

			$calloutTarget.attr("description", content);
			$calloutTarget.siblings(".info-callout").children(".info-callout-content").html(content);
		},

		parseElement: function ($elem) {
			if (typeof $elem == 'object') {
				return $elem;
			}
			if (typeof $elem == 'string' && $elem.length > 0) {
				if ($elem[0] == '#' || $elem[0] == '.') {
					return $($elem);
				} else {
					return $("#" + $elem);
				}
			}
			return null;
		},

		getBlueprintPieceIcon: function (upgradeID) {
			let type = UpgradeConstants.getUpgradeType(upgradeID);
			return "<img src='img/items/blueprints/blueprint-" + type + ".png' alt='' />";
		},
		
		getMilestoneUnlocksDescriptionHTML: function (milestone, previousMilestone, isNew, showMultiline, hasDeity, hasInvestigate) {
			if (!previousMilestone) previousMilestone = {};
			let html = "";
			let baseReputation = Math.max(milestone.baseReputation || 0, previousMilestone.baseReputation || 0);
			
			let addValue = function (label, value) {
				html += "<span class='text-list-entry'>";
				html += label;
				if (value || value === 0) {
					html += ": ";
					html += value;
				}
				html += "</span>";
			};
			
			let addGroup = function (title, items, getItemDisplayName) {
				if (!items || items.length == 0) return
				if  (title && title.length > 0) html += title + ": ";
				if (showMultiline) html += "<br/>";
				for (let i = 0; i < items.length; i++) {
					if (i > 0) html += ", ";
					html += getItemDisplayName ? getItemDisplayName(items[i]).toLowerCase() : items[i];
				}
				html += "<br/>";
			};
			
			addValue("Uy tín cơ bản", baseReputation);

			addValue("Bằng chứng tối đa", milestone.maxEvidence);
			addValue("Tin đồn tối đa", milestone.maxRumours);
			
			if (milestone.maxHope && hasDeity) {
				addValue("Hy vọng tối đa", milestone.maxHope);
			}
			
			if (milestone.maxInsight && hasInvestigate) {
				addValue("Sáng tỏ tối đa", milestone.maxInsight);
			}
			
			if (isNew) {
				addGroup("", milestone.unlockedFeatures, UIConstants.getUnlockedFeatureDisplayName);
				addGroup("Sự kiện mới", milestone.unlockedEvents);
				
				let unlockedUpgrades = GameGlobals.milestoneEffectsHelper.getUnlockedUpgrades(milestone.index);
				addGroup("Nâng cấp đã mở", unlockedUpgrades, (upgradeID) => {
					let upgrade = UpgradeConstants.upgradeDefinitions[upgradeID];
					let name = TextConstants.getUpgradeDisplayName(upgradeID);
					let isOtherRequirementsMet = GameGlobals.playerActionsHelper.isRequirementsMet(upgradeID, null, [ PlayerActionConstants.DISABLED_REASON_MILESTONE ]);
					let c = isOtherRequirementsMet ? "" : "strike-through";
					return "<span class='" + c + "'>" + name + "</span>";
				});
				
				let unlockedActions = GameGlobals.milestoneEffectsHelper.getUnlockedGeneralActions(milestone.index);
				addGroup("Khác", unlockedActions);
			}
			
			return html;
		},

		getCampUniqueFeatureIcon: function (type, value, isNegative, options, context) {
			options = options || {};
			let classes = [ "camp-unique-feature-icon-container" ];
			if (isNegative) classes.push("camp-unique-feature-icon-negative");
			if (!isNegative) classes.push("camp-unique-feature-icon-positive");

			let getIconPath = (id) => "/img/eldorado/camp_feature_" + id + ".png";
			let iconID = type;

			let displayValue = typeof value == "number" ? UIConstants.getMultiplierBonusDisplayValue(value, true) : value;

			let textKeyBase = "ui.camp.unique_feature_" + type;
			let textKeySuffix = (isNegative ? "_negative" : "_positive");

			let flavourDescription = Text.t(textKeyBase + textKeySuffix + "_description", displayValue, textKeyBase + "_description");
			let functionalDescription = Text.t(textKeyBase + textKeySuffix + "_summary", displayValue, textKeyBase + "_summary");

			switch (type) {
				case UIConstants.CAMP_UNIQUE_FEATURE_HABITABILITY: 
					iconID = value < 1 ? "habitability_negative" : "habitability_positive";
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_RAID_DANGER_FACTOR: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_TRADER_FACTOR: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_DISEASE_FACTOR: 
					iconID = "disease_freq";
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_DISASTER:
					iconID = "disaster_" + value;
					flavourDescription = Text.t(textKeyBase + "_" + value + "_description");
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKER_METAL: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKER_FOOD: 
					if (context.campOrdinal == 8) flavourDescription = Text.t(textKeyBase + "_ground_description");
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKER_WATER: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKER_ARTISAN: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKER_ACADEMIC: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKER_HOPE: 
					break;
				case UIConstants.CAMP_UNIQUE_FEATURE_WORKSHOP:
					iconID = "worker_generic";
					break;
			}
			
			let tooltip = functionalDescription.toLowerCase();
			
			let span = "<div class='" + classes.join(" ") + "'>";
			if (!options.hideIcons) span += this.getThemedIcon(getIconPath(iconID), tooltip, tooltip, "camp-unique-feature-icon");
			if (options.showText && !options.shortText) span += "<div class='camp-unique-feature-label'>" + flavourDescription + "</div>";
			if (options.showText && options.shortText) span += "<div class='camp-unique-feature-label'>" + functionalDescription + "</div>";

			span += "</div>"
			
			return span;
		},

		// options: hideWorkshop, showText, hideIcons, shortText
		getCampUniqueFeaturesDiv: function (features, options) {
			let divClasses = [ "camp-unique-feature-icon-list" ];
			if (options.showText) divClasses.push("camp-unique-feature-icon-list-detailed");
			let div = "<div class='" + divClasses.join(" ") + "'>";

			let items = [];

			if (features.habitability && features.habitability != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_HABITABILITY, value: features.habitability, isNegative: features.habitability < 1 });

			if (features.raidDangerFactor && features.raidDangerFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_RAID_DANGER_FACTOR, value: features.raidDangerFactor, isNegative: features.raidDangerFactor > 1 });

			if (features.traderFactor && features.traderFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_TRADER_FACTOR, value: features.traderFactor, isNegative: features.traderFactor < 1 });

			if (features.diseaseFactor && features.diseaseFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_DISEASE_FACTOR, value: features.diseaseFactor, isNegative: features.diseaseFactor > 1 });

			if (features.signatureDisaster)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_DISASTER, value: features.signatureDisaster, isNegative: true });

			if (features.workerMetalFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKER_METAL, value: features.workerMetalFactor, isNegative: features.workerMetalFactor < 1 });

			if (features.workerFoodFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKER_FOOD, value: features.workerFoodFactor, isNegative: features.workerFoodFactor < 1 });

			if (features.workerWaterFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKER_WATER, value: features.workerWaterFactor, isNegative: features.workerWaterFactor < 1 });

			if (features.workerArtisanFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKER_ARTISAN, value: features.workerArtisanFactor, isNegative: features.workerArtisanFactor < 1 });

			if (features.workerAcademicFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKER_ACADEMIC, value: features.workerAcademicFactor, isNegative: features.workerAcademicFactor < 1 });

			if (features.workerHopeFactor != 1)
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKER_HOPE, value: features.workerHopeFactor, isNegative: features.workerHopeFactor < 1 });

			if (features.workshopResource && !options.hideWorkshop) 
				items.push({ type: UIConstants.CAMP_UNIQUE_FEATURE_WORKSHOP, value: features.workshopResource, isNegative: false });

			if (items.length == 0) return "";

			// negative first
			items = items.sort((a, b) => { return b.isNegative - a.isNegative });

			for (let i = 0; i < items.length; i++) {
				div += this.getCampUniqueFeatureIcon(items[i].type, items[i].value, items[i].isNegative, options, features);
			}

			div += "</div>";

			return div;
		},

		getTimeToNum: function (seconds, hideSeconds) {
			seconds = Math.ceil(Math.abs(seconds));

			var minutes = seconds / 60;
			var hours = minutes / 60;
			var days = hours / 24;

			if (days > 2) {
				return Math.floor(days) + " ngày";
			} else if (hours > 2) {
				return Math.floor(hours) + " giờ";
			} else if (minutes > 2) {
				return Math.floor(minutes) + " phút";
			} else if (hideSeconds) {
				return "sắp xong";
			} else {
				return Math.round(seconds) + " giây";
			}
		},

		getTimeSinceText: function (date) {
			if (typeof date === "number") date = new Date(date);

			var seconds = Math.floor((new Date() - date) / 1000);

			var interval = Math.floor(seconds / 31536000);
			if (interval > 1) {
				return interval + " năm trước";
			}
			interval = Math.floor(seconds / 2592000);
			if (interval > 1) {
				return interval + " tháng trước";
			}
			interval = Math.floor(seconds / 86400);
			if (interval > 1) {
				return interval + " ngày trước";
			}
			interval = Math.floor(seconds / 3600);
			if (interval > 1) {
				return interval + " giờ trước";
			}
			interval = Math.floor(seconds / 60);
			if (interval > 1) {
				return interval + " phút trước";
			}
			if (interval === 1) {
				return interval + " phút trước";
			}
			if (seconds < 10) {
				return "vài giây trước";
			}

			return "chưa đến một phút trước";
		},

		getInGameDate: function (gameTime) {
			var secondSinceGameStart = gameTime;
			var inGameDaysSinceGameStart = Math.floor(secondSinceGameStart / 86400 * 365);
			var inGameWeeksSinceGameStart = inGameDaysSinceGameStart / 40;

			var year = StoryConstants.GAME_START_YEAR;
			var week = StoryConstants.GAME_START_WEEK;
			if (inGameWeeksSinceGameStart < 40 - StoryConstants.GAME_START_WEEK) {
				week += inGameWeeksSinceGameStart;
			} else {
				var weeksSinceFirstNewYear = inGameWeeksSinceGameStart - (40 - StoryConstants.GAME_START_WEEK);
				week = weeksSinceFirstNewYear - (Math.floor(weeksSinceFirstNewYear / 40) * 40) + 1;
				year += 1 + (weeksSinceFirstNewYear) / 40;
			}

			year = Math.floor(year);
			week = Math.floor(week);

			return "Y" + year + "-N" + week;
		},

		getFactorLabel: function (factor) {
			if (factor < 0.5) {
				return "rất thấp";
			}

			if (factor < 1) {
				return "thấp";
			}

			if (factor == 1) {
				return "trung bình";
			}

			if (factor < 1.5) {
				return "cao";
			}

			return "rất cao";
		},

		getUnlockedFeatureDisplayName: function (featureID) {
			switch (featureID) {
				case UIConstants.UNLOCKABLE_FEATURE_MAP_MODES: return "chế độ bản đồ";
				case UIConstants.UNLOCKABLE_FEATURE_WORKER_AUTO_ASSIGNMENT: return "tự động phân công người lao động";
			}
			return featureID;
		},

		getCampDisplayName: function (campNode, short) {
			return "trại ở tầng " + campNode.position.level;
		},

		getCostDisplayName: function (name) {
			if (name.indexOf("item_") == 0) {
				let itemID = name.replace("item_", "");
				let item = ItemConstants.getItemDefinitionByID(itemID, true);
				return ItemConstants.getItemDisplayName(item);
			}

			if (name.indexOf("resource_") == 0) {
				let resourceName = name.split("_")[1];
				return Text.t("game.resources." + resourceName + "_name");
			}

			if (name == "stamina") {
				return Text.t("game.stats.stamina_name");
			}

			if (name == "silver") {
				return Text.t("game.resources.currency_name");
			}

			if (name == "rumours") {
				return Text.t("game.stats.rumours_name");
			}

			if (name == "evidence") {
				return Text.t("game.stats.evidence_name");
			}

			if (name == "explorer_animal") {
				return Text.t("ui.actions.action_cost_explorer_animal_name");
			}

			if (name == "item_disassemblable") {
				return Text.t("ui.actions.action_cost_item_disassemblable_name");
			}

			log.w("no cost display name defined for cost [" + name + "]");
			return name;
		},

		getDropdown: function (id, options) {
			let result = "<select id='" + id + "'>";

			for (let i = 0; i < options.length; i++) {
				let option = options[i];
				let label = option.label;
				result += "<option value='" + option.id + "'>" + label + "</option>";
			}
			
			result += "</select>";
			
			return result;
		},

		roundValue: function (value, showDecimalsWhenSmall, showDecimalsAlways, decimalDivisor) {
			decimalDivisor = decimalDivisor || 100;
			let divisor = 0;
			if (showDecimalsWhenSmall && value <= 10) divisor = decimalDivisor;
			if (showDecimalsAlways) divisor = decimalDivisor;

			let result = value;
			if (value % 1 === 0 || divisor <= 0) {
				result = Math.round(value);
			} else {
				result = Math.round(value * divisor) / divisor;
			}
			
			if (value > 0 && result == 0) {
				return "< 1";
			}
			
			return result;
		},

		highlight: function (text) {
			return "<span class='hl-functionality'>" + text + "</span>";
		},

		warning: function (text, isActive) {
			if (typeof isActive === "undefined") isActive = true;
			if (!isActive) return text;
			return "<span class='warning'>" + text + "</span>";
		},

		meta: function (text) {
			return "<span class='p-meta'>" + text + "</span>";
		},

		getElementName: function ($e) {
			if (!$e) return "[none]";
			if (typeof $e === "string") $e = $($e)
			let id = $e.attr("id");
			if (id) return "#" + id;
			let classes = $e.attr("class");
			if (classes) return "." + classes;
			return "[unknown]";
		},

		isFocusable: function (element) {
			if (!(element instanceof HTMLElement)) {
				return false;
			}
			const knownFocusableElements =
				'a[href],area[href],button:not([disabled]),details,iframe,object,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contentEditable="true"],[tabindex]:not([tabindex^="-"])';
			if (element.matches(knownFocusableElements)) {
				return true;
			}

			const isDisabledCustomElement =
				element.localName.includes('-') && element.matches('[disabled], [aria-disabled="true"]');
			if (isDisabledCustomElement) {
				return false;
			}

			return element.shadowRoot?.delegatesFocus ?? false;
		},

		getDisplayValue: function (value) {
			if (!value) return 0;
			return value.toLocaleString();
		},

		getResourceImg: function (name) {
			let alt = name == "currency" ? Text.t("game.resources.currency_name") : Text.t("game.resources." + name + "_name");
			return "<img src='img/res-" + name + ".png' alt='" + alt + "'/>"
		},
		
		getRangeText: function (range, count) {
			var min = range[0];
			var max = range[1];
			
			if (!count && count !== 0) {
				// text without current count
				if (min >= 0 && max >= 0) {
					return min + "-" + max;
				}
				if (min >= 0) {
					return "tối thiểu " + min;
				}
				if (max >= 0) {
					return "tối đa " + max;
				}
			} else {
				// text with current count
				if (min >= 0 && max >= 0) {
					return count + "/" + min + "-" + max;
				}
				if (min >= 0) {
					return count + "/" + min;
				}
				if (max >= 0) {
					return count + "/" + max;
				}
			}
			
			return "";
		},

		getBagCapacityDisplayValue: function (bagComponent, isSimple) {
			if (bagComponent.bonusCapacity > 0 && !isSimple) {
				return bagComponent.baseCapacity + " +" + bagComponent.bonusCapacity;
			} else {
				return bagComponent.totalCapacity;
			}
		},

		cleanupText: function (text) {
			return text.replace(/'/g, "&#39;")
		},

	};

	return UIConstants;
});
