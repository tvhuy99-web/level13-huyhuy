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

		let focusable = popup.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])");
		if (focusable) {
			focusable.focus();
			return;
		}

		let heading = popup.querySelector("h1, h2, h3, h4");
		if (heading) {
			heading.setAttribute("tabindex", "-1");
			heading.focus();
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
