define([
	'game/GameGlobals',
	'game/GlobalSignals'
], function (GameGlobals, GlobalSignals) {

	let AccessibilityMovementPositionHelper = function () {
		this.refreshTimer = null;
		this.observer = null;
		this.signalsBound = false;
		this.init();
	};

	AccessibilityMovementPositionHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityMovementPositionHelper.prototype.setup = function () {
		this.ensureRegion();
		this.bindSignals();
		this.observe();
		this.refresh();
	};

	AccessibilityMovementPositionHelper.prototype.bindSignals = function () {
		if (this.signalsBound) return;
		this.signalsBound = true;
		let signals = [
			GlobalSignals.gameShownSignal,
			GlobalSignals.gameStateReadySignal,
			GlobalSignals.updateButtonsSignal,
			GlobalSignals.buttonStateChangedSignal,
			GlobalSignals.playerPositionChangedSignal,
			GlobalSignals.playerLocationChangedSignal,
			GlobalSignals.playerMoveCompletedSignal,
			GlobalSignals.playerEnteredCampSignal,
			GlobalSignals.playerLeftCampSignal,
			GlobalSignals.actionStartedSignal,
			GlobalSignals.actionCompletedSignal,
			GlobalSignals.sectorScoutedSignal,
			GlobalSignals.inventoryChangedSignal,
			GlobalSignals.visionChangedSignal,
			GlobalSignals.movementBlockerClearedSignal
		];
		for (let i = 0; i < signals.length; i++) {
			if (signals[i]) GlobalSignals.add(this, signals[i], this.scheduleRefresh);
		}
	};

	AccessibilityMovementPositionHelper.prototype.scheduleRefresh = function () {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refresh();
		}, 40);
	};

	AccessibilityMovementPositionHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined") return;
		let root = document.getElementById("container-tab-two-out") || document.body;
		if (!root) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let target = mutations[i].target && mutations[i].target.nodeType === 1 ? mutations[i].target : mutations[i].target && mutations[i].target.parentElement;
				if (target && target.closest && target.closest("#accessibility-movement-status")) continue;
				this.scheduleRefresh();
				return;
			}
		});
		this.observer.observe(root, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["class", "style", "hidden", "disabled"],
			subtree: true
		});
	};

	AccessibilityMovementPositionHelper.prototype.refresh = function () {
		if (typeof document === "undefined") return;
		let directions = {
			nw: "tây bắc",
			north: "bắc",
			ne: "đông bắc",
			west: "tây",
			east: "đông",
			sw: "tây nam",
			south: "nam",
			se: "đông nam"
		};
		let activeStates = [];

		for (let key in directions) {
			let normal = document.getElementById("out-action-move-" + key);
			let emergency = document.getElementById("out-action-move-" + key + "-grit");
			let normalState = this.configureDirectionButton(normal, directions[key], false);
			let emergencyState = this.configureDirectionButton(emergency, directions[key], true);
			let active = null;
			if (normal && this.isVisible(normal)) active = normalState;
			else if (emergency && this.isVisible(emergency)) active = emergencyState;
			if (active) activeStates.push(active);
		}

		let compass = document.getElementById("out-container-compass-actions");
		if (compass) {
			compass.setAttribute("role", "group");
			compass.setAttribute("aria-label", "Hành động di chuyển và hành trình");
		}

		this.renderPositionWarning(activeStates);
	};

	AccessibilityMovementPositionHelper.prototype.configureDirectionButton = function (button, directionName, emergency) {
		if (!button) return null;
		let disabled = !!button.disabled || button.classList.contains("btn-disabled");
		let reason = disabled ? this.getDisabledReason(button) : "";
		let temporary = disabled && this.isTemporaryReason(reason);
		let baseLabel = "Di chuyển " + directionName + (emergency ? " bằng lối khẩn cấp" : "");
		let label = baseLabel;

		if (!disabled) {
			label += ". Có thể đi.";
			button.removeAttribute("aria-disabled");
			button.setAttribute("data-a11y-movement-state", "available");
		} else if (temporary) {
			label += ". Tạm thời không đi được.";
			if (reason && !this.isGenericTemporaryReason(reason)) label += " " + this.ensureSentence(reason);
			button.setAttribute("aria-disabled", "true");
			button.setAttribute("data-a11y-movement-state", "temporary");
		} else {
			label += ". Không đi được.";
			if (reason) label += " " + this.ensureSentence(reason);
			button.setAttribute("aria-disabled", "true");
			button.setAttribute("data-a11y-movement-state", "blocked");
		}

		if (button.getAttribute("aria-label") !== label) button.setAttribute("aria-label", label);
		return {
			name: directionName,
			button: button,
			disabled: disabled,
			temporary: temporary,
			reason: reason
		};
	};

	AccessibilityMovementPositionHelper.prototype.getDisabledReason = function (button) {
		if (!button || !button.closest) return "";
		let callout = button.closest(".callout-container");
		let reason = callout ? callout.querySelector(".btn-disabled-reason") : null;
		let text = this.normalize(reason ? reason.textContent : "");
		if (!text) return "";
		if (/DISABLED_REASON_[A-Z0-9_]+/i.test(text)) return "";
		return text;
	};

	AccessibilityMovementPositionHelper.prototype.isGenericTemporaryReason = function (reason) {
		let text = this.normalize(reason).toLowerCase().replace(/[.!]+$/g, "");
		return text === "currently unavailable" || text === "temporarily unavailable" ||
			text === "hiện không khả dụng" || text === "tạm thời không khả dụng" || text === "không khả dụng";
	};

	AccessibilityMovementPositionHelper.prototype.isTemporaryReason = function (reason) {
		let text = this.normalize(reason).toLowerCase();
		if (!text) {
			let actions = GameGlobals.playerActionFunctions;
			return !!(actions && actions.currentAction);
		}
		return this.isGenericTemporaryReason(text) ||
			text.indexOf("busy") === 0 || text.indexOf("in progress") >= 0 ||
			text.indexOf("đang bận") === 0 || text.indexOf("đang thực hiện") >= 0 ||
			text.indexOf("hành động hiện tại") >= 0;
	};

	AccessibilityMovementPositionHelper.prototype.renderPositionWarning = function (states) {
		let region = this.ensureRegion();
		if (!region) return;
		let popup = this.hasVisiblePopup();
		let getUp = this.isVisible(document.getElementById("out-action-get-up"));
		let table = document.getElementById("table-out-actions-movement");
		let tableVisible = this.isVisible(table);
		let message = "Trạng thái vị trí. ";

		if (popup) {
			message += "Không thể di chuyển khi hội thoại hoặc cửa sổ hiện tại đang mở.";
		} else if (getUp) {
			message += "Chưa đi được. Hãy chọn Đứng dậy.";
		} else if (tableVisible && states.length > 0) {
			let available = [];
			let temporary = [];
			let blocked = [];
			for (let i = 0; i < states.length; i++) {
				if (!states[i].disabled) available.push(states[i].name);
				else if (states[i].temporary) temporary.push(states[i].name);
				else blocked.push(states[i].name);
			}
			if (available.length > 0) message += "Đi được: " + available.join(", ") + ". ";
			else message += "Không có hướng nào đi được. ";
			if (temporary.length > 0) message += "Tạm thời không đi được: " + temporary.join(", ") + ". ";
			if (blocked.length > 0) message += "Hướng bị chặn, không đi được: " + blocked.join(", ") + ". ";
			message += "Các nút hướng nằm ngay sau cảnh báo này.";
		} else if (this.isVisible(document.querySelector("button[action='build_out_camp']"))) {
			message += "Các hướng chưa được mở khóa. Hãy hoàn thành phần dựng trại mở đầu trước.";
		} else if (this.isVisible(document.getElementById("out-action-enter"))) {
			message += "Các hướng chưa được mở khóa. Hãy vào trại, chuẩn bị rồi rời trại để tiếp tục thám hiểm.";
		} else {
			message += "Hiện chưa có hướng di chuyển khả dụng.";
		}

		message = this.normalize(message);
		if (region.textContent !== message) region.textContent = message;
	};

	AccessibilityMovementPositionHelper.prototype.ensureRegion = function () {
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
		region.removeAttribute("tabindex");
		region.removeAttribute("aria-hidden");
		if (region.parentElement !== host) host.insertBefore(region, host.firstChild);
		return region;
	};

	AccessibilityMovementPositionHelper.prototype.hasVisiblePopup = function () {
		let popups = document.querySelectorAll(".popup");
		for (let i = 0; i < popups.length; i++) {
			if (this.isVisible(popups[i])) return true;
		}
		return false;
	};

	AccessibilityMovementPositionHelper.prototype.isVisible = function (element) {
		if (!element || !element.isConnected) return false;
		for (let current = element; current && current !== document.documentElement; current = current.parentElement) {
			let style = window.getComputedStyle ? window.getComputedStyle(current) : null;
			if (current.hidden || (style && (style.display === "none" || style.visibility === "hidden"))) return false;
		}
		return true;
	};

	AccessibilityMovementPositionHelper.prototype.ensureSentence = function (text) {
		text = this.normalize(text);
		if (!text) return "";
		return /[.!?]$/.test(text) ? text : text + ".";
	};

	AccessibilityMovementPositionHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityMovementPositionHelper;
});
