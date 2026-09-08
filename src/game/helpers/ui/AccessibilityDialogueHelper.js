define([], function () {

	let AccessibilityDialogueHelper = function () {
		this.optionsObserver = null;
		this.focusTimer = null;
		this.init();
	};

	AccessibilityDialogueHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityDialogueHelper.prototype.setup = function () {
		let dialogue = document.querySelector("#dialogue-module-dialogue p");
		if (dialogue) {
			dialogue.setAttribute("role", "status");
			dialogue.setAttribute("aria-live", "polite");
			dialogue.setAttribute("aria-atomic", "true");
		}

		let meta = document.querySelector("#dialogue-module-meta p");
		if (meta) {
			meta.setAttribute("aria-live", "polite");
			meta.setAttribute("aria-atomic", "true");
		}

		let results = document.getElementById("dialogue-module-results");
		if (results) {
			results.setAttribute("role", "status");
			results.setAttribute("aria-live", "polite");
			results.setAttribute("aria-atomic", "true");
		}

		let buttonBox = document.querySelector("#dialogue-popup .buttonbox");
		if (buttonBox) {
			buttonBox.setAttribute("role", "group");
			buttonBox.setAttribute("aria-label", "Lựa chọn hội thoại");
			this.observeOptions(buttonBox);
		}
	};

	AccessibilityDialogueHelper.prototype.observeOptions = function (buttonBox) {
		if (this.optionsObserver || typeof MutationObserver === "undefined") return;
		this.optionsObserver = new MutationObserver(() => this.scheduleOptionFocus(buttonBox));
		this.optionsObserver.observe(buttonBox, { childList: true, subtree: true });
	};

	AccessibilityDialogueHelper.prototype.scheduleOptionFocus = function (buttonBox) {
		if (this.focusTimer) window.clearTimeout(this.focusTimer);
		this.focusTimer = window.setTimeout(() => {
			this.focusTimer = null;
			let popup = document.getElementById("dialogue-popup");
			if (!this.isVisible(popup)) return;
			let firstButton = buttonBox.querySelector("button:not([disabled])");
			if (firstButton) firstButton.focus();
		}, 350);
	};

	AccessibilityDialogueHelper.prototype.isVisible = function (element) {
		if (!element) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	return AccessibilityDialogueHelper;
});
