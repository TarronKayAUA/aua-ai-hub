/* The section navigator (navigation design d2, 2026-09-26).
 *
 * One floating element replaces both sidebars. It is built from the section
 * foot that scripts/layout_nav.py writes at the end of every inner page, so
 * the floating map and the foot's map are the same HTML and cannot disagree:
 *
 *   [icon  Tools & Prompts / Page 11 of 16  ticks ^] [On this page ^] [Action]
 *
 * 1. The section button opens the section as a map: groups of cards with
 *    icons, the current page marked, every sibling one click away.
 * 2. "On this page" opens the page's headings as chips, and names the
 *    heading you are reading.
 * 3. The page's primary action (the slot under the title, or a lesson's
 *    Next) docks at the end of the pill once the original scrolls away.
 *
 * Both buttons are disclosures (aria-expanded, aria-controls). Escape or a
 * click outside closes a panel, and Escape returns focus to its button.
 * Nothing here is needed to use a page: without JavaScript the foot's map,
 * the previous and next cards, the tabs and the breadcrumb are all links.
 */
(function () {
  "use strict";
  var foot = document.querySelector("[data-secfoot]");
  var article = document.querySelector(".md-content__inner");
  if (!foot || !article) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var SVG = {
    chevron: "M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z",
    list: "M3 4h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zm-4 7h2v2H3zm4 0h14v2H7z",
    close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    up: "M13 20h-2V8l-5.5 5.5-1.42-1.42L12 4.16l7.92 7.92-1.42 1.42L13 8z"
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' +
      SVG[name] + '"/></svg>';
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  function text(node) {
    return (node.textContent || "").replace(/¶/g, "").replace(/\s+/g, " ").trim();
  }

  var section = foot.getAttribute("data-section") || "";
  var pos = foot.getAttribute("data-pos") || "";
  var total = foot.getAttribute("data-total") || "";
  var group = foot.getAttribute("data-group") || "";
  var where = pos ? "Page " + pos + " of " + total : "In " + group;

  var nav = el("nav", "secnav");
  nav.setAttribute("aria-label", "Section navigator");
  var bar = el("div", "secnav__bar");
  nav.appendChild(bar);
  var veil = el("div", "secnav__veil");
  veil.hidden = true;

  /* --- 1. the section button and its map ---------------------------------- */
  var mapBtn = el("button", "secnav__btn secnav__btn--map");
  mapBtn.type = "button";
  mapBtn.setAttribute("aria-expanded", "false");
  mapBtn.setAttribute("aria-controls", "secnav-map");
  var sicon = foot.querySelector(".secfoot__sicon");
  var track = foot.querySelector(".sectrack");
  mapBtn.innerHTML =
    '<span class="secnav__icon">' + (sicon ? sicon.innerHTML : "") + "</span>" +
    // A space between the spans: without it a screen reader (and any
    // reader of the text) hears "Tools & PromptsPage 11 of 16".
    '<span class="secnav__label"><span class="secnav__section"></span> ' +
    '<span class="secnav__pos"></span></span>' +
    (track ? track.outerHTML : "") + icon("chevron", "secnav__chev");
  mapBtn.querySelector(".secnav__section").textContent = section;
  mapBtn.querySelector(".secnav__pos").textContent = where;
  mapBtn.title = "Every page in " + section;
  bar.appendChild(mapBtn);

  var mapPanel = el("div", "secnav__panel secnav__panel--map");
  mapPanel.id = "secnav-map";
  mapPanel.hidden = true;
  mapPanel.tabIndex = -1;
  mapPanel.setAttribute("role", "region");
  mapPanel.setAttribute("aria-label", "Pages in " + section);
  var head = el("div", "secnav__phead");
  head.innerHTML =
    '<span class="secnav__picon">' + (sicon ? sicon.innerHTML : "") + "</span>" +
    '<span class="secnav__ptext"><span class="secnav__ptitle"></span> ' +
    '<span class="secnav__pmeta"></span></span>';
  head.querySelector(".secnav__ptitle").textContent = section;
  var groups = foot.querySelectorAll(".secmap__group").length;
  head.querySelector(".secnav__pmeta").textContent =
    total + " pages in " + groups + (groups === 1 ? " group" : " groups") +
    (pos ? ", you are on page " + pos : ", you are in " + group);
  var overview = foot.querySelector(".secfoot__overview");
  if (overview) {
    var ov = overview.cloneNode(true);
    ov.className = "secnav__overview";
    head.appendChild(ov);
  }
  var closeBtn = el("button", "secnav__close", icon("close"));
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close the section map");
  head.appendChild(closeBtn);
  mapPanel.appendChild(head);
  var map = foot.querySelector("[data-secmap]");
  if (map) mapPanel.appendChild(map.cloneNode(true));

  /* --- 2. On this page ----------------------------------------------------- */
  var heads = Array.prototype.slice.call(article.querySelectorAll("h2[id]")).filter(function (h) {
    return !h.closest(".secfoot") && h.offsetParent !== null && text(h);
  });
  var tocBtn = null, tocPanel = null, chips = [];
  if (heads.length >= 2) {
    tocBtn = el("button", "secnav__btn secnav__btn--toc");
    tocBtn.type = "button";
    tocBtn.setAttribute("aria-expanded", "false");
    tocBtn.setAttribute("aria-controls", "secnav-toc");
    tocBtn.innerHTML = '<span class="secnav__tocicon">' + icon("list") + "</span>" +
      '<span class="secnav__label"><span class="secnav__section">On this page</span> ' +
      '<span class="secnav__pos secnav__now"></span></span>' + icon("chevron", "secnav__chev");
    bar.appendChild(tocBtn);

    tocPanel = el("div", "secnav__panel secnav__panel--toc");
    tocPanel.id = "secnav-toc";
    tocPanel.hidden = true;
    tocPanel.tabIndex = -1;
    tocPanel.setAttribute("role", "region");
    tocPanel.setAttribute("aria-label", "On this page");
    var th = el("div", "secnav__phead");
    th.innerHTML = '<span class="secnav__ptext"><span class="secnav__ptitle">On this page</span> ' +
      '<span class="secnav__pmeta"></span></span>';
    th.querySelector(".secnav__pmeta").textContent = heads.length + " sections";
    var tclose = el("button", "secnav__close", icon("close"));
    tclose.type = "button";
    tclose.setAttribute("aria-label", "Close On this page");
    th.appendChild(tclose);
    tocPanel.appendChild(th);
    var list = el("ol", "secnav__chips");
    heads.forEach(function (h, i) {
      var li = el("li");
      var a = el("a", "secnav__chip");
      a.href = "#" + h.id;
      a.innerHTML = '<span class="secnav__chipn">' + (i + 1) + "</span>";
      a.appendChild(document.createTextNode(" " + text(h)));
      a.addEventListener("click", function () { closeAll(false); });
      li.appendChild(a);
      list.appendChild(li);
      chips.push(a);
    });
    var topLi = el("li");
    var top = el("button", "secnav__chip secnav__chip--top", icon("up") + "Back to top");
    top.type = "button";
    top.addEventListener("click", function () {
      closeAll(false);
      window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
    });
    topLi.appendChild(top);
    list.appendChild(topLi);
    tocPanel.appendChild(list);
  }

  /* --- 3. the docked action -------------------------------------------------- */
  var slot = article.querySelector("[data-page-action]");
  var source = slot ? slot.querySelector("a.md-button--primary") : null;
  var dockLabel = source ? text(source) : "";
  if (!source && document.body.getAttribute("data-page-type") === "lesson") {
    source = foot.querySelector(".secfoot__card--next");
    if (source) dockLabel = "Next: " + text(source.querySelector(".secfoot__title"));
  }
  var dock = null;
  if (source) {
    dock = el("a", "secnav__action");
    dock.href = source.getAttribute("href");
    dock.textContent = dockLabel;
    dock.title = dockLabel;
    dock.hidden = true;
    bar.appendChild(dock);
  }

  var main = document.querySelector(".md-main");
  (main || document.body).insertBefore(nav, main ? main.firstChild : null);
  nav.appendChild(mapPanel);
  if (tocPanel) nav.appendChild(tocPanel);
  document.body.appendChild(veil);
  document.body.classList.add("has-secnav");

  /* --- opening and closing ---------------------------------------------------- */
  var pairs = [[mapBtn, mapPanel]];
  if (tocBtn) pairs.push([tocBtn, tocPanel]);
  var openPair = null;

  function closeAll(restore) {
    if (!openPair) return;
    var btn = openPair[0];
    openPair[1].hidden = true;
    btn.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    veil.hidden = true;
    openPair = null;
    if (restore) btn.focus();
  }
  function open(pair) {
    closeAll(false);
    pair[1].hidden = false;
    pair[0].setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    veil.hidden = false;
    openPair = pair;
    var cur = pair[1].querySelector('[aria-current="page"], .is-current');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
    pair[1].focus({ preventScroll: true });
  }
  pairs.forEach(function (pair) {
    pair[0].addEventListener("click", function () {
      if (openPair === pair) closeAll(false); else open(pair);
    });
    var x = pair[1].querySelector(".secnav__close");
    if (x) x.addEventListener("click", function () { closeAll(true); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openPair) {
      e.preventDefault();
      closeAll(true);
    }
  });
  document.addEventListener("click", function (e) {
    if (openPair && !nav.contains(e.target)) closeAll(false);
  });
  nav.addEventListener("focusout", function (e) {
    if (openPair && e.relatedTarget && !nav.contains(e.relatedTarget)) closeAll(false);
  });

  /* --- as you scroll: the heading you are in, and the dock ------------------- */
  var nowEl = tocBtn ? tocBtn.querySelector(".secnav__now") : null;
  function update() {
    if (dock) {
      var gone;
      if (slot) {
        gone = slot.getBoundingClientRect().bottom < 0;
      } else {
        gone = window.scrollY > window.innerHeight * 0.8;
      }
      var footTop = foot.getBoundingClientRect().top;
      dock.hidden = !gone || footTop < window.innerHeight * 0.6;
    }
    if (nowEl) {
      var line = 120, at = -1;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top - line <= 0) at = i; else break;
      }
      nowEl.textContent = at === -1 ? heads.length + " sections" : text(heads[at]);
      chips.forEach(function (c, j) {
        if (j === at) c.setAttribute("aria-current", "location");
        else c.removeAttribute("aria-current");
      });
    }
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
