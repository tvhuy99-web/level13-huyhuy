define([
	'game/helpers/ui/AccessibilityOverviewCleanupPatch',
	'game/helpers/ui/AccessibilityAutoScoutCoordinatesHelper'
], function (AccessibilityMobileExperienceHelper, AccessibilityAutoScoutCoordinatesHelper) {

	let H = AccessibilityMobileExperienceHelper;

	H.prototype.isGeneratedAccessibilityMutationTarget = function (target) {
		if (!target) return false;
		let element = target.nodeType === 1 ? target : target.parentElement;
		if (!element || !element.closest) return false;
		return !!element.closest(
			"[data-a11y-summary='1'], #accessibility-movement-status"
		);
	};

	H.prototype.hasInitializedHeaderOverviews = function () {
		let player = document.getElementById("accessibility-player-overview");
		let inventory = document.getElementById("accessibility-inventory-camp-overview");
		if (!player || !inventory) return false;
		let playerText = this.norm(player.textContent);
		let inventoryText = this.norm(inventory.textContent);
		return playerText.indexOf("Player status.") >= 0 && inventoryText.indexOf("Inventory.") >= 0;
	};

	H.prototype.isRealtimeVisualHeaderMutationTarget = function (target) {
		if (!this.hasInitializedHeaderOverviews() || !target) return false;
		let element = target.nodeType === 1 ? target : target.parentElement;
		if (!element || !element.closest) return false;
		return !!element.closest("#mobile-header,#header-side,#grid-main-header");
	};

	H.prototype.hasMeaningfulObservedMutation = function (mutations) {
		for (let i = 0; i < mutations.length; i++) {
			let mutation = mutations[i];
			if (this.isGeneratedAccessibilityMutationTarget(mutation.target)) continue;
			if (this.isRealtimeVisualHeaderMutationTarget(mutation.target)) continue;
			return true;
		}
		return false;
	};

	H.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			if (!this.hasMeaningfulObservedMutation(mutations)) return;
			this.schedule();
		});
		this.observer.observe(document.body, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["class", "style", "hidden", "description"],
			subtree: true
		});
	};

	H.prototype.setReadOnlySummary = function (source, label) {
		label = this.norm(label);
		if (!source || !label || !source.parentElement || this.hasActions(source) || this.isInVisualHeader(source)) return;
		let id = this.ensureSourceID(source);
		let summary = this.findSummaryFor(source.parentElement, id);
		if (!summary) {
			summary = document.createElement("p");
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-for", id);
			source.parentElement.insertBefore(summary, source);
		}
		if (summary.textContent !== label) summary.textContent = label;
		if (summary.hasAttribute("tabindex")) summary.removeAttribute("tabindex");
		if (summary.hasAttribute("aria-label")) summary.removeAttribute("aria-label");
		if (summary.hasAttribute("role")) summary.removeAttribute("role");
		this.suppressVisualTree(source, "summary");
	};

	H.prototype.movementRegion = function () {
		let region = document.getElementById("accessibility-movement-status");
		let host = document.getElementById("container-tab-two-out-actions") || document.getElementById("container-tab-two-out") || document.body;
		if (!host) return null;
		if (!region) {
			region = document.createElement("p");
			region.id = "accessibility-movement-status";
			region.className = "hide-from-visual-layout";
			region.setAttribute("role", "status");
			region.setAttribute("aria-live", "polite");
			region.setAttribute("aria-atomic", "true");
		}
		if (region.parentElement !== host) host.insertBefore(region, host.firstChild);
		return region;
	};

	H.prototype.getMovementDisabledReason = function (button) {
		if (!button || !button.closest) return "";
		let callout = button.closest(".callout-container");
		let reason = callout ? callout.querySelector(".btn-disabled-reason") : null;
		let text = this.norm(reason ? reason.textContent : "");
		if (/^DISABLED_REASON_/i.test(text) || /^[A-Z0-9_]+$/.test(text)) return "";
		return text;
	};

	H.prototype.isTemporaryMovementReason = function (reason) {
		let text = this.norm(reason).toLowerCase();
		return text.indexOf("currently unavailable") >= 0 || text.indexOf("busy ") === 0 || text.indexOf("in progress") >= 0;
	};

	H.prototype.configureDirectionButtonAccessibility = function (button, baseLabel) {
		if (!button) return null;
		let isVisible = this.visible(button);
		let disabled = isVisible && (!!button.disabled || button.classList.contains("btn-disabled"));
		let reason = disabled ? this.getMovementDisabledReason(button) : "";
		let temporary = disabled && this.isTemporaryMovementReason(reason);
		let label = baseLabel;
		if (disabled) {
			if (temporary) {
				label += ". Temporarily unavailable while the current movement or action finishes.";
			} else {
				label += ". Cannot move.";
				if (reason) label += " " + reason + ".";
			}
			button.setAttribute("aria-disabled", "true");
		} else {
			button.removeAttribute("aria-disabled");
		}
		if (button.getAttribute("aria-label") !== label) button.setAttribute("aria-label", label);
		return { button: button, disabled: disabled, temporary: temporary, reason: reason };
	};

	H.prototype.configureMovement = function () {
		let dirs = { nw:"northwest", north:"north", ne:"northeast", west:"west", east:"east", sw:"southwest", south:"south", se:"southeast" };
		let directionButtons = [];
		let directionStates = [];
		for (let k in dirs) {
			let button = document.getElementById("out-action-move-" + k);
			let emergencyButton = document.getElementById("out-action-move-" + k + "-grit");
			let normalState = this.configureDirectionButtonAccessibility(button, "Move " + dirs[k]);
			let emergencyState = this.configureDirectionButtonAccessibility(emergencyButton, "Move " + dirs[k] + " using emergency movement");
			if (button) directionButtons.push(button);
			if (emergencyButton) directionButtons.push(emergencyButton);

			let activeState = null;
			if (button && this.visible(button)) activeState = normalState;
			else if (emergencyButton && this.visible(emergencyButton)) activeState = emergencyState;
			if (activeState) directionStates.push({ name: dirs[k], state: activeState });
		}

		let compass = document.getElementById("out-container-compass-actions");
		if (compass) {
			compass.setAttribute("role", "group");
			compass.setAttribute("aria-label", "Movement and travel actions");
		}

		let region = this.movementRegion();
		if (!region) return;

		let popup = this.anyPopup();
		let getUp = this.visible(document.getElementById("out-action-get-up"));
		let movementTable = document.getElementById("table-out-actions-movement");
		let hasVisibleMovementTable = this.visible(movementTable);
		let visibleDirectionCount = directionStates.length;
		let availableDirections = [];
		let temporaryDirections = [];
		let blockedDirections = [];
		for (let i = 0; i < directionStates.length; i++) {
			let item = directionStates[i];
			if (item.state && item.state.disabled) {
				if (item.state.temporary) temporaryDirections.push(item.name);
				else blockedDirections.push(item.name);
			} else {
				availableDirections.push(item.name);
			}
		}
		let movementAvailable = hasVisibleMovementTable && availableDirections.length > 0;
		let buildCamp = document.querySelector("button[action='build_out_camp']");
		let enterCamp = document.getElementById("out-action-enter");
		let scout = document.getElementById("out-action-scout");

		let message = "";
		if (popup) {
			message = "Movement is not available during the current dialogue or popup. Continue or close it first.";
		} else if (getUp) {
			message = "Movement is not available yet. Choose Get up.";
		} else if (hasVisibleMovementTable && visibleDirectionCount > 0) {
			if (movementAvailable) {
				message = "Movement is available. Available directions: " + availableDirections.join(", ") + ".";
			} else if (temporaryDirections.length > 0) {
				message = "Movement is temporarily unavailable while the current movement or action finishes.";
			} else {
				message = "No movement direction is currently available.";
			}
			if (temporaryDirections.length > 0) message += " Temporarily unavailable: " + temporaryDirections.join(", ") + ".";
			if (blockedDirections.length > 0) message += " Blocked directions: " + blockedDirections.join(", ") + ".";
			message += " Direction buttons follow.";
		} else if (this.visible(buildCamp)) {
			message = "Movement directions are not unlocked yet. This is the opening exploration area: build a camp, enter it, then leave camp when ready to explore to unlock direction buttons.";
		} else if (this.visible(enterCamp)) {
			message = "Movement directions are not unlocked yet. Enter camp, prepare for exploration, then leave camp to unlock direction buttons.";
		} else if (this.visible(scout)) {
			message = "Movement directions are not unlocked yet. Complete the available exploration actions first.";
		} else {
			message = "Movement directions are currently unavailable.";
		}

		if (region.textContent !== message) region.textContent = message;
	};

	return H;
});