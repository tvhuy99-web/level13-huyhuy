define([], function () {

	let AccessibilityNavigationHelper = function (announcer) {
		this.announcer = announcer;
		this.observers = [];
		this.lastSection = "";
		this.lastLocation = "";
		this.sectionTimer = null;
		this.locationTimer = null;
		this.init();
	};

	AccessibilityNavigationHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityNavigationHelper.prototype.setup = function () {
		let sectionHeading = document.querySelector("#tab-header h2");
		let locationHeading = document.querySelector("#grid-location-header h1");

		if (sectionHeading) {
			sectionHeading.setAttribute("aria-live", "off");
			this.lastSection = this.normalize(sectionHeading.textContent);
			this.observeHeading(sectionHeading, () => this.scheduleSection(sectionHeading));
		}

		if (locationHeading) {
			locationHeading.setAttribute("aria-live", "off");
			this.lastLocation = this.normalize(locationHeading.textContent);
			this.observeHeading(locationHeading, () => this.scheduleLocation(locationHeading));
		}
	};

	AccessibilityNavigationHelper.prototype.observeHeading = function (heading, callback) {
		if (!heading || typeof MutationObserver === "undefined") return;
		let observer = new MutationObserver(callback);
		observer.observe(heading, { childList: true, characterData: true, subtree: true });
		this.observers.push(observer);
	};

	AccessibilityNavigationHelper.prototype.scheduleSection = function (heading) {
		if (this.sectionTimer) window.clearTimeout(this.sectionTimer);
		this.sectionTimer = window.setTimeout(() => {
			this.sectionTimer = null;
			let text = this.normalize(heading.textContent);
			if (!text || text === this.lastSection) return;
			this.lastSection = text;
			this.announce("Section: " + text);
		}, 160);
	};

	AccessibilityNavigationHelper.prototype.scheduleLocation = function (heading) {
		if (this.locationTimer) window.clearTimeout(this.locationTimer);
		this.locationTimer = window.setTimeout(() => {
			this.locationTimer = null;
			let text = this.normalize(heading.textContent);
			if (!text || text === this.lastLocation) return;
			this.lastLocation = text;
			this.announce("Location: " + text);
		}, 160);
	};

	AccessibilityNavigationHelper.prototype.announce = function (text) {
		if (this.announcer && this.announcer.announcePolite) {
			this.announcer.announcePolite(text);
		}
	};

	AccessibilityNavigationHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityNavigationHelper;
});
