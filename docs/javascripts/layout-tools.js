/* Layout redesign (2026-09-25): behaviour for the tools package.

   The Tool Directory's category rows (render_data.py renders them as a
   heading beside a disclosure) get one control on their title line that
   opens or closes every row at once, for readers who would rather scan or
   search the whole directory in the page. The chooser itself lives in
   tools-chooser.js. Without JavaScript the rows open one at a time. */
(function () {
  "use strict";

  var title = document.getElementById("browse-by-category");
  if (!title) return;
  var rows = [].slice.call(document.querySelectorAll(
    "#directory-shelf .tool-cat:not(.tool-cat--models) > details.tool-cat__list"));
  if (rows.length < 2) return;

  var button = document.createElement("button");
  button.type = "button";
  button.className = "tool-openall";
  title.appendChild(button);

  function sync() {
    var anyClosed = rows.some(function (d) { return !d.open; });
    button.textContent = anyClosed ? "Open all categories" : "Close all categories";
  }

  button.addEventListener("click", function () {
    var anyClosed = rows.some(function (d) { return !d.open; });
    rows.forEach(function (d) { d.open = anyClosed; });
    sync();
  });
  rows.forEach(function (d) { d.addEventListener("toggle", sync); });
  sync();
})();
