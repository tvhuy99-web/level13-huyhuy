define([], function () {

	let AccessibilityProgressHelper = function () {
		this.observer = null;
		this.timer = null;
		this.generatedIDCounter = 0;
		this.init();
	};

	AccessibilityProgressHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityProgressHelper.prototype.setup = function () {
		this.configureProgressBars(document);
		this.observeProgressBars();
		this.timer = window.setInterval(() => this.updateProgressBars(), 500);
	};

	AccessibilityProgressHelper.prototype.configureProgressBars = function (root) {
		if (!root) return;
		let bars = [];
		if (root.matches && root.matches(".progress-wrap")) bars.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".progress-wrap");
			for (let i = 0; i < nested.length; i++) bars.push(nested[i]);
		}

		for (let i = 0; i < bars.length; i++) {
			let bar = bars[i];
			bar.setAttribute("role", "progressbar");
			bar.setAttribute("aria-valuemin", "0");
			bar.setAttribute("aria-valuemax", "100");
			this.ensureProgressBarLabel(bar);
		}
		this.updateProgressBars();
	};

	AccessibilityProgressHelper.prototype.ensureProgressBarLabel = function (bar) {
		if (bar.getAttribute("aria-label") || bar.getAttribute("aria-labelledby")) return;

		let knownLabels = {
			"notification-player-bar-mobile": "Current action progress",
			"notification-player-bar-regular": "Current action progress",
			"in-population-bar-next": "Population progress",
			"fight-bar-enemy": "Enemy health",
			"fight-bar-enemy-shield": "Enemy shield",
			"fight-bar-self": "Your health",
			"fight-bar-self-shield": "Your shield",
		};
		if (bar.id && knownLabels[bar.id]) {
			bar.setAttribute("aria-label", knownLabels[bar.id]);
			return;
		}

		let stat = bar.closest ? bar.closest(".stat-indicator") : null;
		let label = stat ? stat.querySelector(".label") : null;
		if (label) {
			if (!label.id) {
				this.generatedIDCounter++;
				label.id = "accessibility-progress-label-" + this.generatedIDCounter;
			}
			bar.setAttribute("aria-labelledby", label.id);
			return;
		}

		if (bar.id) {
			let fallback = bar.id
				.replace(/^(progress-|bar-)/, "")
				.replace(/[-_]+/g, " ")
				.replace(/\s+/g, " ")
				.trim();
			if (fallback) bar.setAttribute("aria-label", fallback);
		}
	};

	AccessibilityProgressHelper.prototype.updateProgressBars = function () {
		if (document.hidden) return;
		let bars = document.querySelectorAll(".progress-wrap[role='progressbar']");
		for (let i = 0; i < bars.length; i++) this.updateProgressBar(bars[i]);
	};

	AccessibilityProgressHelper.prototype.updateProgressBar = function (bar) {
		let value = null;
		if (window.jQuery) value = window.jQuery(bar).data("progress-percent");
		if (typeof value !== "number") {
			let attrValue = bar.getAttribute("data-progress-percent");
			if (attrValue !== null) value = parseFloat(attrValue);
		}
		if (typeof value !== "number" || !isFinite(value)) return;

		value = Math.max(0, Math.min(100, Math.round(value)));
		bar.setAttribute("aria-valuenow", String(value));

		let progressLabel = bar.querySelector(".progress-label");
		let labelText = progressLabel ? this.normalize(progressLabel.textContent) : "";
		let valueText = value + " percent";
		if (labelText && labelText.toLowerCase().indexOf("percent") < 0) {
			valueText = labelText + ", " + valueText;
		}
		bar.setAttribute("aria-valuetext", valueText);
	};

	AccessibilityProgressHelper.prototype.observeProgressBars = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				for (let j = 0; j < mutations[i].addedNodes.length; j++) {
					let node = mutations[i].addedNodes[j];
					if (node.nodeType === 1) this.configureProgressBars(node);
				}
			}
		});
		this.observer.observe(document.body, { childList: true, subtree: true });
	};

	AccessibilityProgressHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityProgressHelper;
});
