define([], function () {

	let AccessibilityHelper = function () {
		this.politeRegion = null;
		this.assertiveRegion = null;
		this.init();
	};

	AccessibilityHelper.prototype.init = function () {
		if (typeof document === "undefined") return;

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityHelper.prototype.setup = function () {
		this.politeRegion = this.getOrCreateLiveRegion(
			"accessibility-announcer-polite",
			"status",
			"polite"
		);
		this.assertiveRegion = this.getOrCreateLiveRegion(
			"accessibility-announcer-assertive",
			"alert",
			"assertive"
		);

		this.configureGameLog();
	};

	AccessibilityHelper.prototype.getOrCreateLiveRegion = function (id, role, politeness) {
		let region = document.getElementById(id);
		if (!region) {
			region = document.createElement("div");
			region.id = id;
			region.className = "hide-from-visual-layout";
			document.body.appendChild(region);
		}

		region.setAttribute("role", role);
		region.setAttribute("aria-live", politeness);
		region.setAttribute("aria-atomic", "true");
		return region;
	};

	AccessibilityHelper.prototype.configureGameLog = function () {
		let log = document.querySelector("#log-latest ul");
		if (!log) return;

		// role="log" already provides an implicit polite live region. These
		// explicit attributes make the intended behaviour clearer and more
		// consistent across mobile screen readers while keeping old messages
		// available for review.
		log.setAttribute("aria-live", "polite");
		log.setAttribute("aria-relevant", "additions text");
		log.setAttribute("aria-atomic", "false");
		if (!log.getAttribute("aria-label")) {
			log.setAttribute("aria-label", "Recent game messages");
		}
	};

	AccessibilityHelper.prototype.normalizeMessage = function (message) {
		if (message === null || typeof message === "undefined") return "";
		return String(message).replace(/\s+/g, " ").trim();
	};

	AccessibilityHelper.prototype.announce = function (message, priority) {
		let text = this.normalizeMessage(message);
		if (!text) return;

		if (!this.politeRegion || !this.assertiveRegion) {
			this.setup();
		}

		let region = priority === "assertive" ? this.assertiveRegion : this.politeRegion;
		if (!region) return;

		// Clear before setting text so an identical message can be announced
		// again when the same event happens more than once.
		region.textContent = "";
		window.setTimeout(function () {
			region.textContent = text;
		}, 20);
	};

	AccessibilityHelper.prototype.announcePolite = function (message) {
		this.announce(message, "polite");
	};

	AccessibilityHelper.prototype.announceAssertive = function (message) {
		this.announce(message, "assertive");
	};

	return AccessibilityHelper;
});
