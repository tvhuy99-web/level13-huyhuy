define([], function () {

	let AccessibilityTabStatusHelper = function () {
		this.observer = null;
		this.refreshTimer = null;
		this.init();
	};

	AccessibilityTabStatusHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityTabStatusHelper.prototype.setup = function () {
		this.refresh();
		this.observe();
	};

	AccessibilityTabStatusHelper.prototype.refresh = function () {
		let tabList = document.getElementById("switch-tabs");
		if (!tabList) return;

		let tabs = tabList.children;
		for (let i = 0; i < tabs.length; i++) {
			let tab = tabs[i];
			if (tab.tagName !== "LI") continue;

			let nameElement = tab.querySelector(".name");
			let baseName = this.normalize(nameElement ? nameElement.textContent : tab.textContent);
			let bubble = tab.querySelector(".bubble");
			let status = this.getBubbleStatus(bubble);

			if (baseName) {
				tab.setAttribute("aria-label", status ? baseName + ", " + status : baseName);
			}
			if (bubble) bubble.setAttribute("aria-hidden", "true");
		}
	};

	AccessibilityTabStatusHelper.prototype.getBubbleStatus = function (bubble) {
		if (!bubble || !this.isVisible(bubble)) return "";
		if (bubble.classList.contains("bubble-increase")) return "improvement available";

		let value = this.normalize(bubble.textContent);
		if (!value) return "new content";
		if (value === "!") return "new content";
		if (/^\d+$/.test(value)) {
			let count = parseInt(value, 10);
			return count === 1 ? "1 notification" : count + " notifications";
		}
		return value;
	};

	AccessibilityTabStatusHelper.prototype.isVisible = function (element) {
		if (!element) return false;
		if (element.getAttribute("data-visible") === "false") return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	AccessibilityTabStatusHelper.prototype.scheduleRefresh = function () {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refresh();
		}, 30);
	};

	AccessibilityTabStatusHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined") return;
		let tabList = document.getElementById("switch-tabs");
		if (!tabList) return;

		this.observer = new MutationObserver(() => this.scheduleRefresh());
		this.observer.observe(tabList, {
			attributes: true,
			attributeFilter: ["class", "style", "data-visible"],
			childList: true,
			characterData: true,
			subtree: true,
		});
	};

	AccessibilityTabStatusHelper.prototype.normalize = function (value) {
		return String(value || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityTabStatusHelper;
});
