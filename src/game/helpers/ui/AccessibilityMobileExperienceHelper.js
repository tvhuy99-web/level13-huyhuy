define([], function () {
	let H = function () {
		this.observer = null;
		this.timer = null;
		this.lastMovementMessage = null;
		this.summaryCounter = 0;
		this.init();
	};

	H.prototype.init = function () {
		if (typeof document === "undefined") return;
		if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
		else this.setup();
	};

	H.prototype.setup = function () {
		this.refresh();
		this.observe();
		window.addEventListener("resize", () => this.schedule());
	};

	H.prototype.schedule = function () {
		if (this.timer) clearTimeout(this.timer);
		this.timer = setTimeout(() => { this.timer = null; this.refresh(); }, 100);
	};

	H.prototype.refresh = function () {
		this.migrateOldCompactFocus();
		this.configureLayoutCopies();
		this.fixCallouts();
		this.compactIndicators();
		this.compactStatusCopies();
		this.compactClusters();
		this.compactPairs();
		this.configureMovement();
	};

	// Older accessibility builds made generic DIV/UL elements keyboard-focusable and
	// gave them an aria-label. Real TalkBack can still land on those visual/icon
	// containers without speaking the synthetic name. Remove that model completely.
	H.prototype.migrateOldCompactFocus = function () {
		let old = document.querySelectorAll("[data-a11y-compact='1']");
		for (let i = 0; i < old.length; i++) {
			let e = old[i];
			e.removeAttribute("data-a11y-compact");
			e.removeAttribute("tabindex");
			e.removeAttribute("aria-label");
			if (["group", "row", "listitem"].indexOf(e.getAttribute("role")) >= 0) e.removeAttribute("role");
			let hidden = e.querySelectorAll("[data-a11y-hidden='1']");
			for (let j = 0; j < hidden.length; j++) {
				hidden[j].removeAttribute("aria-hidden");
				hidden[j].removeAttribute("data-a11y-hidden");
			}
		}
	};

	// The game renders a mobile header and desktop header at the same time. CSS alone
	// is not sufficient for TalkBack: the visually unused copy must be inert as well.
	H.prototype.configureLayoutCopies = function () {
		let small = document.body.classList.contains("layout-small");
		this.setLayoutActive(document.getElementById("mobile-header"), small);
		this.setLayoutActive(document.getElementById("header-side"), !small);
		this.setLayoutActive(document.getElementById("grid-main-header"), !small);
	};

	H.prototype.setLayoutActive = function (root, active) {
		if (!root) return;
		if (active) {
			if (root.getAttribute("data-a11y-layout-inactive") === "1") {
				root.removeAttribute("data-a11y-layout-inactive");
				root.removeAttribute("aria-hidden");
				this.setInert(root, false);
				this.restoreTabStops(root, "layout");
			}
			return;
		}
		root.setAttribute("data-a11y-layout-inactive", "1");
		root.setAttribute("aria-hidden", "true");
		this.setInert(root, true);
		this.disableTabStops(root, "layout");
	};

	H.prototype.fixCallouts = function () {
		let containers = document.querySelectorAll(".callout-container");
		for (let i = 0; i < containers.length; i++) {
			let c = containers[i];
			let t = c.querySelector(":scope > .info-callout-target") || c.querySelector(".info-callout-target");
			let d = c.querySelector(".info-callout");
			if (!t || !d) continue;
			let actions = !!d.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']");
			let label = this.unique(this.norm(t.getAttribute("description")) || this.alt(t) || this.norm(t.innerText || t.textContent), this.norm(d.innerText || d.textContent));
			if (actions) {
				t.removeAttribute("aria-hidden");
				if (label && t.matches("button,input,select,textarea,a[href],[role='button']")) t.setAttribute("aria-label", label);
				d.removeAttribute("aria-hidden");
				d.setAttribute("role", "group");
				continue;
			}

			// Information-only callouts must never create a swipe/focus stop by themselves.
			t.removeAttribute("tabindex");
			if (["note", "tooltip", "group", "img"].indexOf(t.getAttribute("role")) >= 0) t.removeAttribute("role");
			if (t.getAttribute("aria-label") === "More information") t.removeAttribute("aria-label");
			this.removeRef(t, "aria-describedby", d.id);
			d.setAttribute("aria-hidden", "true");
			this.setInert(d, true);
			d.removeAttribute("role");
			d.removeAttribute("tabindex");

			let owner = t.closest("li,.stat-indicator,.item-slot,.npc-container");
			if (owner && !this.inStatusList(owner) && !this.isClusterChild(owner) && !this.hasActions(owner) && !this.isInactiveLayout(owner)) {
				let base = this.norm(owner.innerText || owner.textContent) || this.alt(owner);
				this.setReadOnlySummary(owner, this.unique(base, label));
			}
		}
	};

	H.prototype.inStatusList = function (e) {
		return !!(e && e.closest && e.closest("#player-perks-list-mobile,#player-statuses-list-mobile,#player-perks-list-regular,#player-statuses-list-regular"));
	};

	H.prototype.isClusterChild = function (e) {
		return !!(e && e.closest && e.closest(".player-stats-container,.statsbar-tribe-stats,.container-equipment-stats,.statsbar-resources,.bag-resources"));
	};

	H.prototype.compactIndicators = function () {
		let xs = document.querySelectorAll(".item-comparison-indicator[aria-label]");
		for (let i = 0; i < xs.length; i++) {
			let x = xs[i], label = this.norm(x.getAttribute("aria-label"));
			let owner = x.closest("button,[role='button'],.item-slot,.npc-container,li");
			if (owner && label && owner.matches("button,[role='button']")) {
				owner.setAttribute("aria-label", this.unique(this.norm(owner.getAttribute("aria-label")) || this.norm(owner.innerText || owner.textContent), label));
			} else if (owner && label && !this.hasActions(owner) && !this.inStatusList(owner) && !this.isClusterChild(owner) && !this.isInactiveLayout(owner)) {
				this.setReadOnlySummary(owner, this.unique(this.norm(owner.innerText || owner.textContent), label));
			}
			x.setAttribute("aria-hidden", "true");
		x.removeAttribute("role");
		x.removeAttribute("tabindex");
	};
	};

	// Perks and temporary statuses are one meaningful read-only unit. The original
	// icon lists are hidden/inert and a real off-screen paragraph carries the text.
	H.prototype.compactStatusCopies = function () {
		let small = document.body.classList.contains("layout-small");
		this.renderStatusSummary(
			["player-perks-list-mobile", "player-statuses-list-mobile"],
			document.getElementById("mobile-header-status"),
			"status-mobile",
			small
		);
		this.renderStatusSummary(
			["player-perks-list-regular", "player-statuses-list-regular"],
			document.getElementById("header-self-bar"),
			"status-regular",
			!small
		);
	};

	H.prototype.renderStatusSummary = function (ids, parent, key, active) {
		let lists = [], parts = [];
		for (let i = 0; i < ids.length; i++) {
			let list = document.getElementById(ids[i]);
			if (!list) continue;
			lists.push(list);
			let items = list.querySelectorAll(":scope > li");
			for (let j = 0; j < items.length; j++) {
				let it = items[j], t = it.querySelector(".info-callout-target"), d = it.querySelector(".info-callout");
				let s = (t && this.norm(t.getAttribute("description"))) || this.alt(it) || this.norm(it.innerText || it.textContent);
				if (d) s = this.unique(s, this.norm(d.innerText || d.textContent));
				if (s) parts.push(s);
			}
			this.suppressVisualTree(list, "status");
		}

		if (!parent || !active || !parts.length) {
			this.removeGroupSummary(parent, key);
			return;
		}
		this.setGroupSummary(parent, key, "Status effects. " + parts.join(". "), lists[0] || null);
	};

	H.prototype.compactClusters = function () {
		let cfg = [
			[".player-stats-container", "Player status"],
			[".statsbar-tribe-stats", "Tribe stats"],
			[".container-equipment-stats", "Equipment stats"],
			[".statsbar-resources", "Camp resources"],
			[".bag-resources", "Bag resources"]
		];
		for (let i = 0; i < cfg.length; i++) {
			let els = document.querySelectorAll(cfg[i][0]);
			for (let j = 0; j < els.length; j++) {
				let e = els[j];
				if (!this.visualVisible(e) || this.isInactiveLayout(e)) {
					this.clearReadOnlySummary(e);
					continue;
				}
				if (this.hasActions(e)) {
					this.clearReadOnlySummary(e);
					continue;
				}
				let text = this.statTextVisual(e) || this.norm(e.innerText || e.textContent);
				if (text) this.setReadOnlySummary(e, cfg[i][1] + ". " + text);
				else this.clearReadOnlySummary(e);
			}
		}
	};

	H.prototype.compactPairs = function () {
		let q = ".stat-indicator,.header-camp-storage,.header-bag-storage,.header-camp-currency,.header-bag-currency,.header-camp-reputation,.header-camp-population,[id^='resources-camp-'],[id^='resources-bag-']";
		let els = document.querySelectorAll(q);
		for (let i = 0; i < els.length; i++) {
			let e = els[i];
			if (!this.visualVisible(e) || this.isInactiveLayout(e) || this.isUnderSummarySource(e) || this.hasActions(e)) {
				this.clearReadOnlySummary(e);
				continue;
			}
			let l = e.querySelector(".label"), v = e.querySelector(".value"), vt = e.querySelector(".value-total");
			let text = this.unique(this.norm(l && l.textContent), this.norm(v && v.textContent));
			if (vt && this.norm(vt.textContent)) text = this.unique(text, "total " + this.norm(vt.textContent));
			if (!text) text = this.norm(e.innerText || e.textContent);
			if (text) this.setReadOnlySummary(e, text);
			else this.clearReadOnlySummary(e);
		}
	};

	// Replace a visual/icon-only read-only subtree with one real text paragraph in the
	// accessibility tree. The paragraph itself is not tabindex-focusable; TalkBack
	// reaches it as ordinary text, while the visual source is aria-hidden + inert.
	H.prototype.setReadOnlySummary = function (source, label) {
		label = this.norm(label);
		if (!source || !label || !source.parentElement || this.hasActions(source)) return;
		let id = this.ensureSourceID(source);
		let summary = this.findSummaryFor(source.parentElement, id);
		if (!summary) {
			summary = document.createElement("p");
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-for", id);
			source.parentElement.insertBefore(summary, source);
		}
		summary.textContent = label;
		summary.removeAttribute("tabindex");
		summary.removeAttribute("aria-label");
		summary.removeAttribute("role");
		this.suppressVisualTree(source, "summary");
	};

	H.prototype.clearReadOnlySummary = function (source) {
		if (!source) return;
		let id = source.id;
		if (id && source.parentElement) {
			let summary = this.findSummaryFor(source.parentElement, id);
			if (summary && summary.parentElement) summary.parentElement.removeChild(summary);
		}
		this.restoreVisualTree(source, "summary");
	};

	H.prototype.setGroupSummary = function (parent, key, label, before) {
		if (!parent) return;
		let summary = null;
		let xs = parent.querySelectorAll(":scope > [data-a11y-summary-key]");
		for (let i = 0; i < xs.length; i++) if (xs[i].getAttribute("data-a11y-summary-key") === key) summary = xs[i];
		if (!summary) {
			summary = document.createElement("p");
			summary.className = "hide-from-visual-layout accessibility-compact-summary";
			summary.setAttribute("data-a11y-summary", "1");
			summary.setAttribute("data-a11y-summary-key", key);
			parent.insertBefore(summary, before && before.parentElement === parent ? before : parent.firstChild);
		}
		summary.textContent = this.norm(label);
		summary.removeAttribute("tabindex");
		summary.removeAttribute("aria-label");
		summary.removeAttribute("role");
	};

	H.prototype.removeGroupSummary = function (parent, key) {
		if (!parent) return;
		let xs = parent.querySelectorAll(":scope > [data-a11y-summary-key]");
		for (let i = xs.length - 1; i >= 0; i--) {
			if (xs[i].getAttribute("data-a11y-summary-key") === key && xs[i].parentElement) xs[i].parentElement.removeChild(xs[i]);
		}
	};

	H.prototype.findSummaryFor = function (parent, id) {
		if (!parent || !id) return null;
		let xs = parent.querySelectorAll(":scope > [data-a11y-summary-for]");
		for (let i = 0; i < xs.length; i++) if (xs[i].getAttribute("data-a11y-summary-for") === id) return xs[i];
		return null;
	};

	H.prototype.ensureSourceID = function (e) {
		if (e.id) return e.id;
		this.summaryCounter++;
		e.id = "accessibility-summary-source-" + this.summaryCounter;
		return e.id;
	};

	H.prototype.suppressVisualTree = function (e, reason) {
		if (!e) return;
		let marker = "data-a11y-suppressed-" + reason;
		if (e.getAttribute(marker) !== "1") {
			e.setAttribute(marker, "1");
			e.setAttribute("data-a11y-prev-hidden-" + reason, e.hasAttribute("aria-hidden") ? e.getAttribute("aria-hidden") : "__none__");
			e.setAttribute("data-a11y-prev-inert-" + reason, e.hasAttribute("inert") ? "1" : "0");
		}
		e.removeAttribute("tabindex");
		e.setAttribute("aria-hidden", "true");
		this.setInert(e, true);
		this.disableTabStops(e, reason);
	};

	H.prototype.restoreVisualTree = function (e, reason) {
		if (!e) return;
		let marker = "data-a11y-suppressed-" + reason;
		if (e.getAttribute(marker) !== "1") return;
		let oldHidden = e.getAttribute("data-a11y-prev-hidden-" + reason);
		let oldInert = e.getAttribute("data-a11y-prev-inert-" + reason);
		if (oldHidden === "__none__" || oldHidden === null) e.removeAttribute("aria-hidden");
		else e.setAttribute("aria-hidden", oldHidden);
		if (oldInert === "1") this.setInert(e, true);
		else this.setInert(e, false);
		this.restoreTabStops(e, reason);
		e.removeAttribute(marker);
		e.removeAttribute("data-a11y-prev-hidden-" + reason);
		e.removeAttribute("data-a11y-prev-inert-" + reason);
	};

	H.prototype.disableTabStops = function (root, reason) {
		if (!root) return;
		let attr = "data-a11y-tabindex-" + reason;
		let nodes = [];
		if (root.hasAttribute && root.hasAttribute("tabindex")) nodes.push(root);
		let nested = root.querySelectorAll ? root.querySelectorAll("[tabindex]") : [];
		for (let i = 0; i < nested.length; i++) nodes.push(nested[i]);
		for (let i = 0; i < nodes.length; i++) {
			let n = nodes[i];
			if (!n.hasAttribute(attr)) n.setAttribute(attr, n.getAttribute("tabindex") || "");
			n.removeAttribute("tabindex");
		}
	};

	H.prototype.restoreTabStops = function (root, reason) {
		if (!root || !root.querySelectorAll) return;
		let attr = "data-a11y-tabindex-" + reason;
		let nodes = [];
		if (root.hasAttribute(attr)) nodes.push(root);
		let nested = root.querySelectorAll("[" + attr + "]");
		for (let i = 0; i < nested.length; i++) nodes.push(nested[i]);
		for (let i = 0; i < nodes.length; i++) {
			let n = nodes[i], old = n.getAttribute(attr);
			if (old !== null) n.setAttribute("tabindex", old);
			n.removeAttribute(attr);
		}
	};

	H.prototype.setInert = function (e, value) {
		if (!e) return;
		if (value) {
			e.setAttribute("inert", "");
			try { e.inert = true; } catch (err) {}
		} else {
			e.removeAttribute("inert");
			try { e.inert = false; } catch (err) {}
		}
	};

	H.prototype.isInactiveLayout = function (e) {
		return !!(e && e.closest && e.closest("[data-a11y-layout-inactive='1']"));
	};

	H.prototype.isUnderSummarySource = function (e) {
		if (!e || !e.parentElement) return false;
		let p = e.parentElement;
		while (p && p !== document.documentElement) {
			if (p.getAttribute("data-a11y-suppressed-summary") === "1") return true;
			p = p.parentElement;
		}
		return false;
	};

	H.prototype.statTextVisual = function (e) {
		let xs = e.querySelectorAll(".stat-indicator"), parts = [];
		for (let i = 0; i < xs.length; i++) {
			if (!this.visualVisible(xs[i])) continue;
			let l = xs[i].querySelector(".label"), v = xs[i].querySelector(".value");
			let name = this.norm(l && l.textContent) || this.alt(xs[i]);
			let s = this.unique(name, this.norm(v && v.textContent));
			if (s) parts.push(s);
		}
		return parts.join(". ");
	};

	H.prototype.configureMovement = function () {
		let dirs = { nw:"northwest", north:"north", ne:"northeast", west:"west", east:"east", sw:"southwest", south:"south", se:"southeast" };
		for (let k in dirs) {
			let b = document.getElementById("out-action-move-" + k), g = document.getElementById("out-action-move-" + k + "-grit");
			if (b) b.setAttribute("aria-label", "Move " + dirs[k]);
			if (g) g.setAttribute("aria-label", "Move " + dirs[k] + " using emergency movement");
		}
		let compass = document.getElementById("out-container-compass-actions");
		if (compass) { compass.setAttribute("role", "group"); compass.setAttribute("aria-label", "Movement and travel actions"); }
		let region = this.movementRegion(); if (!region) return;
		let popup = this.anyPopup(), up = this.visible(document.getElementById("out-action-get-up")), scout = this.visible(document.getElementById("out-action-scout")), move = this.visible(compass);
		let msg = popup ? "Movement is not available during the introduction. Continue or close the current dialogue first." : up ? "Movement is not available yet. Choose Get up." : (!move && scout) ? "Movement is not available until this sector is scouted. Choose Scout." : !move ? "Movement controls are not unlocked yet. Complete the available exploration action to continue." : "Movement is available. Choose a direction: north, northeast, east, southeast, south, southwest, west, or northwest.";
		if (msg !== this.lastMovementMessage) { this.lastMovementMessage = msg; region.textContent = msg; }
	};

	H.prototype.movementRegion = function () {
		let r = document.getElementById("accessibility-movement-status"); if (r) return r;
		let h = document.getElementById("container-tab-two-out") || document.body; if (!h) return null;
		r = document.createElement("p"); r.id = "accessibility-movement-status"; r.className = "hide-from-visual-layout"; r.setAttribute("role", "status"); r.setAttribute("aria-live", "polite"); r.setAttribute("aria-atomic", "true"); h.insertBefore(r, h.firstChild); return r;
	};

	H.prototype.hasActions = function (e) { return !!(e && e.querySelector && e.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option'],[contenteditable='true']")); };
	H.prototype.alt = function (e) { let x = e && e.querySelector ? e.querySelector("img[alt]") : null; return x ? this.norm(x.getAttribute("alt")) : ""; };
	H.prototype.norm = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };
	H.prototype.unique = function (a, b) { a=this.norm(a); b=this.norm(b); if(!a)return b;if(!b)return a;let x=a.toLowerCase(),y=b.toLowerCase();if(x===y||x.indexOf(y)>=0)return a;if(y.indexOf(x)>=0)return b;return a+". "+b; };
	H.prototype.removeRef = function (e, a, id) { if(!e||!id)return;let xs=(e.getAttribute(a)||"").split(/\s+/).filter(Boolean).filter(x=>x!==id);if(xs.length)e.setAttribute(a,xs.join(" "));else e.removeAttribute(a); };
	H.prototype.visualVisible = function (e) { if(!e||!e.isConnected)return false;for(let x=e;x&&x!==document.documentElement;x=x.parentElement){let s=getComputedStyle(x);if(s.display==="none"||s.visibility==="hidden"||x.hidden)return false;}return true; };
	H.prototype.visible = function (e) { if(!this.visualVisible(e))return false;for(let x=e;x&&x!==document.documentElement;x=x.parentElement){if(x.getAttribute("aria-hidden")==="true"||x.hasAttribute("inert"))return false;}return true; };
	H.prototype.anyPopup = function () { let xs=document.querySelectorAll(".popup");for(let i=0;i<xs.length;i++)if(this.visible(xs[i]))return true;return false; };
	H.prototype.observe = function () { if(this.observer||typeof MutationObserver==="undefined"||!document.body)return;this.observer=new MutationObserver(()=>this.schedule());this.observer.observe(document.body,{childList:true,characterData:true,attributes:true,attributeFilter:["class","style","hidden","description","role","aria-label","aria-describedby","aria-valuenow","aria-valuetext"],subtree:true}); };

	return H;
});