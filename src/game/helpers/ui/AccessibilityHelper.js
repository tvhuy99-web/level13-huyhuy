define([], function () {

	let AccessibilityHelper = function () {
		this.politeRegion = null;
		this.assertiveRegion = null;
		this.tabObserver = null;
		this.formObserver = null;
		this.generatedIDCounter = 0;
		this.init();
	};

	AccessibilityHelper.prototype.init = function () {
		if (typeof document === "undefined") return;

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityHelper.prototype.setup = function () {
		this.politeRegion = this.getOrCreateLiveRegion("accessibility-announcer-polite", "status", "polite");
		this.assertiveRegion = this.getOrCreateLiveRegion("accessibility-announcer-assertive", "alert", "assertive");
		this.configureGameLog();
		this.configureTabs();
		this.configureFormControls(document);
		this.configureCallouts(document);
		this.observeDynamicUI();
	};

	AccessibilityHelper.prototype.getOrCreateLiveRegion = function (id, role, politeness) {
		let region = document.getElementById(id);
		if (!region) {
			region = document.createElement("div");
			region.id = id;
			region.className = "hide-from-visual-layout";
			document.body.appendChild(region);
		}
		region.setAttribute("role", role);
		region.setAttribute("aria-live", politeness);
		region.setAttribute("aria-atomic", "true");
		return region;
	};

	AccessibilityHelper.prototype.configureGameLog = function () {
		let log = document.querySelector("#log-latest ul");
		if (!log) return;
		log.setAttribute("aria-live", "polite");
		log.setAttribute("aria-relevant", "additions text");
		log.setAttribute("aria-atomic", "false");
		if (!log.getAttribute("aria-label")) log.setAttribute("aria-label", "Thông báo trò chơi gần đây");
	};

	AccessibilityHelper.prototype.configureTabs = function () {
		let tabList = document.getElementById("switch-tabs");
		if (!tabList) return;
		tabList.setAttribute("role", "tablist");
		if (!tabList.getAttribute("aria-label")) tabList.setAttribute("aria-label", "Các khu vực trò chơi");

		let tabs = tabList.children;
		for (let i = 0; i < tabs.length; i++) {
			let tab = tabs[i];
			if (tab.tagName !== "LI") continue;
			tab.setAttribute("role", "tab");
			let panels = document.querySelectorAll(".tabcontainer[data-tab='" + tab.id + "']");
			let panelIDs = [];
			for (let j = 0; j < panels.length; j++) {
				let panel = panels[j];
				if (!panel.id) continue;
				panelIDs.push(panel.id);
				panel.setAttribute("role", "tabpanel");
				panel.setAttribute("aria-labelledby", tab.id);
			}
			if (panelIDs.length > 0) tab.setAttribute("aria-controls", panelIDs.join(" "));
		}
		this.syncTabStates();
		if (!this.tabObserver && typeof MutationObserver !== "undefined") {
			this.tabObserver = new MutationObserver(() => this.syncTabStates());
			this.tabObserver.observe(tabList, { attributes: true, attributeFilter: ["class", "style"], subtree: true });
		}
	};

	AccessibilityHelper.prototype.syncTabStates = function () {
		let tabList = document.getElementById("switch-tabs");
		if (!tabList) return;
		let tabs = tabList.children;
		for (let i = 0; i < tabs.length; i++) {
			let tab = tabs[i];
			if (tab.tagName !== "LI") continue;
			tab.setAttribute("aria-selected", tab.classList.contains("selected") ? "true" : "false");
			tab.setAttribute("aria-disabled", tab.classList.contains("disabled") ? "true" : "false");
		}
	};

	AccessibilityHelper.prototype.configureFormControls = function (root) {
		if (!root) return;
		let controls = [];
		if (root.matches && root.matches("input, select, textarea")) controls.push(root);
		if (root.querySelectorAll) {
			let nestedControls = root.querySelectorAll("input, select, textarea");
			for (let i = 0; i < nestedControls.length; i++) controls.push(nestedControls[i]);
		}
		for (let i = 0; i < controls.length; i++) {
			let control = controls[i];
			if (!this.hasAccessibleName(control)) {
				let type = (control.getAttribute("type") || "").toLowerCase();
				if (type === "checkbox" || type === "radio") this.labelCheckboxLikeControl(control);
				if (!this.hasAccessibleName(control)) this.labelControlFromContainer(control);
				if (!this.hasAccessibleName(control)) this.labelControlFromName(control);
			}
			if (control.classList && control.classList.contains("amount")) this.labelStepperButtons(control);
		}
	};

	AccessibilityHelper.prototype.hasAccessibleName = function (control) {
		if (!control) return false;
		if (control.getAttribute("aria-label")) return true;
		if (control.getAttribute("aria-labelledby")) return true;
		if (control.labels && control.labels.length > 0) return true;
		return false;
	};

	AccessibilityHelper.prototype.labelCheckboxLikeControl = function (control) {
		let label = control.nextElementSibling;
		if (!label || !label.classList || !label.classList.contains("checkbox-label")) return;
		control.setAttribute("aria-labelledby", this.ensureElementID(label, "accessibility-label"));
	};

	AccessibilityHelper.prototype.labelControlFromContainer = function (control) {
		if (!control.closest) return;
		let container = control.closest(".select-container, .input-container, .stepper");
		if (!container) return;
		let label = container.querySelector("label, .label, .checkbox-label");
		if (!label || label === control) return;
		control.setAttribute("aria-labelledby", this.ensureElementID(label, "accessibility-label"));
	};

	AccessibilityHelper.prototype.labelControlFromName = function (control) {
		let name = control.getAttribute("name");
		if (!name) return;
		let label = String(name).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
		if (label) control.setAttribute("aria-label", label);
	};

	AccessibilityHelper.prototype.labelStepperButtons = function (input) {
		let parent = input.parentElement;
		if (!parent) return;
		let inputName = input.getAttribute("aria-label") || input.getAttribute("name") || "value";
		inputName = String(inputName).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
		let buttons = parent.querySelectorAll("button[data-type='minus'], button[data-type='plus']");
		for (let i = 0; i < buttons.length; i++) {
			let button = buttons[i];
			if (button.getAttribute("aria-label")) continue;
			let action = button.getAttribute("data-type") === "plus" ? "Tăng" : "Giảm";
			button.setAttribute("aria-label", action + " " + inputName);
			if (input.id) button.setAttribute("aria-controls", input.id);
		}
	};

	AccessibilityHelper.prototype.configureCallouts = function (root) {
		if (!root) return;
		let containers = [];
		if (root.matches && root.matches(".callout-container")) containers.push(root);
		if (root.querySelectorAll) {
			let nestedContainers = root.querySelectorAll(".callout-container");
			for (let i = 0; i < nestedContainers.length; i++) containers.push(nestedContainers[i]);
		}

		for (let i = 0; i < containers.length; i++) {
			let container = containers[i];
			let target = null;
			for (let j = 0; j < container.children.length; j++) {
				let child = container.children[j];
				if (child.classList && child.classList.contains("info-callout-target")) { target = child; break; }
			}
			let callout = container.querySelector(".info-callout");
			if (!target || !callout) continue;

			let calloutID = this.ensureElementID(callout, "accessibility-callout");
			let hasInteractiveContent = !!callout.querySelector("button, input, select, textarea, a[href], [role='button'], [role='radio'], [role='option']");

			if (!hasInteractiveContent) {
				target.removeAttribute("tabindex");
				if (target.getAttribute("role") === "note" || target.getAttribute("role") === "tooltip") target.removeAttribute("role");
				if (target.getAttribute("aria-label") === "Thêm thông tin") target.removeAttribute("aria-label");
				this.removeAriaReference(target, "aria-describedby", calloutID);
				callout.setAttribute("aria-hidden", "true");
				callout.removeAttribute("role");
				callout.removeAttribute("tabindex");
				continue;
			}

			callout.removeAttribute("aria-hidden");
			callout.setAttribute("role", "group");
			if (!callout.getAttribute("aria-label")) callout.setAttribute("aria-label", "Chi tiết và hành động");

			let focusTarget = this.getFocusableCalloutTarget(target);
			if (!focusTarget) {
				target.setAttribute("tabindex", "0");
				target.setAttribute("role", "group");
				let description = this.normalizeMessage(target.getAttribute("description"));
				if (description && !target.getAttribute("aria-label")) target.setAttribute("aria-label", description);
				focusTarget = target;
			}
			this.appendAriaReference(focusTarget, "aria-describedby", calloutID);
			this.bindCalloutFocusBehavior(container, target, callout);
		}
	};

	AccessibilityHelper.prototype.bindCalloutFocusBehavior = function (container, target, callout) {
		if (!container || !target || !callout) return;
		if (container.getAttribute("data-accessibility-focus-bound") === "true") return;
		container.setAttribute("data-accessibility-focus-bound", "true");
		container.addEventListener("focusin", function () {
			callout.style.display = target.classList.contains("info-callout-target-side") ? "flex" : "block";
		});
		container.addEventListener("focusout", function () {
			window.setTimeout(function () {
				if (!container.contains(document.activeElement)) callout.style.removeProperty("display");
			}, 0);
		});
	};

	AccessibilityHelper.prototype.getFocusableCalloutTarget = function (target) {
		if (!target) return null;
		if (target.matches && target.matches("button, input, select, textarea, a[href], [role='button'], [role='radio'], [role='option']")) return target;
		if (!target.querySelector) return null;
		return target.querySelector("button, input, select, textarea, a[href], [role='button'], [role='radio'], [role='option']");
	};

	AccessibilityHelper.prototype.appendAriaReference = function (element, attribute, id) {
		if (!element || !id) return;
		let current = (element.getAttribute(attribute) || "").split(/\s+/).filter(Boolean);
		if (current.indexOf(id) < 0) current.push(id);
		element.setAttribute(attribute, current.join(" "));
	};

	AccessibilityHelper.prototype.removeAriaReference = function (element, attribute, id) {
		if (!element || !id) return;
		let current = (element.getAttribute(attribute) || "").split(/\s+/).filter(Boolean).filter(value => value !== id);
		if (current.length) element.setAttribute(attribute, current.join(" "));
		else element.removeAttribute(attribute);
	};

	AccessibilityHelper.prototype.ensureElementID = function (element, prefix) {
		if (element.id) return element.id;
		this.generatedIDCounter++;
		element.id = prefix + "-" + this.generatedIDCounter;
		return element.id;
	};

	AccessibilityHelper.prototype.observeDynamicUI = function () {
		if (this.formObserver || typeof MutationObserver === "undefined" || !document.body) return;
		this.formObserver = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let addedNodes = mutations[i].addedNodes;
				for (let j = 0; j < addedNodes.length; j++) {
					let node = addedNodes[j];
					if (node.nodeType !== 1) continue;
					this.configureFormControls(node);
					this.configureCallouts(node);
				}
			}
		});
		this.formObserver.observe(document.body, { childList: true, subtree: true });
	};

	AccessibilityHelper.prototype.normalizeMessage = function (message) {
		if (message === null || typeof message === "undefined") return "";
		return String(message).replace(/\s+/g, " ").trim();
	};

	AccessibilityHelper.prototype.announce = function (message, priority) {
		let text = this.normalizeMessage(message);
		if (!text) return;
		if (!this.politeRegion || !this.assertiveRegion) this.setup();
		let region = priority === "assertive" ? this.assertiveRegion : this.politeRegion;
		if (!region) return;
		region.textContent = "";
		window.setTimeout(function () { region.textContent = text; }, 20);
	};

	AccessibilityHelper.prototype.announcePolite = function (message) { this.announce(message, "polite"); };
	AccessibilityHelper.prototype.announceAssertive = function (message) { this.announce(message, "assertive"); };

	return AccessibilityHelper;
});
