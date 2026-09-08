define([], function () {

	let AccessibilityB2Helper = function (announcer) {
		this.announcer = announcer;
		this.init();
	};

	AccessibilityB2Helper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityB2Helper.prototype.setup = function () {
		this.configureSettings();
		this.configureCommonInput();
		document.addEventListener("click", (event) => this.onDocumentClick(event), true);
	};

	AccessibilityB2Helper.prototype.configureSettings = function () {
		this.setLabel("settings-checkbox-sfx-enabled", "Bật âm thanh");
		this.setLabel("settings-checkbox-hotkeys-enabled", "Bật phím tắt");
		this.setLabel("settings-checkbox-hotkeys-numpad", "Dùng bàn phím số để di chuyển");
		this.setLabel("language-dropdown", "Ngôn ngữ");

		let hotkeys = document.getElementById("hotkeys-list");
		if (hotkeys) {
			hotkeys.setAttribute("role", "region");
			hotkeys.setAttribute("aria-label", "Phím tắt");
		}
	};

	AccessibilityB2Helper.prototype.configureCommonInput = function () {
		let input = document.querySelector("#common-popup-input-container input");
		if (!input) return;
		input.setAttribute("aria-invalid", "false");
		if (input.getAttribute("data-accessibility-b2-input-bound") !== "true") {
			input.setAttribute("data-accessibility-b2-input-bound", "true");
			input.addEventListener("input", function () {
				input.setAttribute("aria-invalid", "false");
			});
		}
	};

	AccessibilityB2Helper.prototype.onDocumentClick = function (event) {
		let target = event.target;
		if (!target || !target.closest) return;
		let confirm = target.closest("#common-popup #info-ok");
		if (!confirm) return;

		let inputContainer = document.getElementById("common-popup-input-container");
		let input = inputContainer ? inputContainer.querySelector("input") : null;
		if (!input || !this.isVisible(inputContainer)) return;

		window.setTimeout(() => {
			let popup = document.getElementById("common-popup");
			if (!popup || !this.isVisible(popup)) return;
			if (!this.isVisible(inputContainer)) return;
			input.setAttribute("aria-invalid", "true");
			input.focus();
			this.announceAssertive("Dữ liệu nhập chưa được chấp nhận. Hãy kiểm tra lại trường này và thử lại.");
		}, 180);
	};

	AccessibilityB2Helper.prototype.setLabel = function (id, label) {
		let element = document.getElementById(id);
		if (!element) return;
		element.setAttribute("aria-label", label);
	};

	AccessibilityB2Helper.prototype.isVisible = function (element) {
		if (!element) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(element) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return element.getClientRects().length > 0;
	};

	AccessibilityB2Helper.prototype.announceAssertive = function (message) {
		if (this.announcer && this.announcer.announceAssertive) {
			this.announcer.announceAssertive(message);
		}
	};

	return AccessibilityB2Helper;
});
