define([], function () {

	let AccessibilityMapHelper = function (announcer) {
		this.announcer = announcer;
		this.sectorObserver = null;
		this.announceTimer = null;
		this.lastSectorSummary = "";
		this.init();
	};

	AccessibilityMapHelper.prototype.init = function () {
		if (typeof document === "undefined") return;

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		} else {
			this.setup();
		}
	};

	AccessibilityMapHelper.prototype.setup = function () {
		this.setLabel("select-header-level", "Map level");
		this.setLabel("select-header-mapmode", "Map mode");
		this.setLabel("select-header-mapstyle", "Map style");

		let asciiMap = document.querySelector("#mainmap-container-ascii textarea");
		if (asciiMap && !asciiMap.getAttribute("aria-label")) {
			asciiMap.setAttribute("aria-label", "ASCII level map");
		}

		let mapCanvas = document.getElementById("mainmap");
		if (mapCanvas) {
			mapCanvas.setAttribute("aria-label", "Visual level map. Use the sector navigation controls and sector details for an accessible map view.");
		}

		let details = document.getElementById("mainmap-sector-details");
		if (details) {
			details.setAttribute("role", "region");
			details.setAttribute("aria-label", "Selected sector details");
		}

		this.observeSectorDetails();
	};

	AccessibilityMapHelper.prototype.setLabel = function (id, label) {
		let element = document.getElementById(id);
		if (!element || element.getAttribute("aria-label") || element.getAttribute("aria-labelledby")) return;
		element.setAttribute("aria-label", label);
	};

	AccessibilityMapHelper.prototype.observeSectorDetails = function () {
		if (this.sectorObserver || typeof MutationObserver === "undefined") return;

		let details = document.getElementById("mainmap-sector-details");
		if (!details) return;

		this.sectorObserver = new MutationObserver(() => this.scheduleSectorAnnouncement());
		this.sectorObserver.observe(details, {
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["style", "class"],
			subtree: true,
		});
	};

	AccessibilityMapHelper.prototype.scheduleSectorAnnouncement = function () {
		if (this.announceTimer) window.clearTimeout(this.announceTimer);
		this.announceTimer = window.setTimeout(() => {
			this.announceTimer = null;
			this.announceSectorDetails();
		}, 120);
	};

	AccessibilityMapHelper.prototype.announceSectorDetails = function () {
		let content = document.getElementById("mainmap-sector-details-content");
		if (!content) return;

		let style = window.getComputedStyle ? window.getComputedStyle(content) : null;
		if (style && style.display === "none") return;

		let summary = this.normalize(content.innerText || content.textContent || "");
		if (!summary || summary === this.lastSectorSummary) return;

		this.lastSectorSummary = summary;
		if (this.announcer && this.announcer.announcePolite) {
			this.announcer.announcePolite("Selected sector. " + summary);
		}
	};

	AccessibilityMapHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityMapHelper;
});
