define([
	'game/helpers/ui/AccessibilityOverviewCleanupPatch'
], function (AccessibilityMobileExperienceHelper) {

	let H = AccessibilityMobileExperienceHelper;

	H.prototype.isGeneratedAccessibilityMutationTarget = function (target) {
		if (!target) return false;
		let element = target.nodeType === 1 ? target : target.parentElement;
		if (!element || !element.closest) return false;
		return !!element.closest(
			"[data-a11y-summary='1'], #accessibility-movement-status"
		);
	};

	H.prototype.hasMeaningfulObservedMutation = function (mutations) {
		for (let i = 0; i < mutations.length; i++) {
			let mutation = mutations[i];
			if (this.isGeneratedAccessibilityMutationTarget(mutation.target)) continue;
			return true;
		}
		return false;
	};

	H.prototype.observe = function () {
		if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
		this.observer = new MutationObserver((mutations) => {
			if (!this.hasMeaningfulObservedMutation(mutations)) return;
			this.schedule();
		});
		this.observer.observe(document.body, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["class", "style", "hidden", "description"],
			subtree: true
		});
	};

	H.prototype.setReadOnlySummary = function (source, label) {
		label = this.norm(label);
		if (!source || !label || !source.parentElement || this.hasActions(source) || this.isInVisualHeader(source)) return;
		let id = this.ensureSourceID(source);
		let summary = this.findSummaryFor(source.parentElement, id);
		if (!summary) {
			summary = document.createElement("p");
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-for", id);
			source.parentElement.insertBefore(summary, source);
		}
		if (summary.textContent !== label) summary.textContent = label;
		if (summary.hasAttribute("tabindex")) summary.removeAttribute("tabindex");
		if (summary.hasAttribute("aria-label")) summary.removeAttribute("aria-label");
		if (summary.hasAttribute("role")) summary.removeAttribute("role");
		this.suppressVisualTree(source, "summary");
	};

	return H;
});
