/* Explainer videos (owner approved 2026-10-07). scripts/render_data.py
   renders each video from data/explainer_videos.yaml as a still from the
   film with a play button, linked to the video on YouTube, so it works
   without JavaScript. This makes the press play on the page instead: it
   swaps the still for YouTube's player from youtube-nocookie.com, which is
   the first moment anything loads from YouTube, starts it, and moves focus
   to it. A press with a modifier key (open in a new tab or window) is left
   to the browser. Captions start off; the player's CC button turns them
   on. */
(function () {
  "use strict";

  function play(link) {
    var id = link.getAttribute("data-ev-id");
    if (!id || !/^[\w-]{11}$/.test(id)) return false;
    var frame = document.createElement("iframe");
    frame.className = "ev-player";
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
    frame.title = "YouTube video: " + (link.getAttribute("data-ev-title") || "");
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.setAttribute("allowfullscreen", "");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    link.replaceWith(frame);
    frame.focus();
    return true;
  }

  document.addEventListener("click", function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var link = ev.target.closest ? ev.target.closest("a.ev-frame") : null;
    if (link && play(link)) ev.preventDefault();
  });
})();
