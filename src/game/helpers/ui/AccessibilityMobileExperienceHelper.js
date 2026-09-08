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
this.timer = setTimeout(() => {
this.timer = null;
this.refresh();
}, 100);
};
H.prototype.refresh = function () {
this.migrateOldCompactFocus();
this.suppressVisualHeaders();
this.renderHeaderOverview();
this.fixCallouts();
this.compactIndicators();
this.compactClusters();
this.compactPairs();
this.configureMovement();
};
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
H.prototype.suppressVisualHeaders = function () {
this.suppressHeader(document.getElementById("mobile-header"));
this.suppressHeader(document.getElementById("header-side"));
this.suppressHeader(document.getElementById("grid-main-header"));
};
H.prototype.suppressHeader = function (root) {
if (!root) return;
root.setAttribute("data-a11y-header-visual", "1");
root.setAttribute("aria-hidden", "true");
root.removeAttribute("tabindex");
this.setInert(root, true);
this.disableTabStops(root, "header");
};
H.prototype.renderHeaderOverview = function () {
let host = document.getElementById("unit-main") || document.body;
if (!host) return;
let summary = document.getElementById("accessibility-player-overview");
if (!summary) {
summary = document.createElement("p");
summary.id = "accessibility-player-overview";
summary.className = "hide-from-visual-layout accessibility-compact-summary";
summary.setAttribute("data-a11y-summary", "1");
summary.setAttribute("data-a11y-summary-key", "player-overview");
host.insertBefore(summary, host.firstChild);
}
let inventorySummary = document.getElementById("accessibility-inventory-camp-overview");
if (!inventorySummary) {
inventorySummary = document.createElement("p");
inventorySummary.id = "accessibility-inventory-camp-overview";
inventorySummary.className = "hide-from-visual-layout accessibility-compact-summary";
inventorySummary.setAttribute("data-a11y-summary", "1");
inventorySummary.setAttribute("data-a11y-summary-key", "inventory-camp-overview");
if (summary.nextSibling) host.insertBefore(inventorySummary, summary.nextSibling);
else host.appendChild(inventorySummary);
}
let playerParts = [];
let player = this.firstStatText(".player-stats-container");
if (player) playerParts.push("Trạng thái người chơi. " + player);
let statuses = this.statusText();
if (statuses) playerParts.push("Hiệu ứng trạng thái. " + statuses);
let equipment = this.firstText(".container-equipment-stats");
if (equipment) playerParts.push("Chỉ số trang bị. " + equipment);
let inventoryParts = [];
let bag = this.inventoryText();
if (bag) inventoryParts.push("Túi đồ. " + bag);
let tribe = this.firstStatText(".statsbar-tribe-stats");
if (tribe) inventoryParts.push("Chỉ số bộ lạc. " + tribe);
let camp = this.campText();
if (camp) inventoryParts.push("Trại. " + camp);
summary.textContent = "Tổng quan người chơi. " + (playerParts.length ? playerParts.join(". ") : "Chưa có thông tin trạng thái người chơi.");
inventorySummary.textContent = "Tổng quan túi đồ và trại. " + (inventoryParts.length ? inventoryParts.join(". ") : "Chưa có thông tin về túi đồ hoặc trại.");
let summaries = [summary, inventorySummary];
for (let i = 0; i < summaries.length; i++) {
summaries[i].removeAttribute("tabindex");
summaries[i].removeAttribute("aria-label");
summaries[i].removeAttribute("role");
summaries[i].removeAttribute("aria-hidden");
}
};
H.prototype.statusText = function () {
let ids = [
"player-perks-list-mobile", "player-statuses-list-mobile",
"player-perks-list-regular", "player-statuses-list-regular"
];
let parts = [];
let seen = {};
for (let i = 0; i < ids.length; i++) {
let list = document.getElementById(ids[i]);
if (!list) continue;
let items = list.querySelectorAll(":scope > li");
for (let j = 0; j < items.length; j++) {
let it = items[j];
let target = it.querySelector(".info-callout-target");
let detail = it.querySelector(".info-callout");
let s = (target && this.norm(target.getAttribute("description"))) || this.alt(it) || this.norm(it.innerText || it.textContent);
if (detail) s = this.unique(s, this.norm(detail.innerText || detail.textContent));
let key = s.toLowerCase();
if (s && !seen[key]) {
seen[key] = true;
parts.push(s);
}
}
}
return parts.join(". ");
};
H.prototype.inventoryText = function () {
let parts = [];
let storage = this.firstPairText(["header-bag-storage-mobile", "header-bag-storage-regular"]);
if (storage) parts.push(storage);
let currency = this.firstPairText(["header-bag-currency-mobile", "header-bag-currency-regular"]);
if (currency) parts.push(currency);
let resources = this.firstText(".bag-resources");
if (resources) parts.push(resources);
return this.dedupeParts(parts).join(". ");
};
H.prototype.campText = function () {
let parts = [];
let storage = this.firstPairText(["header-camp-storage-mobile", "header-camp-storage-regular"]);
let reputation = this.firstPairText(["header-camp-reputation-mobile", "header-camp-reputation-regular"]);
let population = this.firstPairText(["header-camp-population-mobile", "header-camp-population-regular"]);
let currency = this.firstPairText(["header-camp-currency-mobile", "header-camp-currency-regular"]);
let resources = this.firstText(".statsbar-resources");
if (storage) parts.push(storage);
if (reputation) parts.push(reputation);
if (population) parts.push(population);
if (currency) parts.push(currency);
if (resources) parts.push(resources);
return this.dedupeParts(parts).join(". ");
};
H.prototype.firstPairText = function (ids) {
for (let i = 0; i < ids.length; i++) {
let e = document.getElementById(ids[i]);
if (!e) continue;
let l = e.querySelector(".label");
let v = e.querySelector(".value");
let vt = e.querySelector(".value-total");
let text = this.unique(this.norm(l && l.textContent), this.norm(v && v.textContent));
if (vt && this.norm(vt.textContent)) text = this.unique(text, "tổng " + this.norm(vt.textContent));
if (!text) text = this.norm(e.innerText || e.textContent);
if (text) return text;
}
return "";
};
H.prototype.firstStatText = function (selector) {
let xs = document.querySelectorAll(selector);
for (let i = 0; i < xs.length; i++) {
let text = this.statTextAny(xs[i]);
if (text) return text;
}
return "";
};
H.prototype.firstText = function (selector) {
let xs = document.querySelectorAll(selector);
for (let i = 0; i < xs.length; i++) {
let text = this.norm(xs[i].innerText || xs[i].textContent);
if (text) return text;
}
return "";
};
H.prototype.dedupeParts = function (parts) {
let out = [], seen = {};
for (let i = 0; i < parts.length; i++) {
let p = this.norm(parts[i]);
let key = p.toLowerCase();
if (p && !seen[key]) {
seen[key] = true;
out.push(p);
}
}
return out;
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
if (!this.isInVisualHeader(t)) {
t.removeAttribute("aria-hidden");
if (label && t.matches("button,input,select,textarea,a[href],[role='button']")) t.setAttribute("aria-label", label);
d.removeAttribute("aria-hidden");
this.setInert(d, false);
d.setAttribute("role", "group");
}
continue;
}
t.removeAttribute("tabindex");
t.removeAttribute("aria-label");
if (["note", "tooltip", "group", "img"].indexOf(t.getAttribute("role")) >= 0) t.removeAttribute("role");
this.removeRef(t, "aria-describedby", d.id);
d.setAttribute("aria-hidden", "true");
this.setInert(d, true);
d.removeAttribute("role");
d.removeAttribute("tabindex");
if (this.isInVisualHeader(t)) continue;
let owner = t.closest("li,.stat-indicator,.item-slot,.npc-container");
if (owner && !this.hasActions(owner) && !this.isUnderSummarySource(owner)) {
let base = this.norm(owner.innerText || owner.textContent) || this.alt(owner);
this.setReadOnlySummary(owner, this.unique(base, label));
}
}
};
H.prototype.compactIndicators = function () {
let xs = document.querySelectorAll(".item-comparison-indicator[aria-label]");
for (let i = 0; i < xs.length; i++) {
let x = xs[i];
let label = this.norm(x.getAttribute("aria-label"));
let owner = x.closest("button,[role='button'],.item-slot,.npc-container,li");
if (owner && label && owner.matches("button,[role='button']")) {
owner.setAttribute("aria-label", this.unique(this.norm(owner.getAttribute("aria-label")) || this.norm(owner.innerText || owner.textContent), label));
} else if (owner && label && !this.hasActions(owner) && !this.isInVisualHeader(owner) && !this.isUnderSummarySource(owner)) {
this.setReadOnlySummary(owner, this.unique(this.norm(owner.innerText || owner.textContent), label));
}
x.setAttribute("aria-hidden", "true");
x.removeAttribute("role");
x.removeAttribute("tabindex");
}
};
H.prototype.compactClusters = function () {
let cfg = [
[".container-equipment-stats", "Chỉ số trang bị"],
[".statsbar-resources", "Tài nguyên trong trại"],
[".bag-resources", "Tài nguyên trong túi"]
];
for (let i = 0; i < cfg.length; i++) {
let els = document.querySelectorAll(cfg[i][0]);
for (let j = 0; j < els.length; j++) {
let e = els[j];
if (this.isInVisualHeader(e)) {
this.clearReadOnlySummary(e);
continue;
}
if (!this.visualVisible(e) || this.hasActions(e)) {
this.clearReadOnlySummary(e);
continue;
}
let text = this.statTextAny(e) || this.norm(e.innerText || e.textContent);
if (text) this.setReadOnlySummary(e, cfg[i][1] + ". " + text);
else this.clearReadOnlySummary(e);
}
}
};
H.prototype.compactPairs = function () {
let q = ".stat-indicator,[id^='resources-camp-'],[id^='resources-bag-']";
let els = document.querySelectorAll(q);
for (let i = 0; i < els.length; i++) {
let e = els[i];
if (this.isInVisualHeader(e) || !this.visualVisible(e) || this.isUnderSummarySource(e) || this.hasActions(e)) {
this.clearReadOnlySummary(e);
continue;
}
let l = e.querySelector(".label");
let v = e.querySelector(".value");
let vt = e.querySelector(".value-total");
let text = this.unique(this.norm(l && l.textContent), this.norm(v && v.textContent));
if (vt && this.norm(vt.textContent)) text = this.unique(text, "tổng " + this.norm(vt.textContent));
if (!text) text = this.norm(e.innerText || e.textContent);
if (text) this.setReadOnlySummary(e, text);
else this.clearReadOnlySummary(e);
}
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
this.setInert(e, oldInert === "1");
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
if (root.hasAttribute && root.hasAttribute(attr)) nodes.push(root);
let nested = root.querySelectorAll("[" + attr + "]");
for (let i = 0; i < nested.length; i++) nodes.push(nested[i]);
for (let i = 0; i < nodes.length; i++) {
let n = nodes[i];
let old = n.getAttribute(attr);
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
H.prototype.isInVisualHeader = function (e) {
return !!(e && e.closest && e.closest("#mobile-header,#header-side,#grid-main-header"));
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
H.prototype.statTextAny = function (e) {
if (!e) return "";
let xs = e.querySelectorAll(".stat-indicator");
let parts = [];
if (xs.length === 0 && e.classList && e.classList.contains("stat-indicator")) xs = [e];
for (let i = 0; i < xs.length; i++) {
let l = xs[i].querySelector(".label");
let v = xs[i].querySelector(".value");
let name = this.norm(l && l.textContent) || this.alt(xs[i]);
let s = this.unique(name, this.norm(v && v.textContent));
if (s) parts.push(s);
}
if (parts.length) return this.dedupeParts(parts).join(". ");
return this.norm(e.innerText || e.textContent);
};
H.prototype.configureMovement = function () {
let dirs = { nw:"tây bắc", north:"bắc", ne:"đông bắc", west:"tây", east:"đông", sw:"tây nam", south:"nam", se:"đông nam" };
for (let k in dirs) {
let b = document.getElementById("out-action-move-" + k);
let g = document.getElementById("out-action-move-" + k + "-grit");
if (b) b.setAttribute("aria-label", "Di chuyển " + dirs[k]);
if (g) g.setAttribute("aria-label", "Di chuyển " + dirs[k] + " bằng lối khẩn cấp");
}
let compass = document.getElementById("out-container-compass-actions");
if (compass) {
compass.setAttribute("role", "group");
compass.setAttribute("aria-label", "Hành động di chuyển và hành trình");
}
let region = this.movementRegion();
if (!region) return;
let popup = this.anyPopup();
let up = this.visible(document.getElementById("out-action-get-up"));
let scout = this.visible(document.getElementById("out-action-scout"));
let move = this.visible(compass);
let msg = popup ? "Không thể di chuyển trong phần mở đầu. Hãy tiếp tục hoặc đóng hội thoại hiện tại trước." : up ? "Chưa thể di chuyển. Hãy chọn Đứng dậy." : (!move && scout) ? "Chưa thể di chuyển cho đến khi thám sát khu vực này. Hãy chọn Thám sát." : !move ? "Các nút di chuyển chưa được mở khóa. Hãy hoàn thành hành động thám hiểm khả dụng để tiếp tục." : "Có thể di chuyển. Hãy chọn một hướng: bắc, đông bắc, đông, đông nam, nam, tây nam, tây hoặc tây bắc.";
if (msg !== this.lastMovementMessage) {
this.lastMovementMessage = msg;
region.textContent = msg;
}
};
H.prototype.movementRegion = function () {
let r = document.getElementById("accessibility-movement-status");
if (r) return r;
let h = document.getElementById("container-tab-two-out") || document.body;
if (!h) return null;
r = document.createElement("p");
r.id = "accessibility-movement-status";
r.className = "hide-from-visual-layout";
r.setAttribute("role", "status");
r.setAttribute("aria-live", "polite");
r.setAttribute("aria-atomic", "true");
h.insertBefore(r, h.firstChild);
return r;
};
H.prototype.hasActions = function (e) {
return !!(e && e.querySelector && e.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option'],[contenteditable='true']"));
};
H.prototype.alt = function (e) {
let x = e && e.querySelector ? e.querySelector("img[alt]") : null;
return x ? this.norm(x.getAttribute("alt")) : "";
};
H.prototype.norm = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };
H.prototype.unique = function (a, b) {
a = this.norm(a); b = this.norm(b);
if (!a) return b;
if (!b) return a;
let x = a.toLowerCase(), y = b.toLowerCase();
if (x === y || x.indexOf(y) >= 0) return a;
if (y.indexOf(x) >= 0) return b;
return a + ". " + b;
};
H.prototype.removeRef = function (e, a, id) {
if (!e || !id) return;
let xs = (e.getAttribute(a) || "").split(/\s+/).filter(Boolean).filter(x => x !== id);
if (xs.length) e.setAttribute(a, xs.join(" "));
else e.removeAttribute(a);
};
H.prototype.visualVisible = function (e) {
if (!e || !e.isConnected) return false;
for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
let s = getComputedStyle(x);
if (s.display === "none" || s.visibility === "hidden" || x.hidden) return false;
}
return true;
};
H.prototype.visible = function (e) {
if (!this.visualVisible(e)) return false;
for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
if (x.getAttribute("aria-hidden") === "true" || x.hasAttribute("inert")) return false;
}
return true;
};
H.prototype.anyPopup = function () {
let xs = document.querySelectorAll(".popup");
for (let i = 0; i < xs.length; i++) if (this.visible(xs[i])) return true;
return false;
};
H.prototype.observe = function () {
if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;
this.observer = new MutationObserver(() => this.schedule());
this.observer.observe(document.body, {
childList: true,
characterData: true,
attributes: true,
attributeFilter: ["class", "style", "hidden", "description", "role", "aria-label", "aria-describedby", "aria-valuenow", "aria-valuetext"],
subtree: true
});
};
return H;
});
