define([
	'game/helpers/ui/AccessibilityMapAssetBootstrapHelper'
], function () {
	require([
		'game/helpers/ui/AccessibilityDetailedErrorHelper',
		'game/helpers/ui/AccessibilityDirectErrorPopupHelper',
		'game/helpers/ui/AccessibilityMapIconPathFixHelper',
		'game/helpers/ui/AccessibilityOverviewRefreshPatch',
		'game/helpers/ui/AccessibilityScoutActionablePatch',
		'game/helpers/ui/AccessibilityMovementPositionHelper'
	], function (
		AccessibilityDetailedErrorHelper,
		AccessibilityDirectErrorPopupHelper,
		AccessibilityMapIconPathFixHelper,
		AccessibilityOverviewRefreshPatch,
		AccessibilityScoutActionablePatch,
		AccessibilityMovementPositionHelper
	) {
		if (AccessibilityMovementPositionHelper) new AccessibilityMovementPositionHelper();
		require(['level13-app']);
	});
});
