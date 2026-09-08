define([
	'game/helpers/ui/AccessibilityMapAssetBootstrapHelper'
], function () {
	require([
		'game/helpers/ui/AccessibilityDetailedErrorHelper',
		'game/helpers/ui/AccessibilityDirectErrorPopupHelper',
		'game/helpers/ui/AccessibilityMapIconPathFixHelper',
		'game/helpers/ui/AccessibilityOverviewRefreshPatch',
		'game/helpers/ui/AccessibilityScoutActionablePatch'
	], function () {
		require(['level13-app']);
	});
});
