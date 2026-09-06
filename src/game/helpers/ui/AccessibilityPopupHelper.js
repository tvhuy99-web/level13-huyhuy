define([], function () {

	let AccessibilityPopupHelper = function () {
		this.popupStates = new Map();
		this.observer = null;
		this.generatedIDCounter = 0;
		this.init();
	};

	AccessibilityPopupHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityPopupHelper.prototype.setup = function () {
		this.configurePopups(document);
		this.observePopups();
	};

	AccessibilityPopupHelper.prototype.configurePopups = function (root) {
		if (!root) return;
		let popups = [];
		if (root.matches && root.matches(".popup")) popups.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".popup");
			for (let i = 0; i < nested.length; i++) popups.push(nested[i]);
		}

		for (let i = 0; i < popups.length; i++) {
			let popup = popups[i];
			if (!popup.getAttribute("role")) popup.setAttribute("role", "dialog");
			popup.setAttribute("aria-modal", "true");
			this.ensurePopupLabel(popup);
			this.configurePopupFields(popup);
			this.bindFocusTrap(popup);

			if (!this.popupStates.has(popup)) {
				this.popupStates.set(popup, {
					isOpen: this.isVisible(popup),
					opener: null,
				});
			}
		}
	};

	AccessibilityPopupHelper.prototype.ensurePopupLabel = function (popup) {
		if (popup.getAttribute("aria-label") || popup.getAttribute("aria-labelledby")) return;
		let heading = popup.querySelector("h1, h2, h3, h4");
		if (!heading) return;
		if (!heading.id) {
			this.generatedIDCounter++;
			heading.id = "accessibility-popup-title-" + this.generatedIDCounter;
		}
		popup.setAttribute("aria-labelledby", heading.id);
	};

	AccessibilityPopupHelper.prototype.configurePopupFields = function (popup) {
		if (!popup || !popup.querySelectorAll) return;
		let heading = popup.querySelector("h1, h2, h3, h4");
		let description = popup.querySelector("#common-popup-desc, .popup-description, .dialogue-description");
		let headingID = heading ? this.ensureElementID(heading, "accessibility-popup-field-title") : "";
		let descriptionID = description ? this.ensureElementID(description, "accessibility-popup-field-description") : "";
		let fields = popup.querySelectorAll("input:not([type='hidden']), select, textarea");

		for (let i = 0; i < fields.length; i++) {
			let field = fields[i];
			let hasName = field.getAttribute("aria-label") || field.getAttribute("aria-labelledby") || (field.labels && field.labels.length > 0);
			if (!hasName && headingID) field.setAttribute("aria-labelledby", headingID);
			if (descriptionID && !field.getAttribute("aria-describedby")) field.setAttribute("aria-describedby", descriptionID);
		}
	};

	AccessibilityPopupHelper.prototype.ensureElementID = function (element, prefix) {
		if (!element) return "";
		if (element.id) return element.id;
		this.generatedIDCounter++;
		element.id = prefix + "-" + this.generatedIDCounter;
		return element.id;
	};

	AccessibilityPopupHelper.prototype.bindFocusTrap = function (popup) {
		if (!popup || popup.getAttribute("data-accessibility-focus-trap") === "true") return;
		popup.setAttribute("data-accessibility-focus-trap", "true");
		popup.addEventListener("keydown", (event) => {
			if (event.key !== "Tab" || !this.isVisible(popup)) return;
			let focusable = this.getFocusableElements(popup);
			if (focusable.length === 0) {
				event.preventDefault();
				this.focusPopupFallback(popup);
				return;
			}

			let first = focusable[0];
			let last = focusable[focusable.length - 1];
			let active = document.activeElement;
			if (event.shiftKey && (active === first || !popup.contains(active))) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && (active === last || !popup.contains(active))) {
				event.preventDefault();
				first.focus();
			}
		});
	};

	AccessibilityPopupHelper.prototype.getFocusableElements = function (popup) {
		if (!popup || !popup.querySelectorAll) return [];
		let selector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";
		let nodes = popup.querySelectorAll(selector);
		let result = [];
		for (let i = 0; i < nodes.length; i++) {
			let element = nodes[i];
			if (this.isElementFocusableNow(element)) result.push(element);
		}
		return result;
	};

	AccessibilityPopupHelper.prototype.isElementFocusableNow = function (element) {
		if (!element || element.hidden || element.getAttribute("aria-hidden") === "true") return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	AccessibilityPopupHelper.prototype.observePopups = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			let popupsToCheck = new Set();
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				if (mutation.type === "childList") {
					for (let j = 0; j < mutation.addedNodes.length; j++) {
						let node = mutation.addedNodes[j];
						if (node.nodeType !== 1) continue;
						this.configurePopups(node);
						if (node.matches && node.matches(".popup")) popupsToCheck.add(node);
					}
				}
				if (mutation.type === "attributes") {
					let target = mutation.target;
					if (target.matches && target.matches(".popup")) popupsToCheck.add(target);
				}
			}

			popupsToCheck.forEach((popup) => this.syncPopupState(popup));
		});

		this.observer.observe(document.body, {
			childList: true,
			attributes: true,
			attributeFilter: ["style", "class"],
			subtree: true,
		});
	};

	AccessibilityPopupHelper.prototype.syncPopupState = function (popup) {
		if (!popup) return;
		this.configurePopups(popup);
		let state = this.popupStates.get(popup);
		if (!state) return;

		let isOpen = this.isVisible(popup);
		if (isOpen === state.isOpen) return;

		if (isOpen) {
			let active = document.activeElement;
			state.opener = active && !popup.contains(active) ? active : null;
			state.isOpen = true;
			window.setTimeout(() => this.ensureFocusInside(popup), 60);
		} else {
			state.isOpen = false;
			let opener = state.opener;
			state.opener = null;
			window.setTimeout(() => this.restoreFocus(opener), 60);
		}
	};

	AccessibilityPopupHelper.prototype.ensureFocusInside = function (popup) {
		if (!this.isVisible(popup)) return;
		if (popup.contains(document.activeElement)) return;

		let focusable = this.getFocusableElements(popup);
		if (focusable.length > 0) {
			focusable[0].focus();
			return;
		}
		this.focusPopupFallback(popup);
	};

	AccessibilityPopupHelper.prototype.focusPopupFallback = function (popup) {
		let heading = popup ? popup.querySelector("h1, h2, h3, h4") : null;
		if (heading) {
			heading.setAttribute("tabindex", "-1");
			heading.focus();
			return;
		}
		if (popup) {
			popup.setAttribute("tabindex", "-1");
			popup.focus();
		}
	};

	AccessibilityPopupHelper.prototype.restoreFocus = function (opener) {
		if (this.hasVisiblePopup()) return;
		if (!opener || !opener.isConnected || typeof opener.focus !== "function") return;
		opener.focus();
	};

	AccessibilityPopupHelper.prototype.hasVisiblePopup = function () {
		let popups = document.querySelectorAll(".popup");
		for (let i = 0; i < popups.length; i++) {
			if (this.isVisible(popups[i])) return true;
		}
		return false;
	};

	AccessibilityPopupHelper.prototype.isVisible = function (element) {
		if (!element) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	return AccessibilityPopupHelper;
});
