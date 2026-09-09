define([
	'game/GameGlobals',
	'game/components/common/PositionComponent'
], function (GameGlobals, PositionComponent) {

	let AccessibilitySectorFocusCompressionHelper = function () {
		this.refreshTimer = null;
		this.observer = null;
		this.lastGoodText = "";
		this.init();
	};

	AccessibilitySectorFocusCompressionHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilitySectorFocusCompressionHelper.prototype.setup = function () {
		this.observe();
		this.scheduleRefresh();
	};

	AccessibilitySectorFocusCompressionHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let target = mutations[i].target && mutations[i].target.nodeType === 1
					? mutations[i].target
					: mutations[i].target && mutations[i].target.parentElement;
				if (target && target.closest && target.closest("#accessibility-sector-summary")) continue;
				this.scheduleRefresh();
				return;
			}
		});
		this.observer.observe(document.body, {
			childList: true,
			characterData: true,
			subtree: true
		});
	};

	AccessibilitySectorFocusCompressionHelper.prototype.scheduleRefresh = function () {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refresh();
		}, 40);
	};

	AccessibilitySectorFocusCompressionHelper.prototype.refresh = function () {
		if (typeof document === "undefined") return;

		this.hideFromTalkBack(document.getElementById("out-position-indicator"));
		this.hideFromTalkBack(document.getElementById("out-distance-indicator"));
		this.hideFromTalkBack(document.getElementById("accessibility-movement-status"));
		this.hideFromTalkBack(document.getElementById("accessibility-location-coordinates"));

		let oldSummary = document.getElementById("accessibility-sector-summary");
		if (oldSummary) this.hideFromTalkBack(oldSummary);

		let description = document.getElementById("out-desc");
		if (!description || !description.parentElement) {
			window.setTimeout(() => this.scheduleRefresh(), 100);
			return;
		}

		let coordinateText = this.getCoordinateText();
		let descriptionText = this.getDescriptionText(description);

		if (coordinateText && descriptionText) {
			let combined = this.normalize(coordinateText + " " + descriptionText);
			this.lastGoodText = combined;
			this.exposeDescriptionAsSingleFocus(description, combined);
			return;
		}

		if (this.lastGoodText) {
			this.exposeDescriptionAsSingleFocus(description, this.lastGoodText);
			return;
		}

		// Until the game has enough vision/data to build the complete description,
		// leave the native description readable rather than creating an empty focus.
		this.restoreNativeDescription(description);
		window.setTimeout(() => this.scheduleRefresh(), 100);
	};

	AccessibilitySectorFocusCompressionHelper.prototype.getCoordinateText = function () {
		let actions = GameGlobals.playerActionFunctions;
		let playerPositionNodes = actions && actions.playerPositionNodes;
		let position = playerPositionNodes && playerPositionNodes.head ? playerPositionNodes.head.position : null;

		if (!position) {
			let playerLocationNodes = actions && actions.playerLocationNodes;
			let sector = playerLocationNodes && playerLocationNodes.head ? playerLocationNodes.head.entity : null;
			position = sector && sector.get ? sector.get(PositionComponent) : null;
		}

		if (!position) return "";
		return "Vị trí. Tầng " + position.level + ". X " + this.formatCoordinate(position.sectorX) + ". Y " + this.formatCoordinate(position.sectorY) + ".";
	};

	AccessibilitySectorFocusCompressionHelper.prototype.exposeDescriptionAsSingleFocus = function (description, text) {
		if (!description || !text) return;

		// Bind the complete spoken sector summary to the actual visible description
		// block. This gives TalkBack one real navigation stop at the same screen
		// location instead of relying on a separate off-screen summary element.
		description.removeAttribute("aria-hidden");
		description.setAttribute("tabindex", "0");
		description.setAttribute("data-a11y-single-focus", "1");
		if (description.getAttribute("aria-label") !== text) description.setAttribute("aria-label", text);
		description.removeAttribute("role");
		description.removeAttribute("aria-live");
		description.removeAttribute("aria-atomic");

		// The visible descendants stay on screen but are removed from the
		// accessibility tree so TalkBack cannot split this block into extra stops.
		let descendants = description.querySelectorAll("*");
		for (let i = 0; i < descendants.length; i++) {
			descendants[i].setAttribute("aria-hidden", "true");
			descendants[i].removeAttribute("tabindex");
		}
	};

	AccessibilitySectorFocusCompressionHelper.prototype.restoreNativeDescription = function (description) {
		if (!description) return;
		description.removeAttribute("tabindex");
		description.removeAttribute("aria-label");
		description.removeAttribute("data-a11y-single-focus");
		description.removeAttribute("aria-hidden");
		let descendants = description.querySelectorAll("[aria-hidden='true']");
		for (let i = 0; i < descendants.length; i++) descendants[i].removeAttribute("aria-hidden");
	};

	AccessibilitySectorFocusCompressionHelper.prototype.getDescriptionText = function (description) {
		if (!description) return "";
		let raw = "";
		try {
			raw = description.innerText || description.textContent || "";
		} catch (e) {
			raw = description.textContent || "";
		}
		let lines = String(raw).split(/\n+/).map(line => this.normalize(line)).filter(Boolean);
		let result = [];
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (!/[.!?]$/.test(line)) line += ".";
			result.push(line);
		}
		return this.normalize(result.join(" "));
	};

	AccessibilitySectorFocusCompressionHelper.prototype.hideFromTalkBack = function (element) {
		if (!element) return;
		if (element.getAttribute("aria-hidden") !== "true") element.setAttribute("aria-hidden", "true");
		element.removeAttribute("tabindex");
	};

	AccessibilitySectorFocusCompressionHelper.prototype.formatCoordinate = function (value) {
		let number = Number(value) || 0;
		return number < 0 ? "âm " + Math.abs(number) : String(number);
	};

	AccessibilitySectorFocusCompressionHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilitySectorFocusCompressionHelper;
});
