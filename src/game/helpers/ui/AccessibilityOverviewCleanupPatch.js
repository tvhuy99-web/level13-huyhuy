define([
	'game/helpers/ui/AccessibilityMobileExperienceHelper'
], function (AccessibilityMobileExperienceHelper) {

	let H = AccessibilityMobileExperienceHelper;

	H.prototype.renderHeaderOverview = function () {
		let host = document.getElementById("unit-main") || document.body;
		if (!host) return;

		let summary = document.getElementById("accessibility-player-overview");
		if (!summary) {
			summary = document.createElement("p");
			summary.id = "accessibility-player-overview";
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-key", "player-overview");
			host.insertBefore(summary, host.firstChild);
		}

		let inventorySummary = document.getElementById("accessibility-inventory-camp-overview");
		if (!inventorySummary) {
			inventorySummary = document.createElement("p");
			inventorySummary.id = "accessibility-inventory-camp-overview";
			inventorySummary.className = "hide-from-visual-layout accessibility-compact-summary";
			inventorySummary.setAttribute("data-a11y-summary", "1");
			inventorySummary.setAttribute("data-a11y-summary-key", "inventory-camp-overview");
			if (summary.nextSibling) host.insertBefore(inventorySummary, summary.nextSibling);
			else host.appendChild(inventorySummary);
		}

		let playerParts = [];
		let player = this.overviewPlayerStatusText();
		if (player) playerParts.push("Player status. " + player);
		let statuses = this.statusText();
		if (statuses) playerParts.push("Status effects. " + statuses);
		let equipment = this.overviewEquipmentText();
		if (equipment) playerParts.push("Equipment stats. " + equipment);

		let inventoryParts = [];
		let bag = this.overviewInventoryText();
		if (bag) inventoryParts.push("Inventory. " + bag);
		let tribe = this.overviewNonZeroStatText(".statsbar-tribe-stats");
		if (tribe) inventoryParts.push("Tribe stats. " + tribe);
		let camp = this.overviewCampText();
		if (camp) inventoryParts.push("Camp. " + camp);

		let playerText = "Player overview. " + (playerParts.length ? playerParts.join(". ") : "No player status information available yet.");
		let inventoryText = "Inventory and camp overview. " + (inventoryParts.length ? inventoryParts.join(". ") : "No inventory or camp information available yet.");
		if (summary.textContent !== playerText) summary.textContent = playerText;
		if (inventorySummary.textContent !== inventoryText) inventorySummary.textContent = inventoryText;

		let summaries = [summary, inventorySummary];
		for (let i = 0; i < summaries.length; i++) {
			summaries[i].setAttribute("data-a11y-overview-clean", "1");
			summaries[i].removeAttribute("tabindex");
			summaries[i].removeAttribute("aria-label");
			summaries[i].removeAttribute("role");
			summaries[i].removeAttribute("aria-hidden");
		}
	};

	H.prototype.overviewPlayerStatusText = function () {
		let containers = document.querySelectorAll(".player-stats-container");
		for (let i = 0; i < containers.length; i++) {
			let indicators = containers[i].querySelectorAll(".stat-indicator");
			let parts = [];
			for (let j = 0; j < indicators.length; j++) {
				let indicator = indicators[j];
				let label = indicator.querySelector(".label");
				let value = indicator.querySelector(".value");
				let name = this.norm(label && label.textContent) || this.alt(indicator);
				let valueText = this.norm(value && value.textContent);
				if (!name || !valueText) continue;
				let isCore = indicator.classList.contains("stat-indicator-vision") ||
					indicator.classList.contains("stat-indicator-health") ||
					indicator.classList.contains("stat-indicator-stamina");
				if (!isCore && !this.overviewHasNonZeroNumber(valueText)) continue;
				parts.push(this.unique(name, valueText));
			}
			parts = this.dedupeParts(parts);
			if (parts.length) return parts.join(". ");
		}
		return "";
	};

	H.prototype.overviewEquipmentText = function () {
		let containers = document.querySelectorAll(".container-equipment-stats");
		let parts = [];
		let seen = {};
		for (let i = 0; i < containers.length; i++) {
			let indicators = containers[i].querySelectorAll(".stat-indicator");
			for (let j = 0; j < indicators.length; j++) {
				let indicator = indicators[j];
				let label = indicator.querySelector(".label");
				let value = indicator.querySelector(".value");
				let name = this.norm(label && label.textContent) || this.alt(indicator);
				let valueText = this.norm(value && value.textContent);
				if (!name || !valueText || !this.overviewHasNonZeroNumber(valueText)) continue;
				let numericValue = this.overviewFirstNumber(valueText);
				if (indicator.classList.contains("stats-equipment-movement") && numericValue === 1) continue;
				let key = name.toLowerCase();
				if (seen[key]) continue;
				seen[key] = true;
				parts.push(this.unique(name, valueText));
			}
		}
		return parts.join(". ");
	};

	H.prototype.overviewInventoryText = function () {
		let parts = [];
		let storage = this.overviewPairText(["header-bag-storage-mobile", "header-bag-storage-regular"], false, true);
		if (storage) parts.push(storage);
		let currency = this.overviewPairText(["header-bag-currency-mobile", "header-bag-currency-regular"], true, false);
		if (currency) parts.push(currency);
		let resources = this.overviewResourceText("bag");
		if (resources) parts.push(resources);
		return this.dedupeParts(parts).join(". ");
	};

	H.prototype.overviewCampText = function () {
		let parts = [];
		let storage = this.overviewPairText(["header-camp-storage-mobile", "header-camp-storage-regular"], true, false);
		let reputation = this.overviewPairText(["header-camp-reputation-mobile", "header-camp-reputation-regular"], false, false);
		let population = this.overviewPairText(["header-camp-population-mobile", "header-camp-population-regular"], false, false);
		let currency = this.overviewPairText(["header-camp-currency-mobile", "header-camp-currency-regular"], true, false);
		let resources = this.overviewResourceText("camp");
		if (storage) parts.push(storage);
		if (reputation) parts.push(reputation);
		if (population) parts.push(population);
		if (currency) parts.push(currency);
		if (resources) parts.push(resources);
		return this.dedupeParts(parts).join(". ");
	};

	H.prototype.overviewPairText = function (ids, requireNonZeroValue, requireAnyNonZero) {
		for (let i = 0; i < ids.length; i++) {
			let e = document.getElementById(ids[i]);
			if (!e) continue;
			let label = e.querySelector(".label");
			let value = e.querySelector(".value");
			let total = e.querySelector(".value-total");
			let name = this.norm(label && label.textContent) || this.alt(e);
			let valueText = this.norm(value && value.textContent);
			let totalText = this.norm(total && total.textContent);
			if (!name || !valueText) continue;
			if (requireNonZeroValue && !this.overviewHasNonZeroNumber(valueText)) continue;
			if (requireAnyNonZero && !this.overviewHasNonZeroNumber(valueText + " " + totalText)) continue;
			let text = this.unique(name, valueText);
			if (totalText) text = this.unique(text, "total " + totalText);
			return text;
		}
		return "";
	};

	H.prototype.overviewResourceText = function (kind) {
		let selector = "[id^='resources-" + kind + "-mobile-'],[id^='resources-" + kind + "-regular-']";
		let resources = document.querySelectorAll(selector);
		let parts = [];
		let seen = {};
		for (let i = 0; i < resources.length; i++) {
			let resource = resources[i];
			let label = resource.querySelector(".label");
			let value = resource.querySelector(".value");
			let name = this.norm(label && label.textContent) || this.alt(resource);
			let valueText = this.norm(value && value.textContent);
			if (!name || !valueText || !this.overviewHasNonZeroNumber(valueText)) continue;
			let key = name.toLowerCase();
			if (seen[key]) continue;
			seen[key] = true;
			parts.push(this.unique(name, valueText));
		}
		return parts.join(". ");
	};

	H.prototype.overviewNonZeroStatText = function (selector) {
		let containers = document.querySelectorAll(selector);
		let parts = [];
		let seen = {};
		for (let i = 0; i < containers.length; i++) {
			let indicators = containers[i].querySelectorAll(".stat-indicator");
			for (let j = 0; j < indicators.length; j++) {
				let indicator = indicators[j];
				let label = indicator.querySelector(".label");
				let value = indicator.querySelector(".value");
				let name = this.norm(label && label.textContent) || this.alt(indicator);
				let valueText = this.norm(value && value.textContent);
				if (!name || !valueText || !this.overviewHasNonZeroNumber(valueText)) continue;
				let key = name.toLowerCase();
				if (seen[key]) continue;
				seen[key] = true;
				parts.push(this.unique(name, valueText));
			}
		}
		return parts.join(". ");
	};

	H.prototype.overviewHasNonZeroNumber = function (text) {
		let normalized = String(text || "").replace(/,/g, ".");
		let matches = normalized.match(/-?\d+(?:\.\d+)?/g) || [];
		for (let i = 0; i < matches.length; i++) {
			let n = parseFloat(matches[i]);
			if (!isNaN(n) && Math.abs(n) > 0.000001) return true;
		}
		return false;
	};

	H.prototype.overviewFirstNumber = function (text) {
		let normalized = String(text || "").replace(/,/g, ".");
		let match = normalized.match(/-?\d+(?:\.\d+)?/);
		return match ? parseFloat(match[0]) : null;
	};

	return H;
});
