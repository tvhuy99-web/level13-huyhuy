define([], function () {

	let AccessibilityControlHelper = function () {
		this.observer = null;
		this.init();
	};

	AccessibilityControlHelper.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityControlHelper.prototype.setup = function () {
		this.configureControls(document);
		this.observeControls();
	};

	AccessibilityControlHelper.prototype.configureControls = function (root) {
		if (!root) return;
		let controls = [];
		if (root.matches && root.matches("button, [role='button']")) controls.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll("button, [role='button']");
			for (let i = 0; i < nested.length; i++) controls.push(nested[i]);
		}

		for (let i = 0; i < controls.length; i++) this.configureControl(controls[i]);
	};

	AccessibilityControlHelper.prototype.configureControl = function (control) {
		if (!control) return;
		let visibleText = this.normalize(control.textContent);
		let hasExplicitName = !!control.getAttribute("aria-label") || !!control.getAttribute("aria-labelledby");
		let hasMeaningfulText = visibleText && !this.isGlyphOnly(visibleText);

		if (!hasExplicitName && !hasMeaningfulText) {
			let label = this.getBestLabel(control);
			if (label) control.setAttribute("aria-label", label);
		}

		let nowHasAccessibleName = !!control.getAttribute("aria-label") || !!control.getAttribute("aria-labelledby") || hasMeaningfulText;
		if (nowHasAccessibleName) this.hideDecorativeImages(control);
	};

	AccessibilityControlHelper.prototype.getBestLabel = function (control) {
		let title = this.normalize(control.getAttribute("title"));
		if (title) return title;

		let image = control.querySelector ? control.querySelector("img[alt]") : null;
		let imageAlt = image ? this.normalize(image.getAttribute("alt")) : "";
		if (imageAlt) return imageAlt;

		let id = this.normalize(control.id);
		if (id) {
			let idLabel = this.humanize(id.replace(/^btn[-_]?/i, ""));
			if (idLabel) return idLabel;
		}

		let action = this.normalize(control.getAttribute("action"));
		if (action) return this.humanize(action);

		let text = this.normalize(control.textContent);
		if (text) return this.humanize(text);
		return "";
	};

	AccessibilityControlHelper.prototype.hideDecorativeImages = function (control) {
		if (!control.querySelectorAll) return;
		let images = control.querySelectorAll("img");
		for (let i = 0; i < images.length; i++) {
			images[i].setAttribute("alt", "");
			images[i].setAttribute("aria-hidden", "true");
		}
	};

	AccessibilityControlHelper.prototype.isGlyphOnly = function (text) {
		let compact = String(text || "").replace(/\s+/g, "");
		if (!compact) return true;
		return /^[×+\-−–—←→↑↓⇵<>«»‹›⋯…✓✔✕✖]+$/.test(compact);
	};

	AccessibilityControlHelper.prototype.humanize = function (value) {
		return String(value || "")
			.replace(/[_-]+/g, " ")
			.replace(/\bpopup\b/gi, "popup")
			.replace(/\s+/g, " ")
			.trim();
	};

	AccessibilityControlHelper.prototype.normalize = function (value) {
		return String(value || "").replace(/\s+/g, " ").trim();
	};

	AccessibilityControlHelper.prototype.observeControls = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				if (mutation.type === "childList") {
					for (let j = 0; j < mutation.addedNodes.length; j++) {
						let node = mutation.addedNodes[j];
						if (node.nodeType === 1) this.configureControls(node);
					}
				}
				if (mutation.type === "attributes") {
					let target = mutation.target;
					if (target.matches && target.matches("button, [role='button']")) this.configureControl(target);
				}
			}
		});
		this.observer.observe(document.body, {
			childList: true,
			attributes: true,
			attributeFilter: ["aria-label", "aria-labelledby", "title", "action"],
			subtree: true,
		});
	};

	return AccessibilityControlHelper;
});
