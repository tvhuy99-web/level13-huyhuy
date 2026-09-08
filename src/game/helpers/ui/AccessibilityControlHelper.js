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

	AccessibilityControlHelper.prototype.getSelector = function () {
		return "button, [role='button'], input:not([type='hidden']), select, textarea, a[href]";
	};

	AccessibilityControlHelper.prototype.configureControls = function (root) {
		if (!root) return;
		let controls = [];
		let selector = this.getSelector();
		if (root.matches && root.matches(selector)) controls.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(selector);
			for (let i = 0; i < nested.length; i++) controls.push(nested[i]);
		}

		for (let i = 0; i < controls.length; i++) this.configureControl(controls[i]);
	};

	AccessibilityControlHelper.prototype.configureControl = function (control) {
		if (!control) return;
		let isFormControl = control.matches && control.matches("input, select, textarea");
		let visibleText = this.normalize(control.textContent);
		let hasExplicitName = this.hasExplicitName(control);
		let hasMeaningfulText = !isFormControl && visibleText && !this.isGlyphOnly(visibleText);

		if (!hasExplicitName && !hasMeaningfulText) {
			let label = this.getBestLabel(control);
			if (label) control.setAttribute("aria-label", label);
		}

		let nowHasAccessibleName = this.hasExplicitName(control) || hasMeaningfulText;
		if (nowHasAccessibleName && control.matches && control.matches("button, [role='button'], a[href]")) {
			this.hideDecorativeImages(control);
		}
	};

	AccessibilityControlHelper.prototype.hasExplicitName = function (control) {
		if (!control) return false;
		if (control.getAttribute("aria-label") || control.getAttribute("aria-labelledby")) return true;
		if (control.labels && control.labels.length > 0) return true;
		return false;
	};

	AccessibilityControlHelper.prototype.getBestLabel = function (control) {
		let title = this.normalize(control.getAttribute("title"));
		if (title) return title;

		let placeholder = this.normalize(control.getAttribute("placeholder"));
		if (placeholder) return placeholder;

		let image = control.querySelector ? control.querySelector("img[alt]") : null;
		let imageAlt = image ? this.normalize(image.getAttribute("alt")) : "";
		if (imageAlt) return imageAlt;

		let id = this.normalize(control.id);
		if (id) {
			let idLabel = id
				.replace(/^btn[-_]?/i, "")
				.replace(/^select[-_]?/i, "")
				.replace(/[-_]?dropdown$/i, "")
				.replace(/^settings[-_]?checkbox[-_]?/i, "");
			idLabel = this.humanize(idLabel);
			if (idLabel) return idLabel;
		}

		let name = this.normalize(control.getAttribute("name"));
		if (name) return this.humanize(name);

		let action = this.normalize(control.getAttribute("action"));
		if (action) return this.humanize(action);

		let text = this.normalize(control.textContent);
		if (text && !(control.matches && control.matches("select"))) return this.humanize(text);
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
			let selector = this.getSelector();
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
					if (target.matches && target.matches(selector)) this.configureControl(target);
				}
			}
		});
		this.observer.observe(document.body, {
			childList: true,
			attributes: true,
			attributeFilter: ["aria-label", "aria-labelledby", "title", "action", "placeholder", "name"],
			subtree: true,
		});
	};

	return AccessibilityControlHelper;
});
