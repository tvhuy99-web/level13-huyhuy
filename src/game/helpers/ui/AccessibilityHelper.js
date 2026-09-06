define([], function () {

	let AccessibilityHelper = function () {
		this.politeRegion = null;
		this.assertiveRegion = null;
		this.tabObserver = null;
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
		this.configureTabs();
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

	AccessibilityHelper.prototype.configureTabs = function () {
		let tabList = document.getElementById("switch-tabs");
		if (!tabList) return;

		tabList.setAttribute("role", "tablist");
		if (!tabList.getAttribute("aria-label")) {
			tabList.setAttribute("aria-label", "Game sections");
		}

		let tabs = tabList.querySelectorAll(":scope > li");
		for (let i = 0; i < tabs.length; i++) {
			let tab = tabs[i];
			tab.setAttribute("role", "tab");

			let panels = document.querySelectorAll(".tabcontainer[data-tab='" + tab.id + "']");
			let panelIDs = [];
			for (let j = 0; j < panels.length; j++) {
				let panel = panels[j];
				if (!panel.id) continue;
				panelIDs.push(panel.id);
				panel.setAttribute("role", "tabpanel");
				panel.setAttribute("aria-labelledby", tab.id);
			}
			if (panelIDs.length > 0) {
				tab.setAttribute("aria-controls", panelIDs.join(" "));
			}
		}

		this.syncTabStates();

		if (!this.tabObserver && typeof MutationObserver !== "undefined") {
			this.tabObserver = new MutationObserver(() => this.syncTabStates());
			this.tabObserver.observe(tabList, {
				attributes: true,
				attributeFilter: ["class", "style"],
				subtree: true,
			});
		}
	};

	AccessibilityHelper.prototype.syncTabStates = function () {
		let tabList = document.getElementById("switch-tabs");
		if (!tabList) return;

		let tabs = tabList.querySelectorAll(":scope > li");
		for (let i = 0; i < tabs.length; i++) {
			let tab = tabs[i];
			let isSelected = tab.classList.contains("selected");
			let isDisabled = tab.classList.contains("disabled");
			tab.setAttribute("aria-selected", isSelected ? "true" : "false");
			tab.setAttribute("aria-disabled", isDisabled ? "true" : "false");
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
