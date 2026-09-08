define([
	'game/helpers/ui/AccessibilityActionCalloutHelper',
	'game/GlobalSignals'
], function (AccessibilityActionCalloutHelper, GlobalSignals) {

	let H = AccessibilityActionCalloutHelper;
	if (!H || H.prototype.__accessibilityScoutActionablePatchInstalled) return H;
	H.prototype.__accessibilityScoutActionablePatchInstalled = true;

	let originalSetup = H.prototype.setup;
	let originalUpdateActionButtonLabel = H.prototype.updateActionButtonLabel;
	let originalUpdateDisabledActionProxy = H.prototype.updateDisabledActionProxy;

	H.prototype.setup = function () {
		originalSetup.call(this);
		this.bindScoutStateRefreshSignals();
	};

	H.prototype.bindScoutStateRefreshSignals = function () {
		if (this.scoutStateRefreshSignalsBound) return;
		this.scoutStateRefreshSignalsBound = true;
		GlobalSignals.add(this, GlobalSignals.sectorScoutedSignal, this.refreshScoutDependentButtons);
		GlobalSignals.add(this, GlobalSignals.playerLocationChangedSignal, this.refreshScoutDependentButtons);
		GlobalSignals.add(this, GlobalSignals.playerMoveCompletedSignal, this.refreshScoutDependentButtons);
	};

	H.prototype.refreshScoutDependentButtons = function () {
		let refresh = () => {
			if (GlobalSignals.updateButtonsSignal) GlobalSignals.updateButtonsSignal.dispatch();
			if (typeof document !== "undefined") this.configureActionCallouts(document);
		};
		refresh();
		if (typeof window !== "undefined") {
			window.setTimeout(refresh, 60);
			window.setTimeout(refresh, 180);
		}
	};

	H.prototype.updateActionButtonLabel = function (button, callout) {
		let label = originalUpdateActionButtonLabel.call(this, button, callout);
		if (!button || this.normalize(button.getAttribute("action")) !== "scout") return label;

		button.removeAttribute("aria-disabled");
		if (!button.disabled) return label;

		let labelElement = button.querySelector(".btn-label");
		let baseLabel = this.normalize(labelElement && labelElement.textContent) ||
			this.normalize(button.getAttribute("data-a11y-action-base-label")) || "Thám sát";
		let reason = this.getDisabledReasonText(callout);
		let scoutLabel = baseLabel;
		if (reason) scoutLabel += ". " + reason;
		else scoutLabel += ". Chưa thể thực hiện lúc này";
		if (button.getAttribute("aria-label") !== scoutLabel) button.setAttribute("aria-label", scoutLabel);
		return scoutLabel;
	};

	H.prototype.updateDisabledActionProxy = function (buttonContainer, button, callout, label, calloutID) {
		originalUpdateDisabledActionProxy.call(this, buttonContainer, button, callout, label, calloutID);
		if (!buttonContainer || !button) return;

		let action = this.normalize(button.getAttribute("action"));
		if (action !== "scout") {
			buttonContainer.removeAttribute("data-a11y-scout-actionable");
			return;
		}

		if (!button.disabled) {
			buttonContainer.removeAttribute("data-a11y-scout-actionable");
			return;
		}

		buttonContainer.setAttribute("data-a11y-scout-actionable", "1");
		buttonContainer.setAttribute("role", "button");
		buttonContainer.setAttribute("tabindex", "0");
		buttonContainer.removeAttribute("aria-disabled");
		button.removeAttribute("aria-disabled");
		let scoutLabel = label || this.normalize(button.getAttribute("aria-label")) || "Thám sát";
		buttonContainer.setAttribute("aria-label", scoutLabel);
	};

	return H;
});
