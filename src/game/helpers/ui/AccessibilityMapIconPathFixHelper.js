define([
	'utils/MapElements'
], function (MapElements) {
	if (!MapElements || MapElements.__githubPagesIconPathFixed) return {};
	MapElements.__githubPagesIconPathFixed = true;

	let getIconURL = function (name, sunlit) {
		let suffix = sunlit ? "-sunlit" : "";
		let relativePath = "img/map/" + name + suffix + ".png";
		if (typeof document !== "undefined" && document.baseURI) {
			return new URL(relativePath, document.baseURI).href;
		}
		return relativePath;
	};

	MapElements.initIcon = function (key, name) {
		this.icons[key] = new Image();
		this.icons[key].src = getIconURL(name, false);
		this.icons[key + "-sunlit"] = new Image();
		this.icons[key + "-sunlit"].src = getIconURL(name, true);
	};

	let originalDrawSectorIcon = MapElements.drawSectorIcon;
	MapElements.drawSectorIcon = function () {
		try {
			return originalDrawSectorIcon.apply(this, arguments);
		} catch (ex) {
			let message = ex && ex.message ? String(ex.message) : "";
			if (ex && ex.name === "InvalidStateError" && message.indexOf("drawImage") >= 0) {
				return false;
			}
			throw ex;
		}
	};

	MapElements.initIcons();
	return {};
});
