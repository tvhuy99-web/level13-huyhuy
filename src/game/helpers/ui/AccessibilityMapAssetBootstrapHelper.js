define([], function () {
	if (typeof window === "undefined" || typeof document === "undefined" || typeof HTMLImageElement === "undefined") return {};
	if (window.__level13MapAssetBootstrapInstalled) return {};
	window.__level13MapAssetBootstrapInstalled = true;

	let descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
	if (!descriptor || !descriptor.get || !descriptor.set) return {};

	let wrongPrefix = window.location.origin + "/img/map/";
	let mapBaseURL = new URL("img/map/", document.baseURI).href;

	Object.defineProperty(HTMLImageElement.prototype, "src", {
		configurable: descriptor.configurable,
		enumerable: descriptor.enumerable,
		get: function () {
			return descriptor.get.call(this);
		},
		set: function (value) {
			let nextValue = value;
			if (typeof nextValue === "string" && nextValue.indexOf(wrongPrefix) === 0 && mapBaseURL !== wrongPrefix) {
				nextValue = mapBaseURL + nextValue.substring(wrongPrefix.length);
			}
			return descriptor.set.call(this, nextValue);
		}
	});

	return {};
});
