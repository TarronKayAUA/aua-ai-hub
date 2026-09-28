/* The section navigator (navigation synthesis, 2026-09-26).
 *
 * Two controls replace both sidebars, and each says what it does in words:
 *
 *   [icon Browse Tools & Prompts ^]  [On this page ^]  [Filters 2]   [Copy prompt]
 *
 * 1. "Browse <section>" ("Browse" on phones, beside "This page") opens the section as
 *    a map: groups of cards, the current page filled and marked in words,
 *    every sibling one click away, and a key naming the colors drawn. On a
 *    narrow screen its title bar also has the section's overview and a
 *    "Jump to group" row, since the map opens at the reader's own group.
 * 2. "On this page" opens the page's sections as short chips, the one you
 *    are reading filled (on the glossary, its A to Z instead).
 * 3. On a shelf, Filters brings the shelf's filter band back into view from
 *    far down the list, and shows how many filters are on.
 * 4. The page's primary action (Copy prompt, a guide's Copy the prompt, a
 *    module's Next) joins them only while its own place is out of view, so
 *    it is never on screen twice.
 *
 * WHERE THEY SIT. Nothing floats over the page's words. On a reading page
 * (task, lesson, reference) wide enough that the empty gutter beside the
 * reading column holds them without touching it, they stack there as a rail
 * (measured, not assumed), lifted above the footer as it scrolls in.
 * Everywhere else (shelves, whose content is full width; narrower windows;
 * phones) they are one dock along the foot of the screen, and the page
 * reserves the dock's measured height (ResizeObserver): the page is padded
 * by it, so its last line ends above the dock, and scroll-padding keeps an
 * anchor jump or a focused control clear of it, with a focus check behind
 * that for browsers that ignore scroll-padding on focus.
 *
 * Everything here is built from the section foot that scripts/layout_nav.py
 * writes at the end of every inner page (the map and the page's sections,
 * each in a <details>), so the floating panels and the foot cannot
 * disagree, and without JavaScript the foot is a complete way round. The
 * two controls are disclosures (aria-expanded, aria-controls). Escape or a
 * click outside closes a panel; Escape and the Close button return focus to
 * the control. Each panel keeps its title and Close in view while its body
 * scrolls, and opens with the current page in view without starting on a
 * cropped card.
 */
(function () {
  "use strict";
  var foot = document.querySelector("[data-secfoot]");
  var article = document.querySelector(".md-content__inner");
  if (!foot || !article) return;
  var body = document.body;
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var phone = window.matchMedia("(max-width: 37.4375em)");
  var type = body.getAttribute("data-page-type") || "";
  var READING = { task: true, lesson: true, reference: true };
  var GAP = 24;          // between the rail and the reading column, px
  var EDGE = 16;         // between the rail and the page grid's edge, px

  var SVG = {
    chevron: "M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z",
    list: "M3 4h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zm-4 7h2v2H3zm4 0h14v2H7z",
    close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    up: "M13 20h-2V8l-5.5 5.5-1.42-1.42L12 4.16l7.92 7.92-1.42 1.42L13 8z",
    filter: "M6 13h12v-2H6m-3-5v2h18V6M10 18h4v-2h-4z",
    next: "M4 11v2h12l-5.5 5.5 1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5 16 11z",
    compass: "M7 17l3.2-6.8L17 7l-3.2 6.8L7 17m5-5.9a.9.9 0 0 0-.9.9.9.9 0 0 0 .9.9.9.9 0 0 0 .9-.9.9.9 0 0 0-.9-.9M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8z"
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
    return (node && node.textContent || "").replace(/¶/g, "").replace(/\s+/g, " ").trim();
  }
  function rendered(node) {
    return !!node && node.getClientRects().length > 0;
  }
  function rem() {
    return parseFloat(window.getComputedStyle(root).fontSize) || 16;
  }
  function headerBottom() {
    var h = document.querySelector(".md-header");
    var b = h ? h.getBoundingClientRect().bottom : 0;
    return Math.max(0, b);
  }
  function behavior() {
    return reduce.matches ? "auto" : "smooth";
  }

  var section = foot.getAttribute("data-section") || "";
  var total = foot.getAttribute("data-total") || "";
  var groups = foot.getAttribute("data-groups") || "";
  var where = foot.getAttribute("data-where") || "";
  var hereGroup = foot.getAttribute("data-group") || "";
  // A landing page's foot can name the control differently: the homepage
  // browses "the site", whose groups are sections.
  // Phones show the short label; "Browse" and "This page" fit side by side (owner, 2026-09-28).
  var shortName = foot.getAttribute("data-short") || "Browse";
  var panelTitle = foot.getAttribute("data-title") || section;
  var unit = foot.getAttribute("data-unit") || "group";
  // The folded compass can carry a word (mkdocs.yml extra: nav_control_label).
  var foldLabel = foot.getAttribute("data-fold-label") || "";

  var nav = el("nav", "secnav");
  nav.setAttribute("aria-label", "Section and page navigation");
  var bar = el("div", "secnav__bar");
  nav.appendChild(bar);
  var veil = el("div", "secnav__veil");
  veil.hidden = true;

  function closeButton(label) {
    var b = el("button", "secnav__close", icon("close") + "<span>Close</span>");
    b.type = "button";
    b.setAttribute("aria-label", "Close " + label);
    return b;
  }

  /* --- 1. Browse <section> and its map ------------------------------------ */
  var sicon = foot.querySelector(".secfoot__all .secfoot__sicon");
  var mapBtn = el("button", "secnav__btn secnav__btn--map");
  mapBtn.type = "button";
  mapBtn.setAttribute("aria-expanded", "false");
  mapBtn.setAttribute("aria-controls", "secnav-map");
  mapBtn.innerHTML =
    '<span class="secnav__icon">' + (sicon ? sicon.innerHTML : "") + "</span>" +
    '<span class="secnav__label"><span class="secnav__long"><span class="secnav__lead">Browse</span> ' +
    '<span class="secnav__name"></span></span><span class="secnav__short"></span></span>' +
    icon("chevron", "secnav__chev");
  mapBtn.querySelector(".secnav__name").textContent = section;
  mapBtn.querySelector(".secnav__short").textContent = shortName;
  mapBtn.title = "Browse every page in " + section;
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
    '<span class="secnav__ptext"><span class="secnav__ptitle"></span> <span class="secnav__pmeta"></span></span>';
  head.querySelector(".secnav__ptitle").textContent = panelTitle;
  // Only numbers the panel shows: its groups, and where the reader is.
  head.querySelector(".secnav__pmeta").textContent =
    groups + " " + unit + (groups === "1" ? "" : "s") + " \u00b7 You are " +
    (/^(inside|on) /.test(where) ? where : "in " + where);
  var overview = foot.querySelector(".secfoot__overview");
  if (overview) {
    var ov = overview.cloneNode(true);
    ov.className = "secnav__overview";
    head.appendChild(ov);
  }
  var mapClose = closeButton("the list of pages");
  head.appendChild(mapClose);
  mapPanel.appendChild(head);
  var mapBody = el("div", "secnav__pbody");
  var map = foot.querySelector(".secfoot__all [data-secmap]");
  if (map) {
    var mapCopy = map.cloneNode(true);
    // The color key sits in the panel's title bar, so it is in view
    // whatever the body is scrolled to.
    var key = mapCopy.querySelector(".kind-key");
    if (key) head.insertBefore(key, overview ? head.querySelector(".secnav__overview") : mapClose);
    mapBody.appendChild(mapCopy);
    // Jump to group: every group as a small button, so a reader who opened
    // the map at their own group can still survey the section.
    var groupEls = Array.prototype.slice.call(mapCopy.querySelectorAll(".secmap__group"));
    if (groupEls.length > 1) {
      var jump = el("div", "secnav__jump");
      jump.setAttribute("role", "group");
      jump.setAttribute("aria-label", "Jump to " + unit);
      jump.appendChild(el("span", "secnav__jumplead", "Jump to " + unit));
      if (overview) {
        // On a narrow screen the overview leads the row (the title bar's
        // own copy is for wide screens).
        var ov2 = overview.cloneNode(true);
        ov2.className = "secnav__jumpbtn secnav__jumpbtn--overview";
        jump.appendChild(ov2);
      }
      groupEls.forEach(function (g) {
        var name = g.getAttribute("data-group") || "";
        var b = el("button", "secnav__jumpbtn");
        b.type = "button";
        b.textContent = name;
        if (name === hereGroup) b.setAttribute("aria-current", "true");
        b.addEventListener("click", function () {
          var box = mapBody.getBoundingClientRect();
          var y = g.getBoundingClientRect().top - box.top + mapBody.scrollTop - 8;
          mapBody.scrollTo({ top: Math.max(0, y), behavior: behavior() });
          var first = g.querySelector("a[href]");
          if (first) first.focus({ preventScroll: true });
        });
        jump.appendChild(b);
      });
      head.appendChild(jump);
    }
  }
  mapPanel.appendChild(mapBody);

  /* --- 2. On this page ------------------------------------------------------ */
  var tocBtn = null, tocPanel = null, tocClose = null, chips = [], heads = [];
  var tocBox = foot.querySelector("[data-sectoc]");
  var tocSrc = tocBox ? tocBox.querySelector(".secnav__chips") : null;
  // What the page's sections are ("54 terms" on the glossary).
  var tocCount = tocBox ? tocBox.getAttribute("data-count") : "";
  var tocNoun = tocBox ? tocBox.getAttribute("data-noun") || "sections" : "sections";
  if (tocSrc) {
    var list = tocSrc.cloneNode(true);
    // Only sections the page is showing (a chooser can hide its index).
    Array.prototype.slice.call(list.querySelectorAll("a.secnav__chip")).forEach(function (a) {
      var target = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
      if (!target || !rendered(target)) {
        a.parentNode.parentNode.removeChild(a.parentNode);
        return;
      }
      chips.push(a);
      heads.push(target);
    });
    if (chips.length >= 2) {
      tocBtn = el("button", "secnav__btn secnav__btn--toc");
      tocBtn.type = "button";
      tocBtn.setAttribute("aria-expanded", "false");
      tocBtn.setAttribute("aria-controls", "secnav-toc");
      tocBtn.setAttribute("aria-label", "On this page: " + (tocCount || chips.length) + " " + tocNoun);
      tocBtn.title = "Jump to a section of this page";
      tocBtn.innerHTML = '<span class="secnav__icon secnav__icon--toc">' + icon("list") + "</span>" +
        '<span class="secnav__label"><span class="secnav__always"><span class="secnav__long">On this page</span>' +
        '<span class="secnav__short">This page</span></span>' +
        '<span class="secnav__now" aria-hidden="true"></span></span>' + icon("chevron", "secnav__chev");
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
      th.querySelector(".secnav__pmeta").textContent = (tocCount || chips.length) + " " + tocNoun;
      tocClose = closeButton("On this page");
      th.appendChild(tocClose);
      tocPanel.appendChild(th);
      var tb = el("div", "secnav__pbody");
      chips.forEach(function (a) {
        a.addEventListener("click", function () { closeAll(false); });
      });
      var topLi = el("li");
      var top = el("button", "secnav__chip secnav__chip--top", icon("up") + "Back to top");
      top.type = "button";
      top.addEventListener("click", function () {
        closeAll(false);
        window.scrollTo({ top: 0, behavior: behavior() });
        var h1 = article.querySelector("h1");
        if (h1) {
          h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
      });
      topLi.appendChild(top);
      list.appendChild(topLi);
      tb.appendChild(list);
      tocPanel.appendChild(tb);
    } else {
      chips = [];
      heads = [];
    }
  }

  /* --- 3. Filters, on a shelf ------------------------------------------------ */
  var shelf = document.querySelector(".md-typeset .shelf");
  var filters = shelf ? shelf.querySelector(".shelf__filters") : null;
  var filtersBtn = null, badge = null;
  if (filters) {
    filtersBtn = el("button", "secnav__btn secnav__btn--filters");
    filtersBtn.type = "button";
    filtersBtn.hidden = true;
    filtersBtn.title = "Show the filters at the top of the list";
    filtersBtn.innerHTML = '<span class="secnav__icon">' + icon("filter") + "</span>" +
      '<span class="secnav__label"><span class="secnav__always">Filters</span></span>' +
      '<span class="secnav__badge" data-n="0" aria-hidden="true"></span>';
    badge = filtersBtn.querySelector(".secnav__badge");
    bar.appendChild(filtersBtn);
  }
  function activeFilters() {
    if (!filters) return 0;
    return Array.prototype.filter.call(filters.querySelectorAll("input:checked"), function (i) {
      return i.value !== "";
    }).length;
  }
  function filterAnchor() {
    var summary = shelf.querySelector(".shelf__summary");
    if (rendered(filters) && !filters.hidden) return filters;
    return rendered(summary) ? summary : shelf;
  }
  function callFilters() {
    closeAll(false);
    if (shelf.classList.contains("is-folded")) {
      var change = shelf.querySelector(".shelf__summary button");
      if (change) change.click();
    }
    var anchor = filterAnchor();
    var y = anchor.getBoundingClientRect().top + window.pageYOffset - headerBottom() - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: behavior() });
    // The chosen option, else the first control the band is showing (a
    // chooser keeps a hidden fallback index in the same band).
    var shown = Array.prototype.filter.call(filters.querySelectorAll("input, button"), function (n) {
      return rendered(n.closest("label") || n) && !n.disabled;
    });
    var input = shown.filter(function (n) { return n.checked && n.value !== ""; })[0] || shown[0];
    if (input) input.focus({ preventScroll: true });
    anchor.classList.add("is-called");
    window.setTimeout(function () { anchor.classList.remove("is-called"); }, 1600);
  }
  if (filtersBtn) filtersBtn.addEventListener("click", callFilters);

  /* --- 4. The page's primary action -------------------------------------------- */
  var slot = article.querySelector("[data-page-action]");
  var source = slot ? slot.querySelector(".md-button--primary") : null;
  if (!source && type === "lesson") source = article.querySelector(".learn-next a.md-button--primary");
  var act = null, dock = null;
  if (source) {
    act = el("span", "secnav__act");
    act.hidden = true;
    if (source.tagName === "BUTTON" && source.classList.contains("pp-copy")) {
      // A prompt page's Copy prompt: layout-prompts.js wires every
      // button.pp-copy (it runs after this file), so this one copies too.
      dock = el("button", "secnav__action pp-copy");
      dock.type = "button";
      dock.setAttribute("data-copy-from", source.getAttribute("data-copy-from") || "");
      dock.setAttribute("data-title", source.getAttribute("data-title") || "");
      dock.textContent = "Copy prompt";
    } else {
      dock = el("a", "secnav__action");
      dock.href = source.getAttribute("href");
      if (source.classList.contains("guide-copy")) {
        // A guide's Copy the prompt: the guide's own script (end of the
        // page) makes a.secnav__action with the same href copy as well.
        dock.innerHTML = source.innerHTML;
      } else if (source.classList.contains("learn-next__btn")) {
        var t = text(source.querySelector(".learn-next__title")) || text(source);
        var m = /^Module (\d+)/.exec(t);
        dock.innerHTML = icon("next") + '<span class="secnav__long"></span><span class="secnav__short"></span>';
        dock.querySelector(".secnav__long").textContent = "Next: " + t;
        dock.querySelector(".secnav__short").textContent = m ? "Next: Module " + m[1] : "Next";
        dock.setAttribute("aria-label", "Next: " + t);
      } else {
        dock.textContent = text(source);
      }
    }
    var nextTitle = text(source.querySelector(".learn-next__title"));
    dock.title = nextTitle ? "Next: " + nextTitle : text(source);
    act.appendChild(dock);
    bar.appendChild(act);
  }
  // Everything on the page that does the same thing: while any of it is in
  // view, the docked copy stays out, so the action is never on screen twice
  // (a prompt page repeats Copy prompt under its text; a module's Next is
  // also the Next card at its foot).
  var twins = [];
  if (source) {
    var href = source.getAttribute("href");
    Array.prototype.forEach.call(document.querySelectorAll(
      ".md-content button.pp-copy, .md-content a.guide-copy, .md-content a.secfoot__card--next"), function (n) {
      if (n === source) return;
      if (n.tagName === "BUTTON" ? source.tagName === "BUTTON" : n.getAttribute("href") === href) twins.push(n);
    });
    twins.unshift(source);
  }

  var main = document.querySelector(".md-main");
  (main || body).insertBefore(nav, main ? main.firstChild : null);
  nav.appendChild(mapPanel);
  if (tocPanel) nav.appendChild(tocPanel);
  body.appendChild(veil);
  body.classList.add("has-secnav");

  /* --- where they sit: the rail or the dock --------------------------------- */
  var mode = "";
  var rail = { left: 0, width: 0 };
  function columnLeft() {
    // The reading column, and anything in it that reaches further out.
    var left = article.getBoundingClientRect().left;
    Array.prototype.forEach.call(article.children, function (c) {
      var r = c.getBoundingClientRect();
      if (r.width > 0 && r.left < left) left = r.left;
    });
    return left;
  }
  /* Width round, designer C (owner, 2026-09-26): one control at the bottom
     left on every page that has these controls, at every width. It opens
     showing the labelled buttons (Browse <section>, On this page with its
     live second line, and the docked action or Filters when they apply);
     after about four seconds without interaction it folds to one small
     round button in the corner, which hover, keyboard focus or a tap opens
     again. It folds a moment after the pointer or focus leaves, never while
     a panel is open, focus is inside it or the pointer is over it, and
     Escape folds it (WCAG 1.4.13: hoverable, dismissible, persistent).
     Folded, it covers almost nothing; open, it may float over the page, and
     a focused control it would cover is scrolled clear of it. */
  var toggle = el("button", "secnav__toggle", icon("compass"));
  toggle.type = "button";
  bar.id = "secnav-bar";
  toggle.setAttribute("aria-controls", "secnav-bar");
  toggle.setAttribute("aria-label", "Page navigation: Browse " + section +
    (tocBtn ? ", On this page" : "") + (filtersBtn ? ", Filters" : ""));
  if (foldLabel) {
    // The alternative the owner can switch on: a word beside the folded
    // compass. The accessible name stays the button's aria-label.
    var word = el("span", "secnav__word");
    word.textContent = foldLabel;
    word.setAttribute("aria-hidden", "true");
    toggle.appendChild(word);
    nav.classList.add("has-word");
  }
  nav.insertBefore(toggle, bar);
  var expanded = true, hover = false, foldTimer = null;
  /* Folding is animated (owner, 2026-09-27): the buttons shrink and fade
     into the compass, which stays put, so the reader sees where they went.
     Transform and opacity only, on the fixed tray, so nothing on the page
     moves; from the first frame the tray is inert (not focusable, hidden
     from assistive technology). Opening is instant, and cancels a fold in
     progress; with reduced motion, folding is instant too. */
  var FOLD_MS = 300;
  var WORD_MS = 160;  // the word sliding back into the compass (layout-nav.css)
  var foldAnim = null, foldBox = null, revealTimer = null;
  // Where a resting pointer was when the control folded; cleared once the
  // pointer really moves (see the pointer handlers below).
  var lastXY = null, stillAt = null;
  function shut() {
    foldAnim = null;
    foldBox = null;
    bar.hidden = true;
    bar.inert = false;
    bar.removeAttribute("aria-hidden");
    bar.style.transformOrigin = "";
    nav.classList.remove("is-folding");
    nav.classList.add("is-shut");
  }
  function setExpanded(open) {
    expanded = open;
    nav.classList.toggle("is-folded", !open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.title = open ? "Fold the page navigation" : "Show the page navigation";
    if (foldAnim) {
      var a = foldAnim;
      foldAnim = null;
      a.onfinish = null;
      a.cancel();
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
    if (open) {
      foldBox = null;
      var wasShut = nav.classList.contains("is-shut");
      bar.style.transformOrigin = "";
      nav.classList.remove("is-folding", "is-shut");
      var show = function () {
        revealTimer = null;
        bar.hidden = false;
        bar.inert = false;
        bar.removeAttribute("aria-hidden");
      };
      // With the word on, it first slides back into the compass, then the
      // buttons appear in their final place, so nothing slides sideways
      // (owner, 2026-09-27). Without the word, or with reduced motion,
      // they appear at once.
      if (wasShut && foldLabel && !reduce.matches && mode === "corner") {
        revealTimer = setTimeout(show, WORD_MS);
      } else {
        show();
      }
      return;
    }
    stillAt = lastXY ? lastXY.slice() : null;
    // Folding while the word was still sliding in: put it straight back.
    if (bar.hidden) {
      shut();
      return;
    }
    if (reduce.matches || !bar.animate || mode !== "corner") {
      shut();
      return;
    }
    bar.inert = true;
    bar.setAttribute("aria-hidden", "true");
    nav.classList.add("is-folding");
    var t = toggle.getBoundingClientRect();
    foldBox = bar.getBoundingClientRect();
    // Scaled about the compass's centre: the buttons travel into it.
    bar.style.transformOrigin = (t.left + t.width / 2 - foldBox.left) + "px " +
      (t.top + t.height / 2 - foldBox.top) + "px";
    foldAnim = bar.animate([
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0.12)", opacity: 0 }
    ], { duration: FOLD_MS, easing: "cubic-bezier(0.4, 0, 0.7, 1)" });
    foldAnim.onfinish = shut;
  }
  // The folding tray is inert, so it cannot see the pointer: a pointer
  // coming back over where the buttons were cancels the fold.
  // Only a pointer that really moves opens the control. Folding changes
  // what sits under a resting pointer (the tray shrinks away, and with the
  // word on, the pill grows back under it), and the browser reports that as
  // the pointer entering; without this, Escape with the pointer over the
  // control folded it and the growing pill opened it again (2026-09-27).
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType === "mouse") lastXY = [e.clientX, e.clientY];
  }, true);
  function moved(e) {
    return !stillAt || Math.abs(e.clientX - stillAt[0]) > 1 || Math.abs(e.clientY - stillAt[1]) > 1;
  }
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !moved(e)) return;
    if (stillAt) {
      stillAt = null;
      if (!expanded && nav.contains(e.target)) {
        hover = true;
        unfold();
        return;
      }
    }
    if (!foldAnim || !foldBox) return;
    if (e.clientX >= foldBox.left && e.clientX <= foldBox.right &&
        e.clientY >= foldBox.top && e.clientY <= foldBox.bottom) {
      hover = true;
      unfold();
    }
  });
  // Pinned: opened by a tap (or by the keyboard on the compass). It then
  // stays open until the compass is pressed again, the reader taps outside,
  // presses Escape or chooses something in it.
  var pinned = false;
  function canFold() {
    return !pinned && !openPair && !hover && !nav.contains(document.activeElement);
  }
  function foldSoon(ms) {
    window.clearTimeout(foldTimer);
    foldTimer = window.setTimeout(function () {
      if (canFold()) setExpanded(false);
    }, ms);
  }
  var justOpened = false;
  function unfold() {
    window.clearTimeout(foldTimer);
    if (!expanded) {
      setExpanded(true);
      // A tap focuses the button and then clicks it: that click must not
      // fold what the focus has just opened.
      justOpened = true;
      window.setTimeout(function () { justOpened = false; }, 400);
    }
  }
  setExpanded(true);
  nav.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "mouse") {
      hover = true;
      if (moved(e)) { stillAt = null; unfold(); }
    }
  });
  nav.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") { hover = false; foldSoon(700); }
  });
  // Focus we give the compass ourselves (after Escape) must not reopen it.
  var quietFocus = false;
  toggle.addEventListener("focus", function () {
    if (!quietFocus) unfold();
  });
  var lastPointer = "";
  toggle.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; });
  toggle.addEventListener("click", function () {
    var mouse = lastPointer === "mouse";
    lastPointer = "";
    if (mouse) {
      // A mouse has already opened it by hovering: a click folds it.
      if (expanded && !justOpened) { pinned = false; closeAll(false); setExpanded(false); } else unfold();
      return;
    }
    // A tap, or Enter or Space: a toggle that stays as it is left.
    if (expanded && !justOpened) {
      pinned = false;
      closeAll(false);
      setExpanded(false);
    } else {
      unfold();
      pinned = true;
    }
  });
  // A tap outside folds a tray a tap opened.
  document.addEventListener("pointerdown", function (e) {
    if (pinned && !nav.contains(e.target)) {
      pinned = false;
      if (!openPair) setExpanded(false);
    }
  });
  // Choosing something in the tray ends the pin: an action folds it, a
  // panel keeps it open until the panel closes.
  bar.addEventListener("click", function (e) {
    var hit = e.target.closest && e.target.closest("a, button");
    if (!hit) return;
    pinned = false;
    if (hit.classList.contains("secnav__action") || hit.classList.contains("secnav__btn--filters")) foldSoon(300);
  });

  function decide() {
    return "corner";
  }
  function reserve() {
    root.classList.remove("secnav-docked");
    root.style.removeProperty("--secnav-h");
  }
  function layout() {
    var next = decide();
    if (next !== mode) {
      mode = next;
      nav.setAttribute("data-mode", mode);
    }
    nav.style.left = "";
    nav.style.width = "";
    nav.style.top = "";
    var short = phone.matches;
    mapBtn.setAttribute("aria-label", short && !foot.hasAttribute("data-short") ? shortName + ": " + section
      : "Browse " + section + ", all " + total + " pages");
    reserve();
    update();
    if (openPair) place(openPair);
  }

  /* --- opening and closing -------------------------------------------------- */
  var pairs = [[mapBtn, mapPanel, mapClose]];
  if (tocBtn) pairs.push([tocBtn, tocPanel, tocClose]);
  var openPair = null;

  function place(pair) {
    var panel = pair[1];
    var r = bar.getBoundingClientRect();
    var hb = headerBottom();
    var wide = pair[0] === mapBtn ? 62 * rem() : 36 * rem();
    var s = panel.style;
    s.top = "";
    if (mode === "rail") {
      // Beside the rail, its foot level with the rail's.
      var left = r.right + 12;
      s.left = left + "px";
      s.right = "";
      s.width = Math.min(wide, window.innerWidth - left - EDGE) + "px";
      s.bottom = Math.max(8, window.innerHeight - r.bottom) + "px";
      s.maxHeight = (r.bottom - hb - 16) + "px";
      s.borderRadius = "";
    } else if (mode === "corner" && !phone.matches) {
      // Above the control, over the page, from its left edge.
      var n = nav.getBoundingClientRect();
      s.left = n.left + "px";
      s.right = "";
      s.width = Math.min(wide, window.innerWidth - n.left - EDGE) + "px";
      s.bottom = (window.innerHeight - n.top + 8) + "px";
      s.maxHeight = (n.top - hb - 20) + "px";
      s.borderRadius = "";
    } else if (phone.matches) {
      // A sheet across the phone, sitting on the control.
      s.left = "0px";
      s.right = "0px";
      s.width = "auto";
      s.bottom = (window.innerHeight - r.top) + "px";
      s.maxHeight = (r.top - Math.max(hb, 8) - 8) + "px";
      s.borderRadius = "1rem 1rem 0 0";
    } else {
      s.left = (r.left + 8) + "px";
      s.right = "";
      s.width = Math.min(wide, r.width - 16) + "px";
      s.bottom = (window.innerHeight - r.top + 8) + "px";
      s.maxHeight = (r.top - hb - 20) + "px";
      s.borderRadius = "";
    }
  }
  function startAtCurrent(panel) {
    // Open with the current page in view, starting on a whole group (or,
    // for a group taller than the panel, on the current card itself),
    // never on a card cut off at its top.
    var scroller = panel.querySelector(".secnav__pbody");
    var cur = scroller.querySelector('[aria-current="page"], [aria-current="true"], .secnav__chip[aria-current]');
    scroller.scrollTop = 0;
    if (!cur) return;
    var box = scroller.getBoundingClientRect();
    var c = cur.getBoundingClientRect();
    if (c.bottom <= box.bottom - 8) return;
    var group = cur.closest(".secmap__group");
    var g = group ? group.getBoundingClientRect() : c;
    var pad = 12;
    if (c.bottom - g.top + pad <= scroller.clientHeight) {
      scroller.scrollTop = g.top - box.top - pad;
    } else {
      scroller.scrollTop = c.top - box.top - pad;
    }
  }
  function closeAll(restore) {
    if (!openPair) return;
    var btn = openPair[0];
    openPair[1].hidden = true;
    btn.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    veil.hidden = true;
    openPair = null;
    if (restore) btn.focus();
    foldSoon(700);
  }
  function open(pair) {
    closeAll(false);
    pair[1].hidden = false;
    pair[0].setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    veil.hidden = false;
    openPair = pair;
    place(pair);
    startAtCurrent(pair[1]);
    pair[1].focus({ preventScroll: true });
  }
  pairs.forEach(function (pair) {
    pair[0].addEventListener("click", function () {
      if (openPair === pair) closeAll(false); else open(pair);
    });
    pair[2].addEventListener("click", function () { closeAll(true); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openPair) {
      e.preventDefault();
      closeAll(true);
    } else if (e.key === "Escape" && expanded && (hover || pinned || nav.contains(document.activeElement))) {
      // Escape folds the open control and returns focus to the compass
      // without opening it again, even with the pointer still over it.
      e.preventDefault();
      pinned = false;
      window.clearTimeout(foldTimer);
      setExpanded(false);
      quietFocus = true;
      toggle.focus({ preventScroll: true });
      quietFocus = false;
    }
  });
  document.addEventListener("click", function (e) {
    if (openPair && !nav.contains(e.target)) closeAll(false);
  });
  nav.addEventListener("focusout", function (e) {
    if (openPair && e.relatedTarget && !nav.contains(e.relatedTarget)) closeAll(false);
    if (!e.relatedTarget || !nav.contains(e.relatedTarget)) foldSoon(700);
  });

  /* A focused control is never even partly hidden by the dock at the foot
     or by the sticky header and any sticky bar at the top (WCAG 2.4.11 and
     2.4.12). scroll-padding covers most browsers; this covers the rest,
     and the header, whose height changes as it hides and returns. */
  function topCover() {
    var bottom = headerBottom();
    Array.prototype.forEach.call(document.querySelectorAll(".md-main [data-sticky-bar], .md-main .section-chips"),
      function (s) {
        var st = window.getComputedStyle(s);
        if (st.position !== "sticky" && st.position !== "fixed") return;
        var r = s.getBoundingClientRect();
        if (r.top <= bottom + 1 && r.bottom > bottom) bottom = r.bottom;
      });
    return bottom;
  }
  function reveal(target) {
    if (!target || nav.contains(target) || !target.getBoundingClientRect) return;
    if (target.closest && target.closest(".md-header, .md-tabs, .md-sidebar")) return;
    var r = target.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    var top = topCover() + 8;
    var limit = (mode === "dock" ? bar.getBoundingClientRect().top : window.innerHeight) - 8;
    if (mode === "corner") {
      // A stop that would sit under the control ends above it.
      var n = nav.getBoundingClientRect();
      if (r.left < n.right + 8 && r.right > n.left - 8) limit = Math.min(limit, n.top - 8);
    }
    if (r.height > limit - top) return;
    if (r.bottom > limit) window.scrollBy(0, r.bottom - limit);
    else if (r.top < top) window.scrollBy(0, r.top - top);
  }
  document.addEventListener("focusin", function (e) {
    if (mode === "corner" && !nav.contains(e.target) && expanded && !hover && !openPair) {
      // Focus has moved into the page: fold at once if the open control
      // would sit over the focused item, otherwise in a moment.
      var t = e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
      var n = nav.getBoundingClientRect();
      if (t && t.left < n.right && t.right > n.left && t.bottom > n.top) setExpanded(false);
      else foldSoon(700);
    }
    reveal(e.target);
    // The header can slide back in as the page scrolls up; check again
    // once it has moved.
    window.setTimeout(function () { if (document.activeElement === e.target) reveal(e.target); }, 260);
  });

  /* --- as you scroll ---------------------------------------------------------- */
  var nowEl = tocBtn ? tocBtn.querySelector(".secnav__now") : null;
  var footer = document.querySelector(".md-footer");
  function update() {
    var hb = headerBottom();
    var bottom = mode === "dock" ? bar.getBoundingClientRect().top : window.innerHeight;
    if (mode === "rail" || mode === "corner") {
      // Lifted above the footer as it scrolls in, never over it.
      var lift = footer ? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top) : 0;
      nav.style.bottom = (EDGE + lift) + "px";
    }
    if (act) {
      var show = false;
      if (rendered(source)) {
        var r = source.getBoundingClientRect();
        var inView = twins.some(function (n) {
          var q = n.getBoundingClientRect();
          // In view means at least half of it shows, not a sliver at an edge.
          return rendered(n) && q.bottom - q.height / 2 > hb && q.top + q.height / 2 < bottom;
        });
        var passed = r.bottom <= hb;
        show = !inView && (passed || window.pageYOffset > window.innerHeight * 0.5);
      }
      if (act.hidden === show) {
        act.hidden = !show;
        if (mode === "dock") reserve();
      }
    }
    if (filtersBtn) {
      var anchor = filterAnchor();
      var gone = anchor.getBoundingClientRect().bottom <= hb;
      if (filtersBtn.hidden === gone) {
        filtersBtn.hidden = !gone;
        reserve();
      }
      var n = activeFilters();
      if (badge.getAttribute("data-n") !== String(n)) {
        badge.setAttribute("data-n", String(n));
        badge.textContent = String(n);
      }
      filtersBtn.setAttribute("aria-label", n ? "Filters, " + n + " active" : "Filters");
    }
    if (heads.length) {
      var line = hb + 48, at = -1;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top - line <= 0) at = i; else break;
      }
      var now = at === -1 ? (tocCount || chips.length) + " " + tocNoun : text(chips[at]);
      if (nowEl && nowEl.textContent !== now) {
        nowEl.textContent = now;
        // The accessible name follows the visible second line.
        tocBtn.setAttribute("aria-label", "On this page: " + now);
      }
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
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 60);
  });
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      if (mode === "dock") reserve();
    }).observe(bar);
  }
  if (shelf) {
    shelf.addEventListener("click", function () { window.setTimeout(update, 0); });
    shelf.addEventListener("change", function () { window.setTimeout(update, 0); });
  }
  layout();
  // The labelled buttons show first, then fold to the corner button after
  // about four seconds without interaction.
  foldSoon(4000);
  // Space round (owner, 2026-09-27): the foot's "Browse <section>"
  // disclosure repeats the corner control, so once the control is built
  // and placed (this line runs only if everything above did) the foot
  // keeps only More in This Section. The class hides the disclosure with
  // display: none (layout-nav.css), which also takes it out of the
  // accessibility tree. Without JavaScript, or if the control fails, the
  // class is never set and the foot stays the complete way round.
  if (map && bar.isConnected) body.classList.add("has-secmap");
  // Web fonts can change the column's measure once they arrive.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener("load", layout);
})();
