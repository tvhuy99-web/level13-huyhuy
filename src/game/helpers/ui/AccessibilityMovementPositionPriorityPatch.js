define([
	'game/helpers/ui/AccessibilityMovementPositionHelper'
], function (AccessibilityMovementPositionHelper) {

	let H = AccessibilityMovementPositionHelper;
	if (!H || H.prototype.__accessibilityMovementPositionPriorityPatchInstalled) return H;
	H.prototype.__accessibilityMovementPositionPriorityPatchInstalled = true;

	let originalRenderPositionWarning = H.prototype.renderPositionWarning;

	H.prototype.renderPositionWarning = function (states) {
		let table = document.getElementById("table-out-actions-movement");
		let hasDirectionStates = this.isVisible(table) && states && states.length > 0;
		if (!hasDirectionStates) {
			return originalRenderPositionWarning.call(this, states);
		}

		let popupVisible = this.hasVisiblePopup();
		let originalHasVisiblePopup = this.hasVisiblePopup;
		let originalIsVisible = this.isVisible;
		this.hasVisiblePopup = function () { return false; };
		this.isVisible = function (element) {
			if (element && element.id === "out-action-get-up") return false;
			return originalIsVisible.call(this, element);
		};
		try {
			originalRenderPositionWarning.call(this, states);
		} finally {
			this.hasVisiblePopup = originalHasVisiblePopup;
			this.isVisible = originalIsVisible;
		}

		if (!popupVisible) return;
		let region = this.ensureRegion();
		if (!region) return;
		let popupNote = "Hiện có cửa sổ đang mở; hãy đóng hoặc tiếp tục trước khi kích hoạt di chuyển.";
		let message = this.normalize(region.textContent + " " + popupNote);
		if (region.textContent !== message) region.textContent = message;
	};

	return H;
});
