define([], function () {

	let AccessibilityMapHelper = function (announcer) {
		this.announcer = announcer;
		this.sectorObserver = null;
		this.overlayObserver = null;
		this.levelObserver = null;
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
		this.setLabel("select-header-level", "Tầng bản đồ");
		this.setLabel("select-header-mapmode", "Chế độ bản đồ");
		this.setLabel("select-header-mapstyle", "Kiểu bản đồ");

		let asciiMap = document.querySelector("#mainmap-container-ascii textarea");
		if (asciiMap && !asciiMap.getAttribute("aria-label")) {
			asciiMap.setAttribute("aria-label", "Bản đồ tầng dạng ASCII");
		}

		let mapCanvas = document.getElementById("mainmap");
		if (mapCanvas) {
			mapCanvas.setAttribute("aria-label", "Bản đồ tầng trực quan. Dùng các nút khu vực hoặc bản đồ ASCII để xem bản đồ dễ tiếp cận hơn.");
		}

		let background = document.getElementById("minimap-background");
		if (background) background.setAttribute("aria-hidden", "true");

		let details = document.getElementById("mainmap-sector-details");
		if (details) {
			details.setAttribute("role", "region");
			details.setAttribute("aria-label", "Chi tiết khu vực đã chọn");
		}

		this.configureLevelOptions();
		this.observeLevelOptions();
		this.configureOverlayCells(document);
		this.observeOverlayCells();
		this.observeSectorDetails();
	};

	AccessibilityMapHelper.prototype.setLabel = function (id, label) {
		let element = document.getElementById(id);
		if (!element || element.getAttribute("aria-label") || element.getAttribute("aria-labelledby")) return;
		element.setAttribute("aria-label", label);
	};

	AccessibilityMapHelper.prototype.configureLevelOptions = function () {
		let select = document.getElementById("select-header-level");
		if (!select) return;
		let options = select.querySelectorAll("option");
		for (let i = 0; i < options.length; i++) {
			let option = options[i];
			let text = this.normalize(option.textContent);
			if (!text) continue;
			let state = "";
			if (/\(!\)\s*$/.test(text)) state = "có thay đổi mới";
			else if (/\(x\)\s*$/i.test(text)) state = "đã dọn sạch";
			else if (/\(-\)\s*$/.test(text)) state = "chưa dọn sạch";
			let base = text.replace(/\s*\((?:!|x|-)\)\s*$/i, "").trim();
			option.setAttribute("aria-label", state ? base + ", " + state : base);
		}

		let bubble = document.getElementById("select-map-level-bubble");
		if (bubble) {
			bubble.setAttribute("aria-hidden", "true");
			let count = parseInt(this.normalize(bubble.textContent), 10);
			let baseLabel = "Tầng bản đồ";
			if (isFinite(count) && count > 0) {
				baseLabel += ", " + count + (count === 1 ? " tầng có thay đổi mới" : " tầng có thay đổi mới");
			}
			select.setAttribute("aria-label", baseLabel);
		}
	};

	AccessibilityMapHelper.prototype.observeLevelOptions = function () {
		if (this.levelObserver || typeof MutationObserver === "undefined") return;
		let select = document.getElementById("select-header-level");
		let bubble = document.getElementById("select-map-level-bubble");
		if (!select) return;
		this.levelObserver = new MutationObserver(() => this.configureLevelOptions());
		this.levelObserver.observe(select, { childList: true, characterData: true, subtree: true });
		if (bubble) this.levelObserver.observe(bubble, { childList: true, characterData: true, subtree: true });
	};

	AccessibilityMapHelper.prototype.configureOverlayCells = function (root) {
		if (!root) return;
		let cells = [];
		if (root.matches && root.matches(".map-overlay-cell")) cells.push(root);
		if (root.querySelectorAll) {
			let nested = root.querySelectorAll(".map-overlay-cell");
			for (let i = 0; i < nested.length; i++) cells.push(nested[i]);
		}

		for (let i = 0; i < cells.length; i++) this.configureOverlayCell(cells[i]);
	};

	AccessibilityMapHelper.prototype.configureOverlayCell = function (cell) {
		if (!cell) return;
		let level = cell.getAttribute("data-level");
		let x = cell.getAttribute("data-x");
		let y = cell.getAttribute("data-y");
		cell.setAttribute("role", "button");
		if (!cell.hasAttribute("tabindex")) cell.setAttribute("tabindex", "0");
		cell.setAttribute("aria-label", "Khu vực ở tầng " + level + ", x " + x + ", y " + y);
		cell.setAttribute("aria-pressed", cell.classList.contains("selected") ? "true" : "false");

		if (cell.getAttribute("data-accessibility-key-bound") !== "true") {
			cell.setAttribute("data-accessibility-key-bound", "true");
			cell.addEventListener("keydown", function (event) {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				cell.click();
			});
		}
	};

	AccessibilityMapHelper.prototype.observeOverlayCells = function () {
		if (this.overlayObserver || typeof MutationObserver === "undefined") return;
		let overlay = document.getElementById("mainmap-overlay");
		if (!overlay) return;
		this.overlayObserver = new MutationObserver((mutations) => {
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				if (mutation.type === "childList") {
					for (let j = 0; j < mutation.addedNodes.length; j++) {
						let node = mutation.addedNodes[j];
						if (node.nodeType === 1) this.configureOverlayCells(node);
					}
				} else if (mutation.type === "attributes") {
					this.configureOverlayCell(mutation.target);
				}
			}
		});
		this.overlayObserver.observe(overlay, {
			childList: true,
			attributes: true,
			attributeFilter: ["class"],
			subtree: true,
		});
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
			this.announcer.announcePolite("Đã chọn khu vực. " + summary);
		}
	};

	AccessibilityMapHelper.prototype.normalize = function (text) {
		return String(text || "").replace(/\s+/g, " ").trim();
	};

	return AccessibilityMapHelper;
});
