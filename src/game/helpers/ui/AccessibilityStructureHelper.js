define([
	'game/helpers/ui/AccessibilityMobileExperienceHelper',
], function (AccessibilityMobileExperienceHelper) {

	let AccessibilityStructureHelper = function () {
		this.observer = null;
		this.mobileExperienceHelper = null;
		this.init();
	};

	AccessibilityStructureHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityStructureHelper.prototype.setup = function () {
		this.configureStatuses();
		this.configureTables(document);
		this.configureVisualAlternatives();
		this.mobileExperienceHelper = new AccessibilityMobileExperienceHelper();
		this.observe();
	};

	AccessibilityStructureHelper.prototype.configureStatuses = function () {
		this.setStatus(".loading-content", "polite");
		this.setStatus(".thinking-content", "polite");
		this.setStatus("#game-msg", "polite");
	};

	AccessibilityStructureHelper.prototype.setStatus = function (selector, politeness) {
		let elements = document.querySelectorAll(selector);
		for (let i = 0; i < elements.length; i++) {
			let element = elements[i];
			element.setAttribute("role", "status");
			element.setAttribute("aria-live", politeness || "polite");
			element.setAttribute("aria-atomic", "true");
		}
	};

	AccessibilityStructureHelper.prototype.getTableLabels = function () {
		return {
			"#in-assign-workers": "Phân công người lao động",
			"#embark-resources": "Tài nguyên mang theo",
			"#embark-items": "Vật phẩm mang theo",
			"#recruits-container table": "Người được tuyển khả dụng",
			"#trade-caravans-outgoing-container table": "Đối tác buôn bán và đoàn buôn đang đi",
			"#trade-caravans-incoming-container table": "Thương nhân đang đến",
			"#in-improvements-level table": "Dự án khả dụng ở tầng",
			"#in-improvements-colony table": "Dự án thuộc địa khả dụng",
			"#in-improvements-level-built table": "Dự án tầng đã xây",
			"#in-improvements-colony-built table": "Dự án thuộc địa đã xây",
			"#upgrades-list": "Nâng cấp khả dụng",
			"#blueprints-list": "Bản thiết kế",
		};
	};

	AccessibilityStructureHelper.prototype.configureTables = function (root) {
		if (!root || !root.querySelectorAll) return;
		let labels = this.getTableLabels();
		for (let selector in labels) {
			let tables = document.querySelectorAll(selector);
			for (let i = 0; i < tables.length; i++) {
				let table = tables[i];
				if (table.tagName !== "TABLE") continue;
				if (!table.getAttribute("aria-label") && !table.getAttribute("aria-labelledby")) {
					table.setAttribute("aria-label", labels[selector]);
				}
			}
		}
	};

	AccessibilityStructureHelper.prototype.configureVisualAlternatives = function () {
		let campVis = document.getElementById("campvis");
		if (campVis) {
			campVis.setAttribute("aria-hidden", "true");
			campVis.setAttribute("tabindex", "-1");
		}
	};

	AccessibilityStructureHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined") return;
		let root = document.getElementById("grid-switch-content") || document.body;
		if (!root) return;
		this.observer = new MutationObserver((mutations) => {
			let hasAddedNodes = false;
			for (let i = 0; i < mutations.length; i++) {
				if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
					hasAddedNodes = true;
					break;
				}
			}
			if (hasAddedNodes) this.configureTables(root);
		});
		this.observer.observe(root, { childList: true, subtree: true });
	};

	return AccessibilityStructureHelper;
});
