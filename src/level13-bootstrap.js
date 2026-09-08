define([
	'game/helpers/ui/AccessibilityMapAssetBootstrapHelper'
], function () {
	require([
		'game/helpers/ui/AccessibilityDetailedErrorHelper',
		'game/helpers/ui/AccessibilityDirectErrorPopupHelper',
		'game/helpers/ui/AccessibilityMapIconPathFixHelper',
		'game/helpers/ui/AccessibilityOverviewRefreshPatch',
		'game/helpers/ui/AccessibilityScoutActionablePatch',
		'game/helpers/ui/AccessibilityMovementPositionHelper',
		'game/helpers/ui/AccessibilityMovementPositionPriorityPatch'
	], function (
		AccessibilityDetailedErrorHelper,
		AccessibilityDirectErrorPopupHelper,
		AccessibilityMapIconPathFixHelper,
		AccessibilityOverviewRefreshPatch,
		AccessibilityScoutActionablePatch,
		AccessibilityMovementPositionHelper,
		AccessibilityMovementPositionPriorityPatch
	) {
		let MovementPositionHelper = AccessibilityMovementPositionPriorityPatch || AccessibilityMovementPositionHelper;
		if (MovementPositionHelper) new MovementPositionHelper();
		require(['level13-app']);
	});
});
