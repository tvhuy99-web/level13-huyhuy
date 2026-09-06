define([
	'text/Text',
	'game/GameGlobals',
	'game/constants/UpgradeConstants',
	'game/constants/TextConstants',
], function (Text, GameGlobals, UpgradeConstants, TextConstants) {

	let AccessibilityScreenHelper = function () {
		this.observer = null;
		this.refreshTimer = null;
		this.init();
	};

	AccessibilityScreenHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityScreenHelper.prototype.setup = function () {
		this.refresh();
		this.observeScreens();
		document.addEventListener("click", (event) => {
			if (event.target && event.target.closest && event.target.closest(".btn-trade-caravans-outgoing-toggle")) {
				window.setTimeout(() => this.configureTrade(), 0);
			}
		});
	};

	AccessibilityScreenHelper.prototype.refresh = function () {
		this.configureCampWorkers();
		this.configureTrade();
		this.configureExplorers();
		this.configureProjects();
		this.configureUpgradeRows();
		this.updateResearchedUpgrades();
	};

	AccessibilityScreenHelper.prototype.scheduleRefresh = function () {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refresh();
		}, 80);
	};

	AccessibilityScreenHelper.prototype.configureCampWorkers = function () {
		let rows = document.querySelectorAll("#in-assign-workers tr");
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let workerLabel = row.querySelector(".in-assign-worker-desc");
			let worker = this.normalize(workerLabel ? workerLabel.textContent : "");
			if (!worker) continue;

			let input = row.querySelector(".stepper input.amount");
			if (input) {
				input.setAttribute("aria-label", worker + " workers");
				let buttons = row.querySelectorAll(".stepper button[data-type]");
				for (let j = 0; j < buttons.length; j++) {
					let action = buttons[j].getAttribute("data-type") === "plus" ? "Increase" : "Decrease";
					buttons[j].setAttribute("aria-label", action + " " + worker + " workers");
					if (input.id) buttons[j].setAttribute("aria-controls", input.id);
				}
			}

			let auto = row.querySelector("input.in-assign-workers-auto-toggle");
			if (auto) auto.setAttribute("aria-label", "Auto-assign " + worker + " workers");
		}
	};

	AccessibilityScreenHelper.prototype.configureTrade = function () {
		let partnerRows = document.querySelectorAll("#trade-caravans-outgoing-container tr.trade-caravans-outgoing");
		for (let i = 0; i < partnerRows.length; i++) {
			let row = partnerRows[i];
			let partner = this.normalize((row.querySelector(".item-name") || {}).textContent);
			let toggle = row.querySelector(".btn-trade-caravans-outgoing-toggle");
			let ordinal = row.id ? row.id.replace("trade-caravans-outgoing-", "") : "";
			let plan = ordinal ? document.getElementById("trade-caravans-outgoing-plan-" + ordinal) : null;
			if (toggle && plan) {
				toggle.setAttribute("aria-controls", plan.id);
				toggle.setAttribute("aria-expanded", this.isVisible(plan) ? "true" : "false");
				if (partner) toggle.setAttribute("aria-label", "Send caravan to " + partner);
			}
			if (!plan) continue;

			let sellSelect = plan.querySelector(".trade-caravans-outgoing-select-sell");
			let buySelect = plan.querySelector(".trade-caravans-outgoing-select-buy");
			let sellRange = plan.querySelector(".trade-caravans-outgoing-range-sell");
			if (sellSelect) sellSelect.setAttribute("aria-label", "Resource to send to " + (partner || "trade partner"));
			if (buySelect) buySelect.setAttribute("aria-label", "Resource to receive from " + (partner || "trade partner"));
			if (sellRange) {
				sellRange.setAttribute("aria-label", "Amount to send to " + (partner || "trade partner"));
				this.updateRangeValue(sellRange);
				if (sellRange.getAttribute("data-accessibility-range-bound") !== "true") {
					sellRange.setAttribute("data-accessibility-range-bound", "true");
					sellRange.addEventListener("input", () => this.updateRangeValue(sellRange));
					sellRange.addEventListener("change", () => this.updateRangeValue(sellRange));
				}
			}
		}
	};

	AccessibilityScreenHelper.prototype.updateRangeValue = function (range) {
		if (!range) return;
		range.setAttribute("aria-valuenow", range.value);
		range.setAttribute("aria-valuetext", range.value);
	};

	AccessibilityScreenHelper.prototype.configureExplorers = function () {
		let slots = document.querySelectorAll("#container-party-slots .explorer-slot");
		for (let i = 0; i < slots.length; i++) {
			let slot = slots[i];
			let type = this.normalize((slot.querySelector(".explorer-slot-type-empty, .explorer-slot-type-selected") || {}).textContent);
			slot.setAttribute("role", "group");
			if (type) slot.setAttribute("aria-label", type + " explorer slot");
		}

		let explorers = document.querySelectorAll("#container-tab-two-explorers .npc-container");
		for (let i = 0; i < explorers.length; i++) {
			let explorer = explorers[i];
			let portrait = explorer.querySelector("img.portrait[alt]");
			let name = this.normalize(portrait ? portrait.getAttribute("alt") : "");
			if (!name) {
				let nameSpan = explorer.querySelector(":scope > span");
				name = this.normalize(nameSpan ? nameSpan.textContent : "");
			}
			if (name) explorer.setAttribute("aria-label", name);

			let buttons = explorer.querySelectorAll("button[action]");
			for (let j = 0; j < buttons.length; j++) {
				let button = buttons[j];
				let action = button.getAttribute("action") || "";
				let label = "";
				if (action.indexOf("start_explorer_dialogue_") === 0) label = "Talk to " + name;
				else if (action.indexOf("select_explorer_") === 0) label = "Add " + name + " to party";
				else if (action.indexOf("deselect_explorer_") === 0) label = "Remove " + name + " from party";
				else if (action.indexOf("dismiss_explorer_") === 0) label = "Dismiss " + name;
				else if (action.indexOf("heal_explorer_") === 0) label = "Heal " + name;
				if (label && name) button.setAttribute("aria-label", label);
			}
		}
	};

	AccessibilityScreenHelper.prototype.configureProjects = function () {
		let tables = document.querySelectorAll("#container-tab-two-projects table");
		for (let i = 0; i < tables.length; i++) {
			let rows = tables[i].querySelectorAll("tr");
			for (let j = 0; j < rows.length; j++) {
				let row = rows[j];
				let nameCell = row.querySelector("td.label");
				let name = this.normalize(nameCell ? nameCell.textContent : "");
				if (!name) continue;
				row.setAttribute("aria-label", name);

				let hide = row.querySelector("button.hide-project");
				let map = row.querySelector("button.navigation");
				let action = row.querySelector("button.action");
				if (hide) hide.setAttribute("aria-label", "Hide project " + name);
				if (map) map.setAttribute("aria-label", "Show project " + name + " on map");
				if (action) {
					let actionText = this.normalize(action.textContent) || "Build";
					action.setAttribute("aria-label", actionText + " " + name);
				}
			}
		}
	};

	AccessibilityScreenHelper.prototype.configureUpgradeRows = function () {
		let rows = document.querySelectorAll("#upgrades-list tr, #blueprints-list tr");
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let button = row.querySelector("button.action");
			if (!button) continue;
			let rowText = this.normalize(row.textContent);
			let actionText = this.normalize(button.textContent);
			let context = rowText;
			if (actionText && context.toLowerCase().endsWith(actionText.toLowerCase())) {
				context = this.normalize(context.substring(0, context.length - actionText.length));
			}
			if (context) button.setAttribute("aria-label", actionText + " " + context);
		}
	};

	AccessibilityScreenHelper.prototype.updateResearchedUpgrades = function () {
		let host = document.getElementById("world-upgrades-info");
		if (!host || !GameGlobals.tribeHelper) return;

		let section = document.getElementById("accessibility-researched-upgrades");
		if (!section) {
			section = document.createElement("section");
			section.id = "accessibility-researched-upgrades";
			section.className = "hide-from-visual-layout";
			section.setAttribute("aria-label", "Researched upgrades");
			section.innerHTML = "<h3>Researched upgrades</h3><ul></ul>";
			host.appendChild(section);
		}

		let list = section.querySelector("ul");
		if (!list) return;
		let items = [];
		for (let id in UpgradeConstants.upgradeDefinitions) {
			let status = GameGlobals.tribeHelper.getUpgradeStatus(id);
			if (status !== UpgradeConstants.upgradeStatus.UNLOCKED) continue;
			let name = TextConstants.getUpgradeDisplayName(id);
			let description = Text.t(UpgradeConstants.getDescriptionTextKey(id));
			items.push("<li><strong>" + this.escapeHTML(name) + "</strong>. " + this.escapeHTML(description) + "</li>");
		}
		let html = items.join("");
		if (list.innerHTML !== html) list.innerHTML = html;
	};

	AccessibilityScreenHelper.prototype.observeScreens = function () {
		if (this.observer || typeof MutationObserver === "undefined") return;
		let root = document.getElementById("grid-switch-content");
		if (!root) return;
		this.observer = new MutationObserver(() => this.scheduleRefresh());
		this.observer.observe(root, { childList: true, subtree: true });
	};

	AccessibilityScreenHelper.prototype.isVisible = function (element) {
		if (!element) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	AccessibilityScreenHelper.prototype.normalize = function (value) {
		return String(value || "").replace(/\s+/g, " ").trim();
	};

	AccessibilityScreenHelper.prototype.escapeHTML = function (value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	};

	return AccessibilityScreenHelper;
});
