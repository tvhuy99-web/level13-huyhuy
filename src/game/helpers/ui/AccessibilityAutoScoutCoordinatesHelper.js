define([
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/components/common/PositionComponent',
	'game/components/sector/SectorStatusComponent'
], function (GameGlobals, GlobalSignals, PositionComponent, SectorStatusComponent) {

	let AccessibilityAutoScoutCoordinatesHelper = function () {
		this.started = false;
		this.retryTimer = null;
		this.autoScoutAttempted = Object.create(null);
		this.startWhenReady();
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.startWhenReady = function () {
		if (this.started) return;
		if (!GameGlobals.gameState || !GameGlobals.playerActionFunctions || !GameGlobals.playerActionsHelper) {
			this.retryTimer = window.setTimeout(() => this.startWhenReady(), 100);
			return;
		}

		this.started = true;
		GlobalSignals.add(this, GlobalSignals.gameStateReadySignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.gameShownSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.playerLocationChangedSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.playerMoveCompletedSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.featureUnlockedSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.visionChangedSignal, this.scheduleRefresh);
		GlobalSignals.add(this, GlobalSignals.actionCompletedSignal, this.scheduleRefresh);
		if (typeof window !== "undefined" && typeof document !== "undefined" && document.readyState !== "complete") {
			window.addEventListener("load", () => this.scheduleRefresh(), { once: true });
		}
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

		this.renderCoordinates(sector);
		this.autoPressScout(sector);
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.getCurrentSector = function () {
		let actions = GameGlobals.playerActionFunctions;
		let nodes = actions && actions.playerLocationNodes;
		return nodes && nodes.head ? nodes.head.entity : null;
	};

	AccessibilityAutoScoutCoordinatesHelper.prototype.getSectorKey = function (sector) {
		if (!sector) return "";
		let position = sector.get(PositionComponent);
		if (!position) return "";
		return position.level + "." + position.sectorX + "." + position.sectorY;
	};

	// Automatically execute the original Scout action once per sector when it is
	// genuinely available. The manual Scout button remains untouched and can still
	// be used if automatic scouting was unavailable or failed. For the automatic
	// press only, suppress the routine Scout result popup so the action completes
	// without requiring an extra confirmation tap. Reward-selection popups that the
	// core reward system considers mandatory can still appear.
	AccessibilityAutoScoutCoordinatesHelper.prototype.autoPressScout = function (sector) {
		if (typeof document !== "undefined" && document.readyState !== "complete") return;
		if (!sector || !GameGlobals.gameState || !GameGlobals.playerActionFunctions || !GameGlobals.playerActionsHelper) return;
		let sectorStatus = sector.get(SectorStatusComponent);
		if (!sectorStatus || sectorStatus.scouted) return;

		let sectorKey = this.getSectorKey(sector);
		if (!sectorKey || this.autoScoutAttempted[sectorKey]) return;

		let actions = GameGlobals.playerActionFunctions;
		if (actions.currentAction) return;
		if (!GameGlobals.playerActionsHelper.checkAvailability("scout", false, sector)) return;

		// Mark before starting so refresh signals fired during the action cannot
		// trigger the same automatic press again on this sector.
		this.autoScoutAttempted[sectorKey] = true;

		let originalHandleOutActionResults = actions.handleOutActionResults;
		let started = false;
		actions.handleOutActionResults = function (action, messages, showResultPopup, hasCustomReward, successCallback, failCallback) {
			if (action === "scout") showResultPopup = false;
			return originalHandleOutActionResults.call(this, action, messages, showResultPopup, hasCustomReward, successCallback, failCallback);
		};

		try {
			started = actions.startAction("scout") === true;
		} finally {
			actions.handleOutActionResults = originalHandleOutActionResults;
		}

		// If the original action did not actually start because state changed between
		// availability check and startAction, allow a later retry. Once it starts,
		// this sector will never be auto-pressed again in this session.
		if (!started) delete this.autoScoutAttempted[sectorKey];
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

	let instance = new AccessibilityAutoScoutCoordinatesHelper();
	return instance;
});