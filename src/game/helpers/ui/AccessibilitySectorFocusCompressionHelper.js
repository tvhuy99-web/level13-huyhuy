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

		let description = document.getElementById("out-desc");
		if (!description || !description.parentElement) {
			window.setTimeout(() => this.scheduleRefresh(), 100);
			return;
		}

		let oldCoordinates = document.getElementById("accessibility-location-coordinates");
		let coordinateText = this.getCoordinateText();
		let descriptionText = this.getDescriptionText(description);
		let summary = this.ensureSummary(description);
		if (!summary) return;

		if (coordinateText && descriptionText) {
			let combined = this.normalize(coordinateText + " " + descriptionText);
			this.lastGoodText = combined;
			if (summary.textContent !== combined) summary.textContent = combined;
			summary.removeAttribute("aria-hidden");
			description.setAttribute("aria-hidden", "true");
			this.hideFromTalkBack(oldCoordinates);
			return;
		}

		if (this.lastGoodText) {
			if (summary.textContent !== this.lastGoodText) summary.textContent = this.lastGoodText;
			summary.removeAttribute("aria-hidden");
			description.setAttribute("aria-hidden", "true");
			this.hideFromTalkBack(oldCoordinates);
			return;
		}

		// Before both dynamic sources are ready, do not hide the original sector
		// description. This avoids a silent gap during initial game startup.
		summary.setAttribute("aria-hidden", "true");
		description.removeAttribute("aria-hidden");
		window.setTimeout(() => this.scheduleRefresh(), 100);
	};

	AccessibilitySectorFocusCompressionHelper.prototype.getCoordinateText = function () {
		let actions = GameGlobals.playerActionFunctions;
		let nodes = actions && actions.playerLocationNodes;
		let sector = nodes && nodes.head ? nodes.head.entity : null;
		if (!sector || !sector.get) return "";
		let position = sector.get(PositionComponent);
		if (!position) return "";
		return "Vị trí. Tầng " + position.level + ". X " + this.formatCoordinate(position.sectorX) + ". Y " + this.formatCoordinate(position.sectorY) + ".";
	};

	AccessibilitySectorFocusCompressionHelper.prototype.ensureSummary = function (description) {
		let summary = document.getElementById("accessibility-sector-summary");
		if (!summary) {
			summary = document.createElement("p");
			summary.id = "accessibility-sector-summary";
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-key", "sector-overview");
			description.parentElement.insertBefore(summary, description);
		}
		summary.removeAttribute("tabindex");
		summary.removeAttribute("role");
		summary.removeAttribute("aria-live");
		summary.removeAttribute("aria-atomic");
		summary.removeAttribute("aria-label");
		return summary;
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
