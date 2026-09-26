/* Layout frame behaviour (layout redesign, 2026-09-25).
 *
 * 1. The page's action slot (injected by scripts/layout_frame.py) docks
 *    once it scrolls out of view: at the top of the right-hand column on
 *    wide screens, and in a bottom bar on phones, beside a Sections button
 *    that lists the page's headings. Lessons without a slot dock Next.
 * 2. The menu button opens with Enter or Space, and the closed drawer is
 *    taken out of the Tab order (it held 89 invisible Tab stops, AC-2).
 * 3. The search field names what it searches, and the active tab is
 *    scrolled into view in the tab strip.
 * Nothing here is needed to read or use a page; without JavaScript every
 * action is still in the slot at the top and the drawer still works.
 */
(function () {
  "use strict";
  var body = document.body;
  var type = body.getAttribute("data-page-type") || "";
  var phone = window.matchMedia("(max-width: 59.9375em)");
  var wide = window.matchMedia("(min-width: 76.25em)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- search placeholder ------------------------------------------------ */
  var PLACEHOLDER = "Search guides, tools and prompts";
  document.querySelectorAll(".md-search__input").forEach(function (input) {
    input.setAttribute("placeholder", PLACEHOLDER);
    input.setAttribute("aria-label", PLACEHOLDER);
  });

  /* --- active tab into view ----------------------------------------------- */
  var tabList = document.querySelector(".md-tabs__list");
  var activeTab = document.querySelector(".md-tabs__item--active");
  if (tabList && activeTab && tabList.scrollWidth > tabList.clientWidth) {
    tabList.scrollLeft = activeTab.offsetLeft - (tabList.clientWidth - activeTab.clientWidth) / 2;
  }

  /* --- heading permalinks out of the Tab order ----------------------------- */
  document.querySelectorAll(".md-typeset .headerlink").forEach(function (a) {
    a.setAttribute("tabindex", "-1");
  });

  /* --- menu button and drawer ---------------------------------------------- */
  var drawer = document.getElementById("__drawer");
  var menu = document.querySelector('label[for="__drawer"][role="button"]');
  var side = document.querySelector(".md-sidebar--primary");
  function syncDrawer() {
    if (!side || !drawer) return;
    var hidden = !wide.matches && !drawer.checked;
    if ("inert" in side) side.inert = hidden;
    if (menu) menu.setAttribute("aria-expanded", drawer.checked ? "true" : "false");
  }
  if (menu && drawer) {
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        drawer.checked = !drawer.checked;
        drawer.dispatchEvent(new Event("change"));
        syncDrawer();
      }
    });
    drawer.addEventListener("change", syncDrawer);
    wide.addEventListener("change", syncDrawer);
    syncDrawer();
  }

  /* --- docked action, phone bar, Sections sheet ----------------------------- */
  if (["task", "lesson", "reference"].indexOf(type) === -1) return;
  var article = document.querySelector(".md-content__inner");
  if (!article) return;
  var slot = article.querySelector("[data-page-action]");
  var heads = Array.prototype.slice.call(article.querySelectorAll("h2[id]"));

  function label(el) {
    return (el.textContent || "").replace(/¶/g, "").trim();
  }

  // The action to dock: the slot's buttons, or Next on a lesson.
  var actions = [];
  if (slot) {
    slot.querySelectorAll("a.md-button").forEach(function (a) {
      actions.push({ text: label(a), href: a.getAttribute("href"), primary: a.classList.contains("md-button--primary") });
    });
  } else if (type === "lesson") {
    var next = document.querySelector(".md-footer__link--next");
    if (next) {
      var title = next.getAttribute("aria-label") || "Next";
      actions.push({ text: title.replace(/^Next:\s*/, "Next: "), href: next.getAttribute("href"), primary: true });
    }
  }

  function button(a) {
    var el = document.createElement("a");
    el.className = "md-button" + (a.primary ? " md-button--primary" : "");
    el.href = a.href;
    el.textContent = a.text;
    return el;
  }

  // Desktop: dock at the top of the right-hand column.
  var dock = null;
  var sideRight = document.querySelector(".md-sidebar--secondary .md-sidebar__inner");
  if (sideRight && actions.length) {
    dock = document.createElement("div");
    dock.className = "hub-dock";
    dock.hidden = true;
    actions.forEach(function (a) { dock.appendChild(button(a)); });
    sideRight.insertBefore(dock, sideRight.firstChild);
  }

  // Phone: bottom bar with the primary action and Sections (or Top).
  var bar = document.createElement("div");
  bar.className = "hub-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Page actions");
  var primary = actions.filter(function (a) { return a.primary; })[0];
  if (primary) bar.appendChild(button(primary));
  var sheet = null;
  if (heads.length >= 2) {
    sheet = document.createElement("dialog");
    sheet.className = "hub-sheet";
    sheet.setAttribute("aria-label", "Sections on this page");
    var h = document.createElement("h2");
    h.textContent = "On this page";
    sheet.appendChild(h);
    var ul = document.createElement("ul");
    heads.forEach(function (head) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + head.id;
      a.textContent = label(head);
      a.addEventListener("click", function () { sheet.close(); });
      li.appendChild(a);
      ul.appendChild(li);
    });
    var topLi = document.createElement("li");
    var topBtn = document.createElement("button");
    topBtn.type = "button";
    topBtn.textContent = "Back to top";
    topBtn.addEventListener("click", function () {
      sheet.close();
      window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
    });
    topLi.appendChild(topBtn);
    ul.appendChild(topLi);
    sheet.appendChild(ul);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });
    document.body.appendChild(sheet);
    var sections = document.createElement("button");
    sections.type = "button";
    sections.className = "md-button hub-bar__sections";
    sections.textContent = "Sections";
    sections.addEventListener("click", function () {
      if (typeof sheet.showModal === "function") sheet.showModal();
    });
    bar.appendChild(sections);
  } else if (!primary) {
    var top = document.createElement("button");
    top.type = "button";
    top.className = "md-button";
    top.textContent = "Back to top";
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" }); });
    bar.appendChild(top);
  }
  // The bar is for genuinely long pages only (more than three screens):
  // Astra's review (2026-09-25) cautioned against persistent controls
  // where they have not shown a benefit.
  var longPage = document.documentElement.scrollHeight > window.innerHeight * 3;
  if (!bar.children.length || !longPage) bar = null;
  if (bar) {
    document.body.appendChild(bar);
    body.classList.add("hub-has-bar");
  }

  // Show the dock and the bar once the slot (or, without one, the first
  // screen) has scrolled away above the viewport.
  function update() {
    var gone;
    if (slot) {
      var r = slot.getBoundingClientRect();
      gone = r.bottom < 0;
    } else {
      gone = window.scrollY > window.innerHeight * 0.8;
    }
    if (dock) dock.hidden = !(gone && wide.matches);
    if (bar) bar.classList.toggle("is-shown", gone && phone.matches);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
