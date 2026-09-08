define([
	'game/GameGlobals',
], function (GameGlobals) {

	let AccessibilityB1Helper = function (announcer) {
		this.announcer = announcer;
		this.inventoryObserver = null;
		this.mapObserver = null;
		this.lastInventoryIdentity = null;
		this.pendingInventoryIdentity = null;
		this.pendingInventoryUntil = 0;
		this.lastSectorIdentity = null;
		this.pendingSectorIdentity = null;
		this.pendingSectorUntil = 0;
		this.init();
	};

	AccessibilityB1Helper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityB1Helper.prototype.setup = function () {
		document.addEventListener("focusin", (event) => this.onFocusIn(event));
		document.addEventListener("click", (event) => this.onClick(event));
		document.addEventListener("keydown", (event) => this.onKeyDown(event));
		this.observeInventory();
		this.observeMap();
	};

	AccessibilityB1Helper.prototype.onFocusIn = function (event) {
		let target = event.target;
		if (!target || !target.closest) return;

		let inventoryHost = target.closest("#bag-items .item-slot, #container-equipment-slots .item-slot");
		if (inventoryHost) {
			let identity = this.getInventoryIdentity(target, inventoryHost);
			if (identity) this.lastInventoryIdentity = identity;
			this.refreshItemCalloutButtons(inventoryHost);
		}

		let sector = target.closest(".map-overlay-cell");
		if (sector) this.lastSectorIdentity = this.getSectorIdentity(sector);
	};

	AccessibilityB1Helper.prototype.onClick = function (event) {
		let target = event.target;
		if (!target || !target.closest) return;

		let inventoryAction = target.closest(".item-bag-options button.action");
		if (inventoryAction) {
			let action = inventoryAction.getAttribute("action") || "";
			if (/^(equip_|unequip_)/.test(action)) {
				let host = inventoryAction.closest(".item-slot");
				let identity = this.getInventoryIdentity(inventoryAction, host) || this.lastInventoryIdentity;
				this.queueInventoryFocusRestore(identity);
			}
		}

		let sector = target.closest(".map-overlay-cell");
		if (sector) this.queueSectorFocusRestore(this.getSectorIdentity(sector));
	};

	AccessibilityB1Helper.prototype.onKeyDown = function (event) {
		if (event.key !== "Enter" && event.key !== " ") return;
		let target = event.target;
		if (!target || !target.closest) return;
		let sector = target.closest(".map-overlay-cell");
		if (sector) this.queueSectorFocusRestore(this.getSectorIdentity(sector));
	};

	AccessibilityB1Helper.prototype.refreshItemCalloutButtons = function (host) {
		if (!host || !GameGlobals.buttonHelper || !GameGlobals.buttonHelper.updateButtonDisabledState) return;
		let buttons = host.querySelectorAll(".info-callout button.action, .info-callout-content button.action");
		for (let i = 0; i < buttons.length; i++) {
			if (typeof $ === "undefined") return;
			GameGlobals.buttonHelper.updateButtonDisabledState($(buttons[i]));
		}
	};

	AccessibilityB1Helper.prototype.getInventoryIdentity = function (target, host) {
		let item = target && target.closest ? target.closest(".item[data-itemid]") : null;
		if (!item && host && host.querySelector) item = host.querySelector(".item[data-itemid]");
		if (!item) return null;
		return {
			itemID: item.getAttribute("data-itemid") || "",
			instanceID: item.getAttribute("data-iteminstanceid") || "",
		};
	};

	AccessibilityB1Helper.prototype.queueInventoryFocusRestore = function (identity) {
		if (!identity) return;
		this.pendingInventoryIdentity = identity;
		this.pendingInventoryUntil = Date.now() + 1800;
		this.scheduleInventoryRestore(60);
		this.scheduleInventoryRestore(250);
		this.scheduleInventoryRestore(700);
	};

	AccessibilityB1Helper.prototype.scheduleInventoryRestore = function (delay) {
		window.setTimeout(() => this.maybeRestoreInventoryFocus(), delay);
	};

	AccessibilityB1Helper.prototype.maybeRestoreInventoryFocus = function () {
		if (!this.pendingInventoryIdentity) return;
		if (Date.now() > this.pendingInventoryUntil) {
			this.pendingInventoryIdentity = null;
			return;
		}
		if (!this.isFocusLost()) return;

		let target = this.findInventoryFocusTarget(this.pendingInventoryIdentity);
		if (!target) return;
		target.focus();
		this.refreshItemCalloutButtons(target.closest(".item-slot") || target);
		this.pendingInventoryIdentity = null;
		this.announce("Trang bị đã được cập nhật. Vẫn giữ tiêu điểm ở vật phẩm.");
	};

	AccessibilityB1Helper.prototype.findInventoryFocusTarget = function (identity) {
		if (!identity) return null;
		let items = document.querySelectorAll("#bag-items .item[data-itemid], #container-equipment-slots .item[data-itemid]");
		let fallback = null;
		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			if (identity.itemID && item.getAttribute("data-itemid") !== identity.itemID) continue;
			if (!fallback) fallback = item;
			if (identity.instanceID && item.getAttribute("data-iteminstanceid") === identity.instanceID) {
				fallback = item;
				break;
			}
		}
		if (!fallback) return document.getElementById("switch-bag");
		let focusTarget = fallback.closest(".info-callout-target") || fallback;
		if (!focusTarget.hasAttribute("tabindex") && !this.isNativelyFocusable(focusTarget)) {
			focusTarget.setAttribute("tabindex", "0");
		}
		return focusTarget;
	};

	AccessibilityB1Helper.prototype.getSectorIdentity = function (sector) {
		if (!sector) return null;
		return {
			level: sector.getAttribute("data-level") || "",
			x: sector.getAttribute("data-x") || "",
			y: sector.getAttribute("data-y") || "",
		};
	};

	AccessibilityB1Helper.prototype.queueSectorFocusRestore = function (identity) {
		if (!identity) return;
		this.pendingSectorIdentity = identity;
		this.pendingSectorUntil = Date.now() + 1200;
		this.scheduleSectorRestore(60);
		this.scheduleSectorRestore(220);
	};

	AccessibilityB1Helper.prototype.scheduleSectorRestore = function (delay) {
		window.setTimeout(() => this.maybeRestoreSectorFocus(), delay);
	};

	AccessibilityB1Helper.prototype.maybeRestoreSectorFocus = function () {
		if (!this.pendingSectorIdentity) return;
		if (Date.now() > this.pendingSectorUntil) {
			this.pendingSectorIdentity = null;
			return;
		}
		if (!this.isFocusLost()) return;

		let sectors = document.querySelectorAll(".map-overlay-cell");
		for (let i = 0; i < sectors.length; i++) {
			let identity = this.getSectorIdentity(sectors[i]);
			if (!this.sameSector(identity, this.pendingSectorIdentity)) continue;
			sectors[i].focus();
			this.pendingSectorIdentity = null;
			return;
		}
	};

	AccessibilityB1Helper.prototype.sameSector = function (a, b) {
		return !!a && !!b && a.level === b.level && a.x === b.x && a.y === b.y;
	};

	AccessibilityB1Helper.prototype.isFocusLost = function () {
		let active = document.activeElement;
		return !active || active === document.body || active === document.documentElement || active.isConnected === false;
	};

	AccessibilityB1Helper.prototype.isNativelyFocusable = function (element) {
		return !!(element && element.matches && element.matches("button, input, select, textarea, a[href]"));
	};

	AccessibilityB1Helper.prototype.observeInventory = function () {
		if (this.inventoryObserver || typeof MutationObserver === "undefined") return;
		let bag = document.getElementById("bag-items");
		let equipment = document.getElementById("container-equipment-slots");
		if (!bag && !equipment) return;
		this.inventoryObserver = new MutationObserver(() => this.maybeRestoreInventoryFocus());
		let options = { childList: true, subtree: true };
		if (bag) this.inventoryObserver.observe(bag, options);
		if (equipment) this.inventoryObserver.observe(equipment, options);
	};

	AccessibilityB1Helper.prototype.observeMap = function () {
		if (this.mapObserver || typeof MutationObserver === "undefined") return;
		let overlay = document.getElementById("mainmap-overlay");
		if (!overlay) return;
		this.mapObserver = new MutationObserver(() => this.maybeRestoreSectorFocus());
		this.mapObserver.observe(overlay, { childList: true, subtree: true });
	};

	AccessibilityB1Helper.prototype.announce = function (message) {
		if (this.announcer && this.announcer.announcePolite) this.announcer.announcePolite(message);
	};

	return AccessibilityB1Helper;
});
