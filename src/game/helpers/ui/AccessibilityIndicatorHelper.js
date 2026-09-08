define([], function () {

	let AccessibilityIndicatorHelper = function () {
		this.observer = null;
		this.init();
	};

	AccessibilityIndicatorHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityIndicatorHelper.prototype.setup = function () {
		this.configureIndicators(document);
		this.configureVisualOnlyCanvases();
		this.observe();
	};

	AccessibilityIndicatorHelper.prototype.configureIndicators = function (root) {
		if (!root) return;
		let indicators = [];
		if (root.matches && root.matches(".item-comparison-indicator")) indicators.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".item-comparison-indicator");
			for (let i = 0; i < nested.length; i++) indicators.push(nested[i]);
		}

		for (let i = 0; i < indicators.length; i++) this.configureIndicator(indicators[i]);
	};

	AccessibilityIndicatorHelper.prototype.configureIndicator = function (indicator) {
		if (!indicator) return;
		let label = "";
		if (indicator.classList.contains("indicator-equipped")) label = "Đã trang bị";
		else if (indicator.classList.contains("indicator-increase")) label = "Tốt hơn lựa chọn hiện tại";
		else if (indicator.classList.contains("indicator-decrease")) label = "Tệ hơn lựa chọn hiện tại";
		else if (indicator.classList.contains("indicator-even")) label = "Giống lựa chọn hiện tại";

		if (label) {
			indicator.setAttribute("role", "img");
			indicator.setAttribute("aria-label", label);
		} else {
			indicator.removeAttribute("role");
			indicator.removeAttribute("aria-label");
		}
	};

	AccessibilityIndicatorHelper.prototype.configureVisualOnlyCanvases = function () {
		let techTree = document.getElementById("researched-upgrades-vis");
		if (techTree) {
			techTree.setAttribute("aria-hidden", "true");
			techTree.setAttribute("tabindex", "-1");
		}
	};

	AccessibilityIndicatorHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				if (mutation.type === "childList") {
					for (let j = 0; j < mutation.addedNodes.length; j++) {
						let node = mutation.addedNodes[j];
						if (node.nodeType === 1) this.configureIndicators(node);
					}
				} else if (mutation.type === "attributes") {
					let target = mutation.target;
					if (target.matches && target.matches(".item-comparison-indicator")) this.configureIndicator(target);
				}
			}
		});
		this.observer.observe(document.body, {
			childList: true,
			attributes: true,
			attributeFilter: ["class"],
			subtree: true,
		});
	};

	return AccessibilityIndicatorHelper;
});
