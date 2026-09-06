define([], function () {

	let AccessibilityActionCalloutHelper = function () {
		this.observer = null;
		this.generatedIDCounter = 0;
		this.init();
	};

	AccessibilityActionCalloutHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityActionCalloutHelper.prototype.setup = function () {
		this.configureActionCallouts(document);
		this.observeActionCallouts();
	};

	AccessibilityActionCalloutHelper.prototype.configureActionCallouts = function (root) {
		if (!root) return;

		let containers = [];
		if (root.matches && root.matches(".callout-container")) containers.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".callout-container");
			for (let i = 0; i < nested.length; i++) containers.push(nested[i]);
		}

		for (let i = 0; i < containers.length; i++) {
			this.configureActionCallout(containers[i]);
		}
	};

	AccessibilityActionCalloutHelper.prototype.configureActionCallout = function (root) {
		if (!root) return;

		let buttonContainer = null;
		let callout = null;
		for (let i = 0; i < root.children.length; i++) {
			let child = root.children[i];
			if (child.classList && child.classList.contains("container-btn-action")) buttonContainer = child;
			if (child.classList && child.classList.contains("btn-callout")) callout = child;
		}
		if (!buttonContainer || !callout) return;

		let button = buttonContainer.querySelector("button");
		if (!button) return;

		let calloutID = this.ensureID(callout);
		callout.setAttribute("role", "tooltip");
		this.appendAriaReference(button, "aria-describedby", calloutID);

		if (root.getAttribute("data-accessibility-action-callout-bound") === "true") return;
		root.setAttribute("data-accessibility-action-callout-bound", "true");

		root.addEventListener("focusin", function () {
			callout.style.display = "block";
		});

		root.addEventListener("focusout", function () {
			window.setTimeout(function () {
				if (!root.contains(document.activeElement)) {
					callout.style.removeProperty("display");
				}
			}, 0);
		});
	};

	AccessibilityActionCalloutHelper.prototype.ensureID = function (element) {
		if (element.id) return element.id;
		this.generatedIDCounter++;
		element.id = "accessibility-action-callout-" + this.generatedIDCounter;
		return element.id;
	};

	AccessibilityActionCalloutHelper.prototype.appendAriaReference = function (element, attribute, id) {
		if (!element || !id) return;
		let refs = (element.getAttribute(attribute) || "").split(/\s+/).filter(Boolean);
		if (refs.indexOf(id) < 0) refs.push(id);
		element.setAttribute(attribute, refs.join(" "));
	};

	AccessibilityActionCalloutHelper.prototype.observeActionCallouts = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let addedNodes = mutations[i].addedNodes;
				for (let j = 0; j < addedNodes.length; j++) {
					let node = addedNodes[j];
					if (node.nodeType === 1) this.configureActionCallouts(node);
				}
			}
		});
		this.observer.observe(document.body, { childList: true, subtree: true });
	};

	return AccessibilityActionCalloutHelper;
});
