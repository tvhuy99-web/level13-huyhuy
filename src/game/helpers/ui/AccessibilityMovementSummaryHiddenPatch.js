define([
	'game/helpers/ui/AccessibilityMovementPositionHelper'
], function (AccessibilityMovementPositionHelper) {

	let H = AccessibilityMovementPositionHelper;
	if (!H || H.prototype.__accessibilityMovementSummaryHiddenPatchInstalled) return H;
	H.prototype.__accessibilityMovementSummaryHiddenPatchInstalled = true;

	let originalEnsureRegion = H.prototype.ensureRegion;
	H.prototype.ensureRegion = function () {
		let region = originalEnsureRegion.call(this);
		if (!region) return region;
		region.setAttribute("aria-hidden", "true");
		region.removeAttribute("role");
		region.removeAttribute("aria-live");
		region.removeAttribute("aria-atomic");
		region.removeAttribute("tabindex");
		return region;
	};

	return H;
});
