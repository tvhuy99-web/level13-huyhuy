define([], function () {

	let AccessibilityFinalAuditHelper = function (announcer) {
		this.announcer = announcer;
		this.observer = null;
		this.refreshTimer = null;
		this.pendingSelectionFocus = null;
		this.pendingSelectionFocusUntil = 0;
		this.init();
	};

	AccessibilityFinalAuditHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityFinalAuditHelper.prototype.setup = function () {
		this.configureAll();
		this.bindGlobalInteractions();
		this.observeDynamicUI();
	};

	AccessibilityFinalAuditHelper.prototype.configureAll = function () {
		this.configureSaveManagement();
		this.configureSelectionLists();
		this.configureHorizontalSelects();
		this.configureEmbark();
		this.configureWorldOverview();
	};

	AccessibilityFinalAuditHelper.prototype.scheduleRefresh = function () {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.configureAll();
			this.maybeRestoreSelectionFocus();
		}, 40);
	};

	AccessibilityFinalAuditHelper.prototype.configureSaveManagement = function () {
		let saveList = document.getElementById("save-list");
		if (saveList) {
			saveList.setAttribute("role", "listbox");
			saveList.setAttribute("aria-label", "Save slots");
		}

		let slots = document.querySelectorAll("#save-list .li-save-slot");
		for (let i = 0; i < slots.length; i++) {
			let slot = slots[i];
			slot.setAttribute("role", "option");
			slot.setAttribute("tabindex", "0");
			slot.setAttribute("aria-selected", slot.classList.contains("selected") ? "true" : "false");
			let label = this.normalize(slot.textContent);
			if (label) slot.setAttribute("aria-label", label);
			this.bindActivateOnKeyboard(slot);
		}

		this.setLabel("#textarea-export-save", "Exported save data");
		this.setLabel("#textarea-import-save", "Imported save data");
		this.setStatus("#save-export-info", "polite");
		this.setStatus("#import-save-msg", "polite");
		this.setStatus("#save-list-options-info", "polite");
	};

	AccessibilityFinalAuditHelper.prototype.configureSelectionLists = function () {
		let knownGroups = {
			"resultlist-inventorymanagement-found": "Found items and resources",
			"resultlist-inventorymanagement-kept": "Kept items and resources",
			"resultlist-loststuff-lost": "Lost items and resources",
			"inventorylist-incoming-caravan-trader-inventory": "Trader inventory",
			"inventorylist-incoming-caravan-trader-offer": "Trader offer",
			"inventorylist-incoming-caravan-camp-inventory": "Camp inventory",
			"inventorylist-incoming-caravan-camp-offer": "Camp offer",
		};

		for (let id in knownGroups) {
			let host = document.getElementById(id);
			if (!host) continue;
			let list = host.querySelector("ul");
			if (list) {
				list.setAttribute("role", "group");
				list.setAttribute("aria-label", knownGroups[id]);
			}
			let items = host.querySelectorAll("li");
			for (let i = 0; i < items.length; i++) this.configureSelectionItem(items[i], id);
		}
	};

	AccessibilityFinalAuditHelper.prototype.configureSelectionItem = function (item, hostID) {
		if (!item) return;
		let isLostOnly = hostID === "resultlist-loststuff-lost";
		if (!isLostOnly) {
			item.setAttribute("role", "button");
			item.setAttribute("tabindex", "0");
			this.bindActivateOnKeyboard(item);
		}

		let objectName = this.getSelectionObjectName(item);
		let prefix = "";
		switch (hostID) {
			case "resultlist-inventorymanagement-found": prefix = "Take"; break;
			case "resultlist-inventorymanagement-kept": prefix = "Leave"; break;
			case "resultlist-loststuff-lost": prefix = "Lost"; break;
			case "inventorylist-incoming-caravan-trader-inventory": prefix = "Add from trader"; break;
			case "inventorylist-incoming-caravan-trader-offer": prefix = "Remove from trader offer"; break;
			case "inventorylist-incoming-caravan-camp-inventory": prefix = "Offer from camp"; break;
			case "inventorylist-incoming-caravan-camp-offer": prefix = "Remove from camp offer"; break;
		}
		if (objectName) item.setAttribute("aria-label", (prefix ? prefix + " " : "") + objectName);

		let calloutTarget = item.querySelector(".info-callout-target");
		if (calloutTarget && calloutTarget !== item) {
			calloutTarget.setAttribute("tabindex", "-1");
			if (calloutTarget.getAttribute("role") === "note") calloutTarget.removeAttribute("role");
		}
		let callout = item.querySelector(".info-callout");
		if (callout) {
			let id = this.ensureID(callout, "accessibility-selection-details");
			this.appendAriaReference(item, "aria-describedby", id);
		}
	};

	AccessibilityFinalAuditHelper.prototype.getSelectionObjectName = function (item) {
		if (!item) return "";
		let image = item.querySelector("img[alt]");
		let alt = image ? this.normalize(image.getAttribute("alt")) : "";
		let resource = item.querySelector(".res");
		let resourceName = resource ? this.normalize(resource.getAttribute("data-resourcename")) : "";
		let text = this.normalize(item.textContent);
		return alt || resourceName || text || "item";
	};

	AccessibilityFinalAuditHelper.prototype.configureHorizontalSelects = function () {
		let containers = document.querySelectorAll(".horizontal-select");
		for (let i = 0; i < containers.length; i++) {
			let container = containers[i];
			let title = container.querySelector(".horizontal-select-title");
			let label = this.normalize(title ? title.textContent : "Selection");
			let list = container.querySelector(".horizontal-select-list");
			if (!list) continue;
			list.setAttribute("role", "radiogroup");
			list.setAttribute("aria-label", label || "Selection");
			let options = list.querySelectorAll(".horizontal-select-option");
			for (let j = 0; j < options.length; j++) {
				let option = options[j];
				let selected = option.classList.contains("selected");
				option.setAttribute("role", "radio");
				option.setAttribute("aria-checked", selected ? "true" : "false");
				option.setAttribute("tabindex", selected ? "0" : "-1");
				if (!option.getAttribute("aria-label")) {
					let optionLabel = this.normalize(option.textContent);
					if (optionLabel) option.setAttribute("aria-label", optionLabel);
				}
				this.bindHorizontalSelectKeyboard(option);
			}
		}
	};

	AccessibilityFinalAuditHelper.prototype.bindHorizontalSelectKeyboard = function (option) {
		if (!option || option.getAttribute("data-accessibility-horizontal-bound") === "true") return;
		option.setAttribute("data-accessibility-horizontal-bound", "true");
		option.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				option.click();
				window.setTimeout(() => this.configureHorizontalSelects(), 0);
				return;
			}
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
			event.preventDefault();
			let options = Array.from(option.parentElement.querySelectorAll(".horizontal-select-option"));
			let index = options.indexOf(option);
			if (index < 0 || options.length < 1) return;
			let delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
			let next = options[(index + delta + options.length) % options.length];
			next.click();
			this.configureHorizontalSelects();
			next.focus();
		});
	};

	AccessibilityFinalAuditHelper.prototype.configureEmbark = function () {
		this.configureEmbarkRows("#embark-resources tr");
		this.configureEmbarkRows("#embark-items tr");
		this.setStatus("#embark-warning", "polite");
	};

	AccessibilityFinalAuditHelper.prototype.configureEmbarkRows = function (selector) {
		let rows = document.querySelectorAll(selector);
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let firstCell = row.querySelector("td");
			let name = this.normalize(firstCell ? firstCell.textContent : "");
			if (!name && row.id) name = this.humanize(row.id.replace(/^embark-assign-/, ""));
			if (!name) continue;
			let input = row.querySelector(".stepper input.amount");
			if (input) {
				input.setAttribute("aria-label", "Amount of " + name + " to carry");
				let buttons = row.querySelectorAll(".stepper button[data-type]");
				for (let j = 0; j < buttons.length; j++) {
					let verb = buttons[j].getAttribute("data-type") === "plus" ? "Increase" : "Decrease";
					buttons[j].setAttribute("aria-label", verb + " " + name + " to carry");
					if (input.id) buttons[j].setAttribute("aria-controls", input.id);
				}
			}
			let images = row.querySelectorAll("td:first-child img");
			for (let j = 0; j < images.length; j++) {
				images[j].setAttribute("alt", "");
				images[j].setAttribute("aria-hidden", "true");
			}
		}
	};

	AccessibilityFinalAuditHelper.prototype.configureWorldOverview = function () {
		let rows = document.querySelectorAll("#camp-overview tr.camp-overview-camp");
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let button = row.querySelector("button.action-move");
			if (!button) continue;
			let campName = this.normalize(row.querySelector(".camp-overview-name .label") ? row.querySelector(".camp-overview-name .label").textContent : "");
			let level = this.normalize(row.querySelector(".camp-overview-level-container") ? row.querySelector(".camp-overview-level-container").textContent : "");
			let target = campName || (level ? "camp on " + level : "camp");
			button.setAttribute("aria-label", "Go to " + target);
		}
	};

	AccessibilityFinalAuditHelper.prototype.bindGlobalInteractions = function () {
		if (document.documentElement.getAttribute("data-accessibility-final-audit-bound") === "true") return;
		document.documentElement.setAttribute("data-accessibility-final-audit-bound", "true");

		document.addEventListener("click", (event) => {
			let target = event.target && event.target.closest ? event.target.closest("li") : null;
			if (target && this.isManagedSelectionItem(target)) {
				this.queueSelectionFocusRestore(target);
			}

			let clickable = event.target && event.target.closest ? event.target.closest("#open-import, #open-save-list, #btn-save-list-options-export, #btn-back-from-export") : null;
			if (clickable) this.handleSaveViewFocus(clickable.id);
		}, true);
	};

	AccessibilityFinalAuditHelper.prototype.handleSaveViewFocus = function (id) {
		let selector = null;
		if (id === "open-import") selector = "#textarea-import-save";
		else if (id === "open-save-list") selector = "#save-list .li-save-slot";
		else if (id === "btn-save-list-options-export") selector = "#textarea-export-save";
		else if (id === "btn-back-from-export") selector = "#btn-save-list-options-export";
		if (!selector) return;
		window.setTimeout(() => {
			this.configureSaveManagement();
			let target = document.querySelector(selector);
			if (target && this.isVisible(target) && typeof target.focus === "function") target.focus();
		}, 80);
	};

	AccessibilityFinalAuditHelper.prototype.isManagedSelectionItem = function (item) {
		if (!item || !item.closest) return false;
		return !!item.closest(
			"#resultlist-inventorymanagement-found, #resultlist-inventorymanagement-kept, " +
			"#inventorylist-incoming-caravan-trader-inventory, #inventorylist-incoming-caravan-trader-offer, " +
			"#inventorylist-incoming-caravan-camp-inventory, #inventorylist-incoming-caravan-camp-offer"
		);
	};

	AccessibilityFinalAuditHelper.prototype.queueSelectionFocusRestore = function (item) {
		let host = item.parentElement && item.parentElement.closest ? item.parentElement.closest("[id]") : null;
		let resource = item.querySelector(".res[data-resourcename]");
		let object = item.querySelector(".item[data-itemid]");
		this.pendingSelectionFocus = {
			hostID: host ? host.id : "",
			resource: resource ? resource.getAttribute("data-resourcename") : "",
			itemID: object ? object.getAttribute("data-itemid") : "",
			instanceID: object ? object.getAttribute("data-iteminstanceid") : "",
			label: item.getAttribute("aria-label") || this.normalize(item.textContent),
		};
		this.pendingSelectionFocusUntil = Date.now() + 1500;
		window.setTimeout(() => this.maybeRestoreSelectionFocus(), 30);
		window.setTimeout(() => this.maybeRestoreSelectionFocus(), 150);
		window.setTimeout(() => this.maybeRestoreSelectionFocus(), 500);
	};

	AccessibilityFinalAuditHelper.prototype.maybeRestoreSelectionFocus = function () {
		if (!this.pendingSelectionFocus) return;
		if (Date.now() > this.pendingSelectionFocusUntil) {
			this.pendingSelectionFocus = null;
			return;
		}
		if (!this.isFocusLost()) return;
		this.configureSelectionLists();
		let target = this.findSelectionFocusTarget(this.pendingSelectionFocus);
		if (!target) return;
		target.focus();
		this.pendingSelectionFocus = null;
	};

	AccessibilityFinalAuditHelper.prototype.findSelectionFocusTarget = function (identity) {
		let selector = this.getSelectionIdentitySelector(identity);
		let candidates = [];
		if (identity.hostID) {
			let host = document.getElementById(identity.hostID);
			if (host && selector) candidates = Array.from(host.querySelectorAll("li" + selector));
		}
		if (candidates.length < 1 && selector) {
			let managed = document.querySelectorAll(
				"#resultlist-inventorymanagement-found li, #resultlist-inventorymanagement-kept li, " +
				"#inventorylist-incoming-caravan-trader-inventory li, #inventorylist-incoming-caravan-trader-offer li, " +
				"#inventorylist-incoming-caravan-camp-inventory li, #inventorylist-incoming-caravan-camp-offer li"
			);
			for (let i = 0; i < managed.length; i++) {
				if (this.selectionItemMatches(managed[i], identity)) candidates.push(managed[i]);
			}
		}
		if (candidates.length > 0) return candidates[0];
		let popup = document.querySelector(".popup[style*='display: block'], .popup[data-visible='true']");
		return popup ? popup.querySelector("button:not([disabled]), [tabindex='0']") : null;
	};

	AccessibilityFinalAuditHelper.prototype.getSelectionIdentitySelector = function (identity) {
		if (identity.resource) return ":has(.res[data-resourcename='" + this.escapeSelector(identity.resource) + "'])";
		if (identity.itemID) return ":has(.item[data-itemid='" + this.escapeSelector(identity.itemID) + "'])";
		return "";
	};

	AccessibilityFinalAuditHelper.prototype.selectionItemMatches = function (item, identity) {
		if (identity.resource) {
			let resource = item.querySelector(".res[data-resourcename]");
			return !!resource && resource.getAttribute("data-resourcename") === identity.resource;
		}
		if (identity.itemID) {
			let object = item.querySelector(".item[data-itemid]");
			if (!object || object.getAttribute("data-itemid") !== identity.itemID) return false;
			if (identity.instanceID && object.getAttribute("data-iteminstanceid") === identity.instanceID) return true;
			return true;
		}
		return false;
	};

	AccessibilityFinalAuditHelper.prototype.bindActivateOnKeyboard = function (element) {
		if (!element || element.getAttribute("data-accessibility-activate-bound") === "true") return;
		element.setAttribute("data-accessibility-activate-bound", "true");
		element.addEventListener("keydown", function (event) {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			element.click();
		});
	};

	AccessibilityFinalAuditHelper.prototype.observeDynamicUI = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			let relevant = false;
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				if (mutation.type === "childList" || mutation.type === "characterData") relevant = true;
				if (mutation.type === "attributes") {
					let target = mutation.target;
					if (target && target.matches && target.matches(".li-save-slot, .horizontal-select-option")) relevant = true;
				}
				if (relevant) break;
			}
			if (relevant) this.scheduleRefresh();
		});
		this.observer.observe(document.body, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["class"],
			subtree: true,
		});
	};

	AccessibilityFinalAuditHelper.prototype.setLabel = function (selector, label) {
		let element = document.querySelector(selector);
		if (element) element.setAttribute("aria-label", label);
	};

	AccessibilityFinalAuditHelper.prototype.setStatus = function (selector, politeness) {
		let element = document.querySelector(selector);
		if (!element) return;
		element.setAttribute("role", "status");
		element.setAttribute("aria-live", politeness || "polite");
		element.setAttribute("aria-atomic", "true");
	};

	AccessibilityFinalAuditHelper.prototype.appendAriaReference = function (element, attribute, id) {
		if (!element || !id) return;
		let ids = (element.getAttribute(attribute) || "").split(/\s+/).filter(Boolean);
		if (ids.indexOf(id) < 0) ids.push(id);
		element.setAttribute(attribute, ids.join(" "));
	};

	AccessibilityFinalAuditHelper.prototype.ensureID = function (element, prefix) {
		if (element.id) return element.id;
		let i = 1;
		let id = prefix + "-" + i;
		while (document.getElementById(id)) id = prefix + "-" + (++i);
		element.id = id;
		return id;
	};

	AccessibilityFinalAuditHelper.prototype.isFocusLost = function () {
		let active = document.activeElement;
		return !active || active === document.body || active === document.documentElement || active.isConnected === false;
	};

	AccessibilityFinalAuditHelper.prototype.isVisible = function (element) {
		if (!element) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	AccessibilityFinalAuditHelper.prototype.normalize = function (value) {
		return String(value || "").replace(/\s+/g, " ").trim();
	};

	AccessibilityFinalAuditHelper.prototype.humanize = function (value) {
		return this.normalize(String(value || "").replace(/[_-]+/g, " "));
	};

	AccessibilityFinalAuditHelper.prototype.escapeSelector = function (value) {
		if (window.CSS && window.CSS.escape) return window.CSS.escape(String(value));
		return String(value).replace(/['\\]/g, "\\$&");
	};

	return AccessibilityFinalAuditHelper;
});
