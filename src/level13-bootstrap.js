define([
	'game/helpers/ui/AccessibilityMapAssetBootstrapHelper',
	'game/constants/EnemyConstants'
], function (AccessibilityMapAssetBootstrapHelper, EnemyConstants) {
	// UIOutFightSystem uses EnemyConstants as a legacy global when rendering the
	// Vietnamese enemy name. Expose it before level13-app is loaded so opening
	// the fight popup cannot fail with a ReferenceError.
	if (typeof window !== "undefined") window.EnemyConstants = EnemyConstants;

	require([
		'game/helpers/ui/AccessibilityDetailedErrorHelper',
		'game/helpers/ui/AccessibilityDirectErrorPopupHelper',
		'game/helpers/ui/AccessibilityMapIconPathFixHelper',
		'game/helpers/ui/AccessibilityOverviewRefreshPatch',
		'game/helpers/ui/AccessibilityScoutActionablePatch',
		'game/helpers/ui/AccessibilityMovementPositionHelper',
		'game/helpers/ui/AccessibilityMovementPositionPriorityPatch',
		'game/helpers/ui/AccessibilityMovementSummaryHiddenPatch',
		'game/helpers/ui/AccessibilitySectorFocusCompressionHelper'
	], function (
		AccessibilityDetailedErrorHelper,
		AccessibilityDirectErrorPopupHelper,
		AccessibilityMapIconPathFixHelper,
		AccessibilityOverviewRefreshPatch,
		AccessibilityScoutActionablePatch,
		AccessibilityMovementPositionHelper,
		AccessibilityMovementPositionPriorityPatch,
		AccessibilityMovementSummaryHiddenPatch,
		AccessibilitySectorFocusCompressionHelper
	) {
		if (AccessibilityMovementPositionHelper) new AccessibilityMovementPositionHelper();
		if (AccessibilitySectorFocusCompressionHelper) new AccessibilitySectorFocusCompressionHelper();
		require(['level13-app']);
	});
});
