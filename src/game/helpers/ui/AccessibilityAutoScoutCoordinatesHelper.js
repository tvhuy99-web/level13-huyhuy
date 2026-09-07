define([
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/components/common/PositionComponent',
	'game/components/sector/SectorStatusComponent'
], function (GameGlobals, GlobalSignals, PositionComponent, SectorStatusComponent) {

	let AccessibilityAutoScoutCoordinatesHelper = function () {
		this.started = false;
		this.retryTimer = null;
		this.ensureScoutHiddenStyle();
		this.startWhenReady();
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.startWhenReady = function () {
		if (this.started) return;
		if (!GameGlobals.gameState || !GameGlobals.playerActionFunctions) {
			this.retryTimer = window.setTimeout(() => this.startWhenReady(), 100);
			return;
		}

		this.started = true;
		GlobalSignals.add(this, GlobalSignals.gameStateReadySignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.gameShownSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.playerLocationChangedSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.playerMoveCompletedSignal, this.scheduleRefresh);
		this.scheduleRefresh();
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.scheduleRefresh = function () {
		window.setTimeout(() => this.refresh(), 0);
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.refresh = function () {
		let sector = this.getCurrentSector();
		if (!sector) {
			window.setTimeout(() => this.refresh(), 100);
			return;
		}

		this.autoScoutSector(sector);
		this.renderCoordinates(sector);
		this.hideScoutButton();
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.getCurrentSector = function () {
		let actions = GameGlobals.playerActionFunctions;
		let nodes = actions && actions.playerLocationNodes;
		return nodes && nodes.head ? nodes.head.entity : null;
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.autoScoutSector = function (sector) {
		if (!sector || !GameGlobals.gameState || !GameGlobals.playerActionFunctions) return;
		let sectorStatus = sector.get(SectorStatusComponent);
		if (!sectorStatus || sectorStatus.scouted) return;

		// Sector scouting is automatic in this accessibility build. Keep the
		// progression signals and persistent state, but do not start a separate
		// scout action, charge action costs, show the scout result popup, or change
		// lastAction. Location-specific follow-up actions (workshops, locales,
		// examine spots) remain separate actions.
		sectorStatus.scouted = true;
		if (GameGlobals.gameState.stats) {
			GameGlobals.gameState.stats.numTimesScouted = (GameGlobals.gameState.stats.numTimesScouted || 0) + 1;
		}

		GameGlobals.playerActionFunctions.unlockFeature("evidence");
		GameGlobals.playerActionFunctions.unlockFeature("scout");
		GlobalSignals.sectorScoutedSignal.dispatch(sector);
		GameGlobals.playerActionFunctions.save();
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.renderCoordinates = function (sector) {
		if (typeof document === "undefined" || !sector) return;
		let position = sector.get(PositionComponent);
		if (!position) return;

		let description = document.getElementById("out-desc");
		if (!description || !description.parentElement) return;

		let summary = document.getElementById("accessibility-location-coordinates");
		if (!summary) {
			summary = document.createElement("p");
			summary.id = "accessibility-location-coordinates";
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-key", "location-coordinates");
			description.parentElement.insertBefore(summary, description);
		}

		let text = "Vị trí. Tầng " + position.level + ". X " + this.formatCoordinate(position.sectorX) + ". Y " + this.formatCoordinate(position.sectorY) + ".";
		if (summary.textContent !== text) summary.textContent = text;
		if (summary.hasAttribute("tabindex")) summary.removeAttribute("tabindex");
		if (summary.hasAttribute("aria-label")) summary.removeAttribute("aria-label");
		if (summary.hasAttribute("role")) summary.removeAttribute("role");
		if (summary.hasAttribute("aria-live")) summary.removeAttribute("aria-live");
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.formatCoordinate = function (value) {
		let number = Number(value) || 0;
		return number < 0 ? "âm " + Math.abs(number) : String(number);
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.ensureScoutHiddenStyle = function () {
		if (typeof document === "undefined") return;
		if (document.getElementById("accessibility-auto-scout-style")) return;
		let style = document.createElement("style");
		style.id = "accessibility-auto-scout-style";
		style.textContent = "#out-action-scout{display:none !important;}";
		(document.head || document.documentElement).appendChild(style);
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.hideScoutButton = function () {
		if (typeof document === "undefined") return;
		let scout = document.getElementById("out-action-scout");
		if (!scout) return;
		scout.setAttribute("aria-hidden", "true");
		scout.setAttribute("tabindex", "-1");
	};

	let instance = new AccessibilityAutoScoutCoordinatesHelper();
	return instance;
});