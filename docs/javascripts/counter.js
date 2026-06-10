/* Privacy-respecting visit counter (GoatCounter: no cookies, no personal
   data, EU-hosted). Disabled until the site code below is filled in with
   the code from the owner's goatcounter.com account. */

(function () {
  var code = "tarronkay"; // owner's GoatCounter site code
  if (!code) return;
  var s = document.createElement("script");
  s.async = true;
  s.dataset.goatcounter = "https://" + code + ".goatcounter.com/count";
  s.src = "https://gc.zgo.at/count.js";
  document.head.appendChild(s);
})();
