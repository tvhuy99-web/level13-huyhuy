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
		return playerText.indexOf("Trạng thái người chơi.") >= 0 && inventoryText.indexOf("Túi đồ.") >= 0;
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
		return text.indexOf("currently unavailable") >= 0 || text.indexOf("busy ") === 0 || text.indexOf("in progress") >= 0
			|| text.indexOf("tạm thời không khả dụng") >= 0 || text.indexOf("đang bận") === 0 || text.indexOf("đang thực hiện") >= 0;
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
				label += ". Tạm thời không khả dụng trong khi hành động hiện tại hoàn tất.";
			} else {
				label += ". Không thể di chuyển.";
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
		let dirs = { nw:"tây bắc", north:"bắc", ne:"đông bắc", west:"tây", east:"đông", sw:"tây nam", south:"nam", se:"đông nam" };
		let directionButtons = [];
		let directionStates = [];
		for (let k in dirs) {
			let button = document.getElementById("out-action-move-" + k);
			let emergencyButton = document.getElementById("out-action-move-" + k + "-grit");
			let normalState = this.configureDirectionButtonAccessibility(button, "Di chuyển " + dirs[k]);
			let emergencyState = this.configureDirectionButtonAccessibility(emergencyButton, "Di chuyển " + dirs[k] + " bằng lối khẩn cấp");
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
			compass.setAttribute("aria-label", "Hành động di chuyển và hành trình");
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
			message = "Không thể di chuyển trong hội thoại hoặc cửa sổ hiện tại. Hãy tiếp tục hoặc đóng nó trước.";
		} else if (getUp) {
			message = "Chưa thể di chuyển. Hãy chọn Đứng dậy.";
		} else if (hasVisibleMovementTable && visibleDirectionCount > 0) {
			if (movementAvailable) {
				message = "Có thể di chuyển. Các hướng khả dụng: " + availableDirections.join(", ") + ".";
			} else if (temporaryDirections.length > 0) {
				message = "Tạm thời không thể di chuyển trong khi hành động hiện tại hoàn tất.";
			} else {
				message = "Hiện không có hướng di chuyển khả dụng.";
			}
			if (temporaryDirections.length > 0) message += " Tạm thời không khả dụng: " + temporaryDirections.join(", ") + ".";
			if (blockedDirections.length > 0) message += " Hướng bị chặn: " + blockedDirections.join(", ") + ".";
			message += " Các nút hướng nằm ngay sau đây.";
		} else if (this.visible(buildCamp)) {
			message = "Các hướng di chuyển chưa được mở khóa. Đây là khu vực thám hiểm mở đầu: hãy xây trại, vào trại rồi rời trại khi sẵn sàng thám hiểm để mở khóa các nút hướng.";
		} else if (this.visible(enterCamp)) {
			message = "Các hướng di chuyển chưa được mở khóa. Hãy vào trại, chuẩn bị thám hiểm rồi rời trại để mở khóa các nút hướng.";
		} else if (this.visible(scout)) {
			message = "Các hướng di chuyển chưa được mở khóa. Trước hết hãy hoàn thành các hành động thám hiểm khả dụng.";
		} else {
			message = "Hiện không có hướng di chuyển khả dụng.";
		}

		if (region.textContent !== message) region.textContent = message;
	};

	return H;
});
