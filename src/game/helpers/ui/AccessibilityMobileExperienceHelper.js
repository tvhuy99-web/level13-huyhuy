define([], function () {

	let AccessibilityMobileExperienceHelper = function () {
		this.observer = null;
		this.refreshTimer = null;
		this.lastMovementMessage = null;
		this.init();
	};

	AccessibilityMobileExperienceHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityMobileExperienceHelper.prototype.setup = function () {
		this.refresh();
		this.observe();
		if (typeof window !== "undefined") {
			window.addEventListener("resize", () => this.scheduleRefresh());
		}
	};

	AccessibilityMobileExperienceHelper.prototype.refresh = function () {
		this.cleanupNoteCallouts(document);
		this.syncHeaderCopies();
		this.configureMovement();
	};

	AccessibilityMobileExperienceHelper.prototype.scheduleRefresh = function () {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refresh();
		}, 60);
	};

	AccessibilityMobileExperienceHelper.prototype.cleanupNoteCallouts = function (root) {
		if (!root || !root.querySelectorAll) return;
		let targets = [];
		if (root.matches && root.matches(".info-callout-target[role='note']")) targets.push(root);
		let nested = root.querySelectorAll(".info-callout-target[role='note']");
		for (let i = 0; i < nested.length; i++) targets.push(nested[i]);

		for (let i = 0; i < targets.length; i++) {
			let target = targets[i];
			let container = target.parentElement && target.parentElement.classList.contains("callout-container") ? target.parentElement : target.closest(".callout-container");
			let callout = container ? container.querySelector(".info-callout") : null;
			if (!callout) continue;

			let hasInteractiveContent = !!callout.querySelector("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])");
			if (hasInteractiveContent) continue;

			let image = target.querySelector("img[alt]");
			let imageAlt = image ? this.normalize(image.getAttribute("alt")) : "";
			let description = this.normalize(target.getAttribute("description"));
			let calloutText = this.normalize(callout.textContent);
			let visibleText = this.normalize(target.textContent);
			let label = description || calloutText || imageAlt || visibleText || "Details";

			target.removeAttribute("role");
			target.setAttribute("tabindex", "0");
			target.setAttribute("aria-label", label);
			this.removeAriaReference(target, "aria-describedby", callout.id);

			let images = target.querySelectorAll("img");
			for (let j = 0; j < images.length; j++) {
				images[j].setAttribute("alt", "");
				images[j].setAttribute("aria-hidden", "true");
			}

			callout.setAttribute("aria-hidden", "true");
			callout.removeAttribute("role");
		}
	};

	AccessibilityMobileExperienceHelper.prototype.syncHeaderCopies = function () {
		let body = document.body;
		if (!body) return;
		let small = body.classList.contains("layout-small");
		this.configureStatusList("player-perks-list-mobile", small, "Status effects");
		this.configureStatusList("player-statuses-list-mobile", small, "Status effects");
		this.configureStatusList("player-perks-list-regular", !small, "Status effects");
		this.configureStatusList("player-statuses-list-regular", !small, "Status effects");
	};

	AccessibilityMobileExperienceHelper.prototype.configureStatusList = function (id, active, label) {
		let list = document.getElementById(id);
		if (!list) return;
		list.setAttribute("role", "list");
		list.setAttribute("aria-label", label);
		if (active) list.removeAttribute("aria-hidden");
		else list.setAttribute("aria-hidden", "true");

		let items = list.querySelectorAll(":scope > li");
		for (let i = 0; i < items.length; i++) {
			items[i].setAttribute("role", "listitem");
			if (!active) items[i].setAttribute("aria-hidden", "true");
			else items[i].removeAttribute("aria-hidden");
		}
	};

	AccessibilityMobileExperienceHelper.prototype.configureMovement = function () {
		let directions = {
			"nw": "northwest",
			"north": "north",
			"ne": "northeast",
			"west": "west",
			"east": "east",
			"sw": "southwest",
			"south": "south",
			"se": "southeast",
		};

		for (let key in directions) {
			let normal = document.getElementById("out-action-move-" + key);
			let grit = document.getElementById("out-action-move-" + key + "-grit");
			if (normal) normal.setAttribute("aria-label", "Move " + directions[key]);
			if (grit) grit.setAttribute("aria-label", "Move " + directions[key] + " using emergency movement");
		}

		let compass = document.getElementById("out-container-compass-actions");
		if (compass) {
			compass.setAttribute("role", "group");
			compass.setAttribute("aria-label", "Movement and travel actions");
		}

		let region = this.getMovementStatusRegion();
		if (!region) return;

		let introPopupVisible = this.isAnyPopupVisible();
		let getUp = document.getElementById("out-action-get-up");
		let scout = document.getElementById("out-action-scout");
		let compassVisible = this.isVisible(compass);
		let getUpVisible = this.isVisible(getUp);
		let scoutVisible = this.isVisible(scout);

		if (compass) {
			if (compassVisible) compass.removeAttribute("aria-hidden");
			else compass.setAttribute("aria-hidden", "true");
		}

		let message = "";
		if (introPopupVisible) {
			message = "Movement is not available during the introduction. Continue or close the current dialogue first.";
		} else if (getUpVisible) {
			message = "Movement is not available yet. Choose Get up.";
		} else if (!compassVisible && scoutVisible) {
			message = "Movement is not available until this sector is scouted. Choose Scout.";
		} else if (!compassVisible) {
			message = "Movement controls are not unlocked yet. Complete the available exploration action to continue.";
		} else {
			message = "Movement is available. Choose a direction: north, northeast, east, southeast, south, southwest, west, or northwest.";
		}

		if (this.lastMovementMessage !== message) {
			this.lastMovementMessage = message;
			region.textContent = message;
		}
	};

	AccessibilityMobileExperienceHelper.prototype.isAnyPopupVisible = function () {
		let popups = document.querySelectorAll(".popup");
		for (let i = 0; i < popups.length; i++) {
			if (this.isVisible(popups[i])) return true;
		}
		return false;
	};

	AccessibilityMobileExperienceHelper.prototype.getMovementStatusRegion = function () {
		let region = document.getElementById("accessibility-movement-status");
		if (region) return region;
		let host = document.getElementById("container-tab-two-out") || document.getElementById("grid-switch-content") || document.body;
		if (!host) return null;
		region = document.createElement("p");
		region.id = "accessibility-movement-status";
		region.className = "hide-from-visual-layout";
		region.setAttribute("role", "status");
		region.setAttribute("aria-live", "polite");
		region.setAttribute("aria-atomic", "true");
		host.insertBefore(region, host.firstChild);
		return region;
	};

	AccessibilityMobileExperienceHelper.prototype.removeAriaReference = function (element, attribute, id) {
		if (!element || !id) return;
		let refs = (element.getAttribute(attribute) || "").split(/\s+/).filter(Boolean).filter(ref => ref !== id);
		if (refs.length) element.setAttribute(attribute, refs.join(" "));
		else element.removeAttribute(attribute);
	};

	AccessibilityMobileExperienceHelper.prototype.isVisible = function (element) {
		if (!element || !element.isConnected) return false;
		let current = element;
		while (current && current !== document.documentElement) {
			let style = window.getComputedStyle ? window.getComputedStyle(current) : null;
			if (style && (style.display === "none" || style.visibility === "hidden")) return false;
			if (current.hidden) return false;
			current = current.parentElement;
		}
		return true;
	};

	AccessibilityMobileExperienceHelper.prototype.normalize = function (value) {
		return String(value || "").replace(/\s+/g, " ").trim();
	};

	AccessibilityMobileExperienceHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver(() => this.scheduleRefresh());
		this.observer.observe(document.body, {
			childList: true,
			attributes: true,
			attributeFilter: ["class", "style", "hidden", "disabled", "description", "role", "aria-label", "aria-describedby"],
			subtree: true,
		});
	};

	return AccessibilityMobileExperienceHelper;
});
