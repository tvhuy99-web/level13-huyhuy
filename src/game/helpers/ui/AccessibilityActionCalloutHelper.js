define([], function () {

	let AccessibilityActionCalloutHelper = function () {
		this.observer = null;
		this.generatedIDCounter = 0;
		this.feedbackRegion = null;
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
		this.ensureFeedbackRegion();
		this.configureActionCallouts(document);
		this.observeActionCallouts();
	};

	AccessibilityActionCalloutHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	AccessibilityActionCalloutHelper.prototype.configureActionCallouts = function (root) {
		if (!root) return;

		let containers = [];
		let seen = [];
		let add = function (container) {
			if (!container || seen.indexOf(container) >= 0) return;
			seen.push(container);
			containers.push(container);
		};

		if (root.matches && root.matches(".callout-container")) add(root);
		if (root.closest) add(root.closest(".callout-container"));
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".callout-container");
			for (let i = 0; i < nested.length; i++) add(nested[i]);
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
		let label = this.updateActionButtonLabel(button, callout);
		this.updateDisabledActionProxy(buttonContainer, button, callout, label, calloutID);

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

	AccessibilityActionCalloutHelper.prototype.updateActionButtonLabel = function (button, callout) {
		if (!button || !callout) return "";

		let labelElement = button.querySelector(".btn-label");
		let visibleLabel = this.normalize(labelElement && labelElement.textContent);
		let storedLabel = this.normalize(button.getAttribute("data-a11y-action-base-label"));
		let existingLabel = this.normalize(button.getAttribute("aria-label"));
		let baseLabel = visibleLabel || storedLabel || existingLabel || this.normalize(button.textContent);
		if (!baseLabel) return "";

		if (visibleLabel) button.setAttribute("data-a11y-action-base-label", visibleLabel);
		else if (!storedLabel) button.setAttribute("data-a11y-action-base-label", baseLabel);

		let action = this.normalize(button.getAttribute("action"));
		let isMovementAction = action.indexOf("move_sector_") === 0;
		if (isMovementAction) return existingLabel || baseLabel;

		let isBuildAction = button.classList.contains("action-build") || action.indexOf("build_") === 0;
		let isImproveAction = button.classList.contains("action-improve") || action.indexOf("improve_") === 0;
		let isDetailedAction = isBuildAction || isImproveAction;

		let parts = [baseLabel];
		if (isDetailedAction) {
			let costText = this.getActionCostText(callout);
			if (costText) parts.push("Cost: " + costText);

			let descriptionText = this.getActionDescriptionText(callout);
			if (descriptionText) parts.push(descriptionText);
		}

		if (button.disabled) {
			parts.push("Unavailable");
			let disabledReason = this.getDisabledReasonText(callout);
			if (disabledReason) {
				parts.push(disabledReason);
			} else {
				let blockedCostText = this.getBlockedCostText(callout);
				if (blockedCostText) parts.push("Missing resources or requirements: " + blockedCostText);
				else parts.push("Requirements not met");
			}
		}

		let label = parts.join(". ");
		let shouldWriteLabel = isDetailedAction || button.disabled || button.getAttribute("data-a11y-action-details") === "1";
		if (shouldWriteLabel && button.getAttribute("aria-label") !== label) button.setAttribute("aria-label", label);

		if (isDetailedAction) button.setAttribute("data-a11y-action-details", "1");
		else if (!button.disabled) button.removeAttribute("data-a11y-action-details");

		if (button.disabled) button.setAttribute("aria-disabled", "true");
		else button.removeAttribute("aria-disabled");

		return shouldWriteLabel ? label : (existingLabel || baseLabel);
	};

	AccessibilityActionCalloutHelper.prototype.getActionCostText = function (callout) {
		let elements = callout.querySelectorAll(".action-cost");
		return this.getUniqueElementText(elements);
	};

	AccessibilityActionCalloutHelper.prototype.getBlockedCostText = function (callout) {
		let elements = callout.querySelectorAll(".action-cost.action-cost-blocker");
		return this.getUniqueElementText(elements);
	};

	AccessibilityActionCalloutHelper.prototype.getUniqueElementText = function (elements) {
		let parts = [];
		let seen = {};
		for (let i = 0; i < elements.length; i++) {
			let text = this.normalize(elements[i].textContent).replace(/\s*:\s*/g, " ");
			let key = text.toLowerCase();
			if (!text || seen[key]) continue;
			seen[key] = true;
			parts.push(text);
		}
		return parts.join(", ");
	};

	AccessibilityActionCalloutHelper.prototype.getActionDescriptionText = function (callout) {
		let selectors = [".action-description", ".action-effect-description"];
		let parts = [];
		let seen = {};
		for (let i = 0; i < selectors.length; i++) {
			let element = callout.querySelector(selectors[i]);
			let text = this.normalize(element && element.textContent);
			let key = text.toLowerCase();
			if (!text || seen[key]) continue;
			seen[key] = true;
			parts.push(text);
		}
		return parts.join(". ");
	};

	AccessibilityActionCalloutHelper.prototype.getDisabledReasonText = function (callout) {
		let element = callout.querySelector(".btn-disabled-reason");
		let text = this.normalize(element && element.textContent);
		if (!text) return "";
		if (/DISABLED_REASON_[A-Z0-9_]+/.test(text)) return "";
		return text;
	};

	AccessibilityActionCalloutHelper.prototype.updateDisabledActionProxy = function (buttonContainer, button, callout, label, calloutID) {
		if (!buttonContainer || !button) return;

		let action = this.normalize(button.getAttribute("action"));
		let isMovementAction = action.indexOf("move_sector_") === 0;
		if (isMovementAction) {
			this.clearDisabledActionProxy(buttonContainer, button);
			return;
		}

		if (!button.disabled) {
			this.clearDisabledActionProxy(buttonContainer, button);
			return;
		}

		let proxyLabel = label || this.normalize(button.getAttribute("aria-label")) || this.normalize(button.textContent) || "Action unavailable";
		buttonContainer.setAttribute("data-a11y-disabled-proxy", "1");
		buttonContainer.setAttribute("role", "button");
		buttonContainer.setAttribute("tabindex", "0");
		buttonContainer.setAttribute("aria-disabled", "true");
		buttonContainer.setAttribute("aria-label", proxyLabel);
		if (calloutID) this.appendAriaReference(buttonContainer, "aria-describedby", calloutID);
		button.setAttribute("aria-hidden", "true");

		if (buttonContainer.getAttribute("data-a11y-disabled-proxy-bound") === "1") return;
		buttonContainer.setAttribute("data-a11y-disabled-proxy-bound", "1");

		let sys = this;
		let announce = function (event) {
			if (buttonContainer.getAttribute("data-a11y-disabled-proxy") !== "1") return;
			if (event) {
				event.preventDefault();
				event.stopPropagation();
				if (event.stopImmediatePropagation) event.stopImmediatePropagation();
			}
			sys.announceDisabledAction(buttonContainer);
		};

		buttonContainer.addEventListener("click", announce, true);
		buttonContainer.addEventListener("keydown", function (event) {
			if (event.key !== "Enter" && event.key !== " ") return;
			announce(event);
		}, true);
	};

	AccessibilityActionCalloutHelper.prototype.clearDisabledActionProxy = function (buttonContainer, button) {
		if (!buttonContainer || buttonContainer.getAttribute("data-a11y-disabled-proxy") !== "1") return;
		buttonContainer.removeAttribute("data-a11y-disabled-proxy");
		buttonContainer.removeAttribute("role");
		buttonContainer.removeAttribute("tabindex");
		buttonContainer.removeAttribute("aria-disabled");
		buttonContainer.removeAttribute("aria-label");
		buttonContainer.removeAttribute("aria-describedby");
		if (button) button.removeAttribute("aria-hidden");
	};

	AccessibilityActionCalloutHelper.prototype.ensureFeedbackRegion = function () {
		if (this.feedbackRegion && document.body && document.body.contains(this.feedbackRegion)) return this.feedbackRegion;
		let region = document.getElementById("accessibility-action-feedback");
		if (!region) {
			region = document.createElement("p");
			region.id = "accessibility-action-feedback";
			region.className = "hide-from-visual-layout";
			region.setAttribute("role", "status");
			region.setAttribute("aria-live", "polite");
			region.setAttribute("aria-atomic", "true");
			let host = document.getElementById("unit-main") || document.body;
			if (host) host.appendChild(region);
		}
		this.feedbackRegion = region;
		return region;
	};

	AccessibilityActionCalloutHelper.prototype.announceDisabledAction = function (buttonContainer) {
		let region = this.ensureFeedbackRegion();
		if (!region || !buttonContainer) return;
		let text = this.normalize(buttonContainer.getAttribute("aria-label")) || "Action unavailable. Requirements not met.";
		region.textContent = "";
		window.setTimeout(function () {
			region.textContent = text;
		}, 20);
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
				let mutation = mutations[i];
				let target = mutation.target && mutation.target.nodeType === 1 ? mutation.target : mutation.target && mutation.target.parentElement;
				if (target) this.configureActionCallouts(target);
				let addedNodes = mutation.addedNodes || [];
				for (let j = 0; j < addedNodes.length; j++) {
					let node = addedNodes[j];
					if (node.nodeType === 1) this.configureActionCallouts(node);
				}
			}
		});
		this.observer.observe(document.body, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["class", "style", "disabled"],
			subtree: true
		});
	};

	return AccessibilityActionCalloutHelper;
});
