define([
	'game/helpers/ui/AccessibilityFocusStabilityPatch',
	'game/GlobalSignals'
], function (AccessibilityMobileExperienceHelper, GlobalSignals) {

	let H = AccessibilityMobileExperienceHelper;
	if (!H || H.prototype.__accessibilityOverviewRefreshPatchInstalled) return H;
	H.prototype.__accessibilityOverviewRefreshPatchInstalled = true;

	let originalSetup = H.prototype.setup;
	let originalRenderHeaderOverview = H.prototype.renderHeaderOverview;

	H.prototype.isOverviewFallbackText = function (text) {
		text = this.norm(text);
		return text === "Tổng quan người chơi. Chưa có thông tin trạng thái người chơi." ||
			text === "Tổng quan túi đồ và trại. Chưa có thông tin về túi đồ hoặc trại.";
	};

	H.prototype.stabilizeOverviewSummary = function (id, previousText, previousReady) {
		let summary = document.getElementById(id);
		if (!summary) return;

		let currentText = this.norm(summary.textContent);
		let currentIsFallback = this.isOverviewFallbackText(currentText);
		if (currentText && !currentIsFallback) {
			summary.setAttribute("data-a11y-overview-ready", "1");
			summary.removeAttribute("data-a11y-overview-pending");
			summary.removeAttribute("aria-hidden");
			return;
		}

		if (previousReady && previousText && !this.isOverviewFallbackText(previousText)) {
			if (summary.textContent !== previousText) summary.textContent = previousText;
			summary.setAttribute("data-a11y-overview-ready", "1");
			summary.removeAttribute("data-a11y-overview-pending");
			summary.removeAttribute("aria-hidden");
			return;
		}

		if (summary.textContent) summary.textContent = "";
		summary.setAttribute("data-a11y-overview-pending", "1");
		summary.setAttribute("aria-hidden", "true");
	};

	H.prototype.renderHeaderOverview = function () {
		let playerBefore = document.getElementById("accessibility-player-overview");
		let inventoryBefore = document.getElementById("accessibility-inventory-camp-overview");
		let previousPlayerText = this.norm(playerBefore && playerBefore.textContent);
		let previousInventoryText = this.norm(inventoryBefore && inventoryBefore.textContent);
		let previousPlayerReady = !!(playerBefore && playerBefore.getAttribute("data-a11y-overview-ready") === "1");
		let previousInventoryReady = !!(inventoryBefore && inventoryBefore.getAttribute("data-a11y-overview-ready") === "1");

		originalRenderHeaderOverview.call(this);

		this.stabilizeOverviewSummary("accessibility-player-overview", previousPlayerText, previousPlayerReady);
		this.stabilizeOverviewSummary("accessibility-inventory-camp-overview", previousInventoryText, previousInventoryReady);
	};

	H.prototype.scheduleOverviewSignalRefresh = function () {
		if (this.overviewSignalRefreshTimer) window.clearTimeout(this.overviewSignalRefreshTimer);
		this.overviewSignalRefreshTimer = window.setTimeout(() => {
			this.overviewSignalRefreshTimer = null;
			this.renderHeaderOverview();
		}, 60);
	};

	H.prototype.bindOverviewRefreshSignals = function () {
		if (this.overviewRefreshSignalsBound) return;
		this.overviewRefreshSignalsBound = true;

		let signals = [
			GlobalSignals.gameStateLoadedSignal,
			GlobalSignals.gameStateReadySignal,
			GlobalSignals.gameShownSignal,
			GlobalSignals.gameStartedSignal,
			GlobalSignals.gameStateRefreshSignal,
			GlobalSignals.updateButtonsSignal,
			GlobalSignals.actionCompletedSignal,
			GlobalSignals.actionRewardsCollectedSignal,
			GlobalSignals.inventoryChangedSignal,
			GlobalSignals.equipmentChangedSignal,
			GlobalSignals.storageCapacityChangedSignal,
			GlobalSignals.visionChangedSignal,
			GlobalSignals.healthChangedSignal,
			GlobalSignals.perksChangedSignal,
			GlobalSignals.populationChangedSignal,
			GlobalSignals.tribeStatsChangedSignal,
			GlobalSignals.playerEnteredCampSignal,
			GlobalSignals.playerLeftCampSignal,
			GlobalSignals.playerLocationChangedSignal,
			GlobalSignals.workersAssignedSignal,
			GlobalSignals.improvementBuiltSignal
		];

		for (let i = 0; i < signals.length; i++) {
			if (signals[i]) GlobalSignals.add(this, signals[i], this.scheduleOverviewSignalRefresh);
		}
	};

	H.prototype.scheduleInitialOverviewRetries = function () {
		let delays = [0, 120, 350, 800, 1600, 3000];
		for (let i = 0; i < delays.length; i++) {
			window.setTimeout(() => this.scheduleOverviewSignalRefresh(), delays[i]);
		}
	};

	H.prototype.setup = function () {
		originalSetup.call(this);
		this.bindOverviewRefreshSignals();
		this.scheduleInitialOverviewRetries();
	};

	return H;
});
