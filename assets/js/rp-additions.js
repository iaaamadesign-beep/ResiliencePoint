/* ============================================================
   RESILIENCE POINT — additions behaviour
   Only the revenue-forecast accordion. Everything else (reveal,
   smooth-scroll, the film engine) is handled by rp.js and untouched.
   ============================================================ */
(function () {
  "use strict";
  var scns = document.querySelectorAll("[data-scn]");
  scns.forEach(function (scn) {
    var head = scn.querySelector(".scn__head");
    if (!head) return;
    head.addEventListener("click", function () {
      var willOpen = !scn.classList.contains("open");
      scns.forEach(function (s) { s.classList.remove("open"); });
      if (willOpen) scn.classList.add("open");
    });
  });
})();
