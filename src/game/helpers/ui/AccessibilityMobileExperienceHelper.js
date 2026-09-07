define([], function () {
	let H = function () {
		this.observer = null;
		this.timer = null;
		this.lastMovementMessage = null;
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
		this.fixCallouts();
		this.compactIndicators();
		this.compactStatusCopies();
		this.compactClusters();
		this.compactPairs();
		this.compactReadOnlyRows();
		this.configureMovement();
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
				if (!t.matches("button,input,select,textarea,a[href]") && !t.querySelector("button,input,select,textarea,a[href]")) t.setAttribute("tabindex", "0");
				if (label) t.setAttribute("aria-label", label);
				if (!t.matches("button,input,select,textarea,a[href]")) t.setAttribute("role", "group");
				this.hideChildren(t);
				d.removeAttribute("aria-hidden");
				d.setAttribute("role", "group");
				continue;
			}
			t.removeAttribute("tabindex");
			if (["note", "tooltip", "group"].indexOf(t.getAttribute("role")) >= 0) t.removeAttribute("role");
			if (t.getAttribute("aria-label") === "More information") t.removeAttribute("aria-label");
			this.removeRef(t, "aria-describedby", d.id);
			d.setAttribute("aria-hidden", "true");
			d.removeAttribute("role");
			d.removeAttribute("tabindex");
			let owner = t.closest("li,.stat-indicator,.item-slot,.npc-container");
			if (owner && !this.inStatusList(owner) && !this.hasActions(owner)) {
				let base = this.norm(owner.getAttribute("aria-label")) || this.norm(owner.innerText || owner.textContent);
				this.compact(owner, this.unique(base, label), owner.tagName === "LI" ? "listitem" : "group");
			}
		}
	};

	H.prototype.inStatusList = function (e) {
		return !!(e && e.closest && e.closest("#player-perks-list-mobile,#player-statuses-list-mobile,#player-perks-list-regular,#player-statuses-list-regular"));
	};

	H.prototype.compactIndicators = function () {
		let xs = document.querySelectorAll(".item-comparison-indicator[aria-label]");
		for (let i = 0; i < xs.length; i++) {
			let x = xs[i], label = this.norm(x.getAttribute("aria-label"));
			let owner = x.closest(".info-callout-target,button,[role='button'],.item-slot,.npc-container,li");
			if (owner && label) owner.setAttribute("aria-label", this.unique(this.norm(owner.getAttribute("aria-label")) || this.norm(owner.innerText || owner.textContent), label));
			x.setAttribute("aria-hidden", "true"); x.removeAttribute("role"); x.removeAttribute("tabindex");
		}
	};

	H.prototype.compactStatusCopies = function () {
		let small = document.body.classList.contains("layout-small");
		this.status("player-perks-list-mobile", small);
		this.status("player-statuses-list-mobile", small);
		this.status("player-perks-list-regular", !small);
		this.status("player-statuses-list-regular", !small);
	};

	H.prototype.status = function (id, active) {
		let list = document.getElementById(id);
		if (!list) return;
		if (!active) { this.decompact(list); list.setAttribute("aria-hidden", "true"); return; }
		list.removeAttribute("aria-hidden");
		let items = list.querySelectorAll(":scope > li"), parts = [];
		for (let i = 0; i < items.length; i++) {
			let it = items[i], t = it.querySelector(".info-callout-target"), d = it.querySelector(".info-callout");
			let s = this.norm(it.getAttribute("aria-label")) || (t && this.norm(t.getAttribute("description"))) || this.alt(it) || this.norm(it.innerText || it.textContent);
			if (d) s = this.unique(s, this.norm(d.innerText || d.textContent));
			if (s) parts.push(s);
			this.decompact(it);
			it.removeAttribute("tabindex");
			if (["note", "group", "listitem"].indexOf(it.getAttribute("role")) >= 0) it.removeAttribute("role");
			it.setAttribute("aria-hidden", "true");
		}
		if (parts.length) this.compact(list, "Status effects. " + parts.join(". "), "group", true);
		else this.decompact(list);
	};

	H.prototype.compactClusters = function () {
		let cfg = [
			[".player-stats-container", "Player status", true],
			[".statsbar-tribe-stats", "Tribe stats", false],
			[".container-equipment-stats", "Equipment stats", false],
			[".statsbar-resources", "Camp resources", false],
			[".bag-resources", "Bag resources", false]
		];
		for (let i = 0; i < cfg.length; i++) {
			let els = document.querySelectorAll(cfg[i][0]);
			for (let j = 0; j < els.length; j++) {
				let e = els[j], force = cfg[i][2];
				if (!this.visualVisible(e)) { this.decompact(e); continue; }
				e.removeAttribute("aria-hidden");
				if (!force && this.hasActions(e)) continue;
				let text = this.statTextVisual(e) || this.norm(e.innerText || e.textContent);
				if (text) this.compact(e, cfg[i][1] + ". " + text, "group", force);
			}
		}
	};

	H.prototype.compactPairs = function () {
		let q = ".stat-indicator,.header-camp-storage,.header-bag-storage,.header-camp-currency,.header-bag-currency,.header-camp-reputation,.header-camp-population,[id^='resources-camp-'],[id^='resources-bag-']";
		let els = document.querySelectorAll(q);
		for (let i = 0; i < els.length; i++) {
			let e = els[i];
			if (!this.visualVisible(e) || e.closest("[data-a11y-compact='1']") || this.hasActions(e)) continue;
			let l = e.querySelector(".label"), v = e.querySelector(".value");
			let text = this.unique(this.norm(l && l.textContent), this.norm(v && v.textContent)) || this.norm(e.innerText || e.textContent);
			if (text) this.compact(e, text, "group");
		}
	};

	H.prototype.compactReadOnlyRows = function () {
		let rows = document.querySelectorAll("table tr");
		for (let i = 0; i < rows.length; i++) {
			let r = rows[i];
			if (!this.visualVisible(r) || r.querySelector("th") || this.hasActions(r) || r.closest("[data-a11y-compact='1']")) continue;
			let text = this.norm(r.innerText || r.textContent);
			if (text) this.compact(r, text, "row");
		}
	};

	H.prototype.compact = function (e, label, role, force) {
		if (!e || !label || (!force && this.hasActions(e))) return;
		e.setAttribute("data-a11y-compact", "1");
		e.setAttribute("tabindex", "0");
		e.setAttribute("aria-label", this.norm(label));
		if (role) e.setAttribute("role", role);
		this.hideChildren(e);
	};

	H.prototype.hideChildren = function (e) {
		for (let i = 0; i < e.children.length; i++) {
			let c = e.children[i];
			if (c.matches("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']") || this.hasActions(c)) continue;
			if (c.getAttribute("aria-hidden") !== "true") { c.setAttribute("aria-hidden", "true"); c.setAttribute("data-a11y-hidden", "1"); }
			if (c.getAttribute("tabindex") === "0") c.removeAttribute("tabindex");
		}
	};

	H.prototype.decompact = function (e) {
		if (!e || e.getAttribute("data-a11y-compact") !== "1") return;
		e.removeAttribute("data-a11y-compact"); e.removeAttribute("tabindex"); e.removeAttribute("aria-label");
		if (["group", "row", "listitem"].indexOf(e.getAttribute("role")) >= 0) e.removeAttribute("role");
		let xs = e.querySelectorAll("[data-a11y-hidden='1']");
		for (let i = 0; i < xs.length; i++) { xs[i].removeAttribute("aria-hidden"); xs[i].removeAttribute("data-a11y-hidden"); }
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
	H.prototype.visible = function (e) { if(!this.visualVisible(e))return false;for(let x=e.parentElement;x&&x!==document.documentElement;x=x.parentElement){if(x.getAttribute("aria-hidden")==="true")return false;}return true; };
	H.prototype.anyPopup = function () { let xs=document.querySelectorAll(".popup");for(let i=0;i<xs.length;i++)if(this.visible(xs[i]))return true;return false; };
	H.prototype.observe = function () { if(this.observer||typeof MutationObserver==="undefined"||!document.body)return;this.observer=new MutationObserver(()=>this.schedule());this.observer.observe(document.body,{childList:true,characterData:true,attributes:true,attributeFilter:["class","style","hidden","description","role","aria-label","aria-describedby","aria-valuenow","aria-valuetext"],subtree:true}); };

	return H;
});