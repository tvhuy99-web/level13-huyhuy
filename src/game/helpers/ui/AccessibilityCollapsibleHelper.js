define([], function () {

	let AccessibilityCollapsibleHelper = function () {
		this.observer = null;
		this.generatedIDCounter = 0;
		this.init();
	};

	AccessibilityCollapsibleHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityCollapsibleHelper.prototype.setup = function () {
		this.configureHeaders(document);
		this.observeHeaders();
	};

	AccessibilityCollapsibleHelper.prototype.configureHeaders = function (root) {
		if (!root) return;
		let headers = [];
		if (root.matches && root.matches(".collapsible-header")) headers.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".collapsible-header");
			for (let i = 0; i < nested.length; i++) headers.push(nested[i]);
		}

		for (let i = 0; i < headers.length; i++) this.configureHeader(headers[i]);
	};

	AccessibilityCollapsibleHelper.prototype.configureHeader = function (header) {
		if (!header) return;
		header.setAttribute("role", "button");
		if (!header.hasAttribute("tabindex")) header.setAttribute("tabindex", "0");

		let content = header.nextElementSibling;
		if (content && content.classList && content.classList.contains("collapsible-content")) {
			if (!content.id) {
				this.generatedIDCounter++;
				content.id = "accessibility-collapsible-content-" + this.generatedIDCounter;
			}
			header.setAttribute("aria-controls", content.id);
		}

		this.syncHeader(header);

		if (header.getAttribute("data-accessibility-key-bound") !== "true") {
			header.setAttribute("data-accessibility-key-bound", "true");
			header.addEventListener("keydown", function (event) {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				header.click();
			});
		}
	};

	AccessibilityCollapsibleHelper.prototype.syncHeader = function (header) {
		if (!header) return;
		let content = header.nextElementSibling;
		let isOpen = header.classList.contains("collapsible-open");
		if (!header.classList.contains("collapsible-open") && !header.classList.contains("collapsible-collapsed") && content) {
			let style = window.getComputedStyle ? window.getComputedStyle(content) : null;
			isOpen = !style || style.display !== "none";
		}
		header.setAttribute("aria-expanded", isOpen ? "true" : "false");
	};

	AccessibilityCollapsibleHelper.prototype.observeHeaders = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				if (mutation.type === "childList") {
					for (let j = 0; j < mutation.addedNodes.length; j++) {
						let node = mutation.addedNodes[j];
						if (node.nodeType === 1) this.configureHeaders(node);
					}
				}
				if (mutation.type === "attributes") {
					let target = mutation.target;
					if (target.matches && target.matches(".collapsible-header")) {
						this.syncHeader(target);
					} else if (target.matches && target.matches(".collapsible-content")) {
						let header = target.previousElementSibling;
						if (header && header.classList.contains("collapsible-header")) this.syncHeader(header);
					}
				}
			}
		});
		this.observer.observe(document.body, {
			childList: true,
			attributes: true,
			attributeFilter: ["class", "style"],
			subtree: true,
		});
	};

	return AccessibilityCollapsibleHelper;
});
