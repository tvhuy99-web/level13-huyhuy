define([], function () {

	let AccessibilityMobileOverlayHelper = function () {
		this.overlay = null;
		this.dismiss = null;
		this.observer = null;
		this.wasVisible = false;
		this.previousFocus = null;
		this.init();
	};

	AccessibilityMobileOverlayHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityMobileOverlayHelper.prototype.setup = function () {
		this.overlay = document.getElementById("mobile-overlay");
		this.dismiss = document.getElementById("btn-dismiss-mobile-overlay");
		if (!this.overlay) return;

		this.overlay.setAttribute("role", "dialog");
		this.overlay.setAttribute("aria-modal", "true");
		this.overlay.setAttribute("aria-label", "Mobile compatibility notice");
		this.overlay.setAttribute("aria-hidden", this.isVisible() ? "false" : "true");

		if (this.dismiss) {
			this.dismiss.setAttribute("aria-label", "Dismiss mobile compatibility notice");
			this.dismiss.addEventListener("keydown", function (event) {
				if (event.key !== " ") return;
				event.preventDefault();
				event.currentTarget.click();
			});
		}

		this.wasVisible = this.isVisible();
		if (this.wasVisible) this.focusDismiss();
		this.observe();
	};

	AccessibilityMobileOverlayHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !this.overlay) return;
		this.observer = new MutationObserver(() => this.sync());
		this.observer.observe(this.overlay, {
			attributes: true,
			attributeFilter: ["style", "class"],
		});
	};

	AccessibilityMobileOverlayHelper.prototype.sync = function () {
		let visible = this.isVisible();
		this.overlay.setAttribute("aria-hidden", visible ? "false" : "true");
		if (visible === this.wasVisible) return;

		if (visible) {
			this.previousFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
			this.focusDismiss();
		} else {
			let previous = this.previousFocus;
			this.previousFocus = null;
			if (previous && previous.isConnected && typeof previous.focus === "function") {
				window.setTimeout(() => previous.focus(), 0);
			}
		}
		this.wasVisible = visible;
	};

	AccessibilityMobileOverlayHelper.prototype.focusDismiss = function () {
		if (!this.dismiss || typeof this.dismiss.focus !== "function") return;
		window.setTimeout(() => {
			if (this.isVisible()) this.dismiss.focus();
		}, 0);
	};

	AccessibilityMobileOverlayHelper.prototype.isVisible = function () {
		if (!this.overlay) return false;
		let style = window.getComputedStyle ? window.getComputedStyle(this.overlay) : null;
		if (style && (style.display === "none" || style.visibility === "hidden")) return false;
		return this.overlay.getClientRects().length > 0;
	};

	return AccessibilityMobileOverlayHelper;
});
