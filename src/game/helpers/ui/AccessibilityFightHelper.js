define([], function () {

	let AccessibilityFightHelper = function (announcer) {
		this.announcer = announcer;
		this.observers = [];
		this.popupObserver = null;
		this.resultsObserver = null;
		this.pendingEvents = [];
		this.pendingAssertive = false;
		this.eventTimer = null;
		this.lastResults = "";
		this.wasPopupOpen = false;
		this.progressTimer = null;
		this.init();
	};

	AccessibilityFightHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityFightHelper.prototype.setup = function () {
		this.configureFightProgressBars();
		this.observeFightEvents();
		this.observeFightPopup();
		this.observeFightResults();
		this.progressTimer = window.setInterval(() => this.updateFightProgressBars(), 500);
	};

	AccessibilityFightHelper.prototype.configureFightProgressBars = function () {
		this.configureProgressBar("fight-bar-enemy", "Sinh lực kẻ địch");
		this.configureProgressBar("fight-bar-enemy-shield", "Khiên kẻ địch");
		this.configureProgressBar("fight-bar-self", "Sinh lực của bạn");
		this.configureProgressBar("fight-bar-self-shield", "Khiên của bạn");
		this.updateFightProgressBars();
	};

	AccessibilityFightHelper.prototype.configureProgressBar = function (id, label) {
		let element = document.getElementById(id);
		if (!element) return;
		element.setAttribute("role", "progressbar");
		element.setAttribute("aria-valuemin", "0");
		element.setAttribute("aria-valuemax", "100");
		element.setAttribute("aria-label", label);
	};

	AccessibilityFightHelper.prototype.updateFightProgressBars = function () {
		if (!window.jQuery) return;
		this.updateProgressValue("fight-bar-enemy");
		this.updateProgressValue("fight-bar-enemy-shield");
		this.updateProgressValue("fight-bar-self");
		this.updateProgressValue("fight-bar-self-shield");
	};

	AccessibilityFightHelper.prototype.updateProgressValue = function (id) {
		let element = document.getElementById(id);
		if (!element) return;
		let value = window.jQuery(element).data("progress-percent");
		if (typeof value !== "number" || !isFinite(value)) return;
		value = Math.max(0, Math.min(100, Math.round(value)));
		element.setAttribute("aria-valuenow", String(value));
		element.setAttribute("aria-valuetext", value + "%");
	};

	AccessibilityFightHelper.prototype.observeFightEvents = function () {
		this.observeText("fight-damage-indictor-self", (text) => {
			let value = this.getAbsoluteNumber(text);
			return value === null ? "" : "Bạn chịu " + value + " sát thương.";
		}, true);

		this.observeText("fight-damage-indictor-enemy", (text) => {
			let value = this.getAbsoluteNumber(text);
			return value === null ? "" : "Kẻ địch chịu " + value + " sát thương.";
		}, false);

		this.observeText("fight-status-indictor-self", (text) => {
			if (!text) return "";
			return text.toLowerCase() === "dodge" ? "Bạn né tránh." : "Trạng thái của bạn: " + text + ".";
		}, true);

		this.observeText("fight-status-indictor-enemy", (text) => {
			if (!text) return "";
			return text.toLowerCase() === "dodge" ? "Kẻ địch né tránh." : "Trạng thái kẻ địch: " + text + ".";
		}, false);
	};

	AccessibilityFightHelper.prototype.observeText = function (id, formatter, assertive) {
		let element = document.getElementById(id);
		if (!element || typeof MutationObserver === "undefined") return;
		let observer = new MutationObserver(() => {
			let raw = this.normalize(element.textContent);
			let message = formatter(raw);
			if (message) this.queueEvent(message, assertive);
		});
		observer.observe(element, { childList: true, characterData: true, subtree: true });
		this.observers.push(observer);
	};

	AccessibilityFightHelper.prototype.queueEvent = function (message, assertive) {
		if (!message) return;
		this.pendingEvents.push(message);
		this.pendingAssertive = this.pendingAssertive || assertive;
		if (this.eventTimer) return;
		this.eventTimer = window.setTimeout(() => this.flushEvents(), 120);
	};

	AccessibilityFightHelper.prototype.flushEvents = function () {
		this.eventTimer = null;
		if (this.pendingEvents.length === 0) return;
		let message = this.pendingEvents.join(" ");
		let assertive = this.pendingAssertive;
		this.pendingEvents = [];
		this.pendingAssertive = false;
		if (!this.announcer) return;
		if (assertive && this.announcer.announceAssertive) this.announcer.announceAssertive(message);
		else if (this.announcer.announcePolite) this.announcer.announcePolite(message);
	};

	AccessibilityFightHelper.prototype.observeFightPopup = function () {
		let popup = document.getElementById("fight-popup");
		if (!popup || typeof MutationObserver === "undefined") return;
		this.wasPopupOpen = this.isVisible(popup);
		this.popupObserver = new MutationObserver(() => {
			let isOpen = this.isVisible(popup);
			if (isOpen && !this.wasPopupOpen) {
				window.setTimeout(() => this.announceFightStart(), 120);
			}
			this.wasPopupOpen = isOpen;
		});
		this.popupObserver.observe(popup, {
			attributes: true,
			attributeFilter: ["style", "class"],
		});
	};

	AccessibilityFightHelper.prototype.announceFightStart = function () {
		let title = this.getText("fight-title");
		let enemyName = this.getText("fight-popup-enemy-name");
		let enemyStats = this.getText("fight-popup-enemy-stats");
		let summary = this.normalize([title, enemyName, enemyStats].filter(Boolean).join(". "));
		if (!summary || !this.announcer || !this.announcer.announceAssertive) return;
			this.announcer.announceAssertive("Trận chiến bắt đầu. " + summary);
	};

	AccessibilityFightHelper.prototype.observeFightResults = function () {
		let results = document.getElementById("fight-popup-results");
		if (!results || typeof MutationObserver === "undefined") return;
		results.setAttribute("role", "status");
		this.resultsObserver = new MutationObserver(() => {
			window.setTimeout(() => this.announceResults(results), 80);
		});
		this.resultsObserver.observe(results, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["style", "class"],
			subtree: true,
		});
	};

	AccessibilityFightHelper.prototype.announceResults = function (results) {
		if (!this.isVisible(results)) return;
		let summary = this.normalize(results.innerText || results.textContent || "");
		if (!summary || summary === this.lastResults) return;
		this.lastResults = summary;
		if (this.announcer && this.announcer.announceAssertive) {
			this.announcer.announceAssertive("Kết quả chiến đấu. " + summary);
		}
	};

	AccessibilityFightHelper.prototype.getAbsoluteNumber = function (text) {
		let value = parseFloat(String(text || "").replace(/[^0-9.-]/g, ""));
		if (!isFinite(value)) return null;
		return Math.abs(value);
	};

	AccessibilityFightHelper.prototype.getText = function (id) {
		let element = document.getElementById(id);
		return element ? this.normalize(element.textContent) : "";
	};

	AccessibilityFightHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	AccessibilityFightHelper.prototype.isVisible = function (element) {
		if (!element) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	return AccessibilityFightHelper;
});
