define([], function () {
	let AccessibilityDetailedErrorHelper = function () {
		this.lastError = null;
		this.install();
	};

	AccessibilityDetailedErrorHelper.prototype.install = function () {
		if (typeof window === "undefined" || typeof document === "undefined") return;
		if (window.__level13DetailedErrorCaptureInstalled) return;
		window.__level13DetailedErrorCaptureInstalled = true;

		window.addEventListener("error", (event) => {
			let error = event && event.error ? event.error : null;
			let name = error && error.name ? error.name : "JavaScript Error";
			let message = error && error.message ? error.message : (event && event.message ? event.message : "Không có thông báo lỗi");
			let stack = error && error.stack ? error.stack : "";
			let location = this.formatLocation(event && event.filename, event && event.lineno, event && event.colno);
			this.capture(name, message, location, stack);
		}, true);

		window.addEventListener("unhandledrejection", (event) => {
			let reason = event ? event.reason : null;
			let name = reason && reason.name ? reason.name : "Unhandled Promise Rejection";
			let message = reason && reason.message ? reason.message : String(reason || "Không có thông báo lỗi");
			let stack = reason && reason.stack ? reason.stack : "";
			this.capture(name, message, "", stack);
		});
	};

	AccessibilityDetailedErrorHelper.prototype.formatLocation = function (filename, line, column) {
		if (!filename) return "";
		let shortName = filename.split("?")[0].split("/").pop();
		let result = shortName;
		if (line) result += ":" + line;
		if (column) result += ":" + column;
		return result;
	};

	AccessibilityDetailedErrorHelper.prototype.capture = function (name, message, location, stack) {
		this.lastError = {
			name: name || "JavaScript Error",
			message: message || "Không có thông báo lỗi",
			location: location || "",
			stack: this.compactStack(stack)
		};
		window.__level13LastDetailedError = this.lastError;
		window.setTimeout(() => this.render(), 0);
		window.setTimeout(() => this.render(), 100);
	};

	AccessibilityDetailedErrorHelper.prototype.compactStack = function (stack) {
		if (!stack) return "";
		return String(stack).split("\n").slice(0, 6).map(line => line.trim()).filter(Boolean).join(" | ");
	};

	AccessibilityDetailedErrorHelper.prototype.getVisibleErrorPopup = function () {
		let popups = document.querySelectorAll(".popup");
		for (let i = 0; i < popups.length; i++) {
			let popup = popups[i];
			let style = window.getComputedStyle(popup);
			if (style.display === "none" || style.visibility === "hidden") continue;
			let text = (popup.textContent || "").replace(/\s+/g, " ").trim();
			if (text.indexOf("Đã xảy ra lỗi") >= 0 || text.indexOf("You've found a bug") >= 0 || text.indexOf("Chi tiết kỹ thuật") >= 0) return popup;
		}
		return null;
	};

	AccessibilityDetailedErrorHelper.prototype.render = function () {
		if (!this.lastError) return;
		let popup = this.getVisibleErrorPopup();
		if (!popup) return;

		let old = popup.querySelector("#accessibility-technical-error");
		if (old && old.parentElement) old.parentElement.removeChild(old);

		let details = document.createElement("p");
		details.id = "accessibility-technical-error";
		details.setAttribute("role", "alert");
		details.setAttribute("aria-live", "assertive");

		let parts = [
			"Chi tiết kỹ thuật.",
			this.lastError.name + ": " + this.lastError.message
		];
		if (this.lastError.location) parts.push("Vị trí: " + this.lastError.location);
		if (this.lastError.stack) parts.push("Ngăn xếp: " + this.lastError.stack);
		details.textContent = parts.join(" ");

		let buttonBox = popup.querySelector(".buttonbox");
		if (buttonBox) popup.insertBefore(details, buttonBox);
		else popup.appendChild(details);
	};

	new AccessibilityDetailedErrorHelper();
	return AccessibilityDetailedErrorHelper;
});
