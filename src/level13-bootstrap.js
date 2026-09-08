define([
	'game/helpers/ui/AccessibilityMapAssetBootstrapHelper'
], function () {
	require([
		'game/helpers/ui/AccessibilityDetailedErrorHelper',
		'game/helpers/ui/AccessibilityDirectErrorPopupHelper',
		'game/helpers/ui/AccessibilityMapIconPathFixHelper',
		'game/helpers/ui/AccessibilityOverviewRefreshPatch'
	], function () {
		require(['level13-app']);
	});
});
