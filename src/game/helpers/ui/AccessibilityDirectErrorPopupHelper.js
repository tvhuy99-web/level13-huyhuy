define([
	'game/level13',
	'game/GameGlobals',
	'utils/StringUtils'
], function (Level13, GameGlobals, StringUtils) {
	if (!Level13 || !Level13.prototype || Level13.prototype.__accessibilityDirectErrorPopupPatched) return {};

	let escapeHTML = function (value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	};

	let compactStack = function (stack) {
		if (!stack) return "";
		return String(stack)
			.split("\n")
			.slice(0, 6)
			.map(line => line.trim())
			.filter(Boolean)
			.join(" | ")
			.substring(0, 1200);
	};

	let originalHandleException = Level13.prototype.handleException;
	Level13.prototype.__accessibilityDirectErrorPopupPatched = true;

	Level13.prototype.handleException = function (ex) {
		let desc = null;
		try {
			desc = StringUtils.getExceptionDescription(ex);
		} catch (descriptionError) {
			desc = {
				title: (ex && ex.message) ? String(ex.message) : "Unknown JavaScript error",
				shortstack: "",
				stack: (ex && ex.stack) ? String(ex.stack) : ""
			};
		}

		let stack = compactStack(desc && desc.stack);
		let detail = {
			name: ex && ex.name ? ex.name : "JavaScript Error",
			message: ex && ex.message ? ex.message : (desc && desc.title ? desc.title : "Không có thông báo lỗi"),
			location: desc && desc.shortstack ? desc.shortstack : "",
			stack: stack
		};

		if (typeof window !== "undefined") window.__level13LastDetailedError = detail;

		let uiFunctions = GameGlobals.uiFunctions;
		let originalShowQuestionPopup = uiFunctions && uiFunctions.showQuestionPopup;
		if (!originalShowQuestionPopup) return originalHandleException.call(this, ex);

		let technicalText = "<br><br><strong>Chi tiết kỹ thuật.</strong><br>";
		technicalText += escapeHTML(desc && desc.title ? desc.title : detail.name + ": " + detail.message);
		if (detail.location) technicalText += "<br>Vị trí: " + escapeHTML(detail.location);
		if (detail.stack) technicalText += "<br>Ngăn xếp: " + escapeHTML(detail.stack);

		let wrappedShowQuestionPopup = function (title, text) {
			let args = Array.prototype.slice.call(arguments);
			let popupText = typeof text === "string" ? text : "";
			if ((title === "Lỗi" || title === "Error") && popupText.indexOf("Chi tiết kỹ thuật") < 0) {
				args[1] = popupText + technicalText;
			}
			return originalShowQuestionPopup.apply(this, args);
		};

		uiFunctions.showQuestionPopup = wrappedShowQuestionPopup;
		try {
			return originalHandleException.call(this, ex);
		} finally {
			if (uiFunctions.showQuestionPopup === wrappedShowQuestionPopup) {
				uiFunctions.showQuestionPopup = originalShowQuestionPopup;
			}
		}
	};

	return {};
});
