define([], function () {

	let AccessibilityTechTreeHelper = function () {
		this.observer = null;
		this.init();
	};

	AccessibilityTechTreeHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityTechTreeHelper.prototype.setup = function () {
		let overlay = document.getElementById("upgrades-vis-overlay");
		if (overlay) {
			overlay.setAttribute("role", "group");
			overlay.setAttribute("aria-label", "Technology tree");
		}
		this.configureNodes(document);
		this.observe();
	};

	AccessibilityTechTreeHelper.prototype.configureNodes = function (root) {
		if (!root) return;
		let nodes = [];
		if (root.matches && root.matches(".upgrades-overlay-cell")) nodes.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".upgrades-overlay-cell");
			for (let i = 0; i < nested.length; i++) nodes.push(nested[i]);
		}

		for (let i = 0; i < nodes.length; i++) this.configureNode(nodes[i]);
	};

	AccessibilityTechTreeHelper.prototype.configureNode = function (node) {
		if (!node) return;
		let name = this.normalize(node.textContent);
		node.setAttribute("role", "button");
		if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "0");
		if (name) node.setAttribute("aria-label", "View upgrade details: " + name);

		if (node.getAttribute("data-accessibility-key-bound") !== "true") {
			node.setAttribute("data-accessibility-key-bound", "true");
			node.addEventListener("keydown", function (event) {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				node.click();
			});
		}
	};

	AccessibilityTechTreeHelper.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined") return;
		let overlay = document.getElementById("upgrades-vis-overlay");
		if (!overlay) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				for (let j = 0; j < mutations[i].addedNodes.length; j++) {
					let node = mutations[i].addedNodes[j];
					if (node.nodeType === 1) this.configureNodes(node);
				}
			}
		});
		this.observer.observe(overlay, { childList: true, subtree: true });
	};

	AccessibilityTechTreeHelper.prototype.normalize = function (value) {
		return String(value || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityTechTreeHelper;
});
