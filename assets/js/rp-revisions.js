/* ============================================================
   RESILIENCE POINT — revision behaviour layer
   Additive only. Runs after rp.js / rp-additions.js.
   Adds: opening-screen fade, problem strike+reveal, slide-in
   reveals, animated counters, parallax, Italy-map reveal.
   ============================================================ */
(function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- #2/#3  opening screen ----------
     The opening line (#introCap) is now a normal scroll-driven caption,
     handled by the caption system in rp.js — visible on load, fades out on
     scroll just before the first walkthrough message. No timers, no gating. */
  var film = $("#film");

  /* ---------- #7  slide-in reveals (left / right) ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  $$(".rv-l, .rv-r").forEach(function (el) { io.observe(el); });

  /* ---------- #8  market problem: cross-out then reveal ---------- */
  var problem = $("#problem");
  if (problem) {
    var pio = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        setTimeout(function () { problem.classList.add("struck"); }, 950);
        pio.disconnect();
      }
    }, { threshold: 0.45 });
    pio.observe(problem);
  }

  /* ---------- #7  animated counters ---------- */
  function animateCount(el) {
    var to = parseFloat(el.getAttribute("data-count"));
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    var dur = 1150, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = clamp((ts - start) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------- #7  subtle parallax on concept imagery ---------- */
  var pxImgs = $$("[data-parallax] img");
  if (pxImgs.length) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        pxImgs.forEach(function (img) {
          var fig = img.parentNode;
          var r = fig.getBoundingClientRect();
          var c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          img.style.transform = "translateY(" + (c * -26).toFixed(1) + "px)";
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- #17  Italy map reveal ---------- */
  var im = $("#italyMap");
  if (im) {
    var path = $(".italy-path", im);
    if (path) { try { var L = path.getTotalLength(); path.style.setProperty("--plen", L); } catch (e) {} }
    var mio = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { im.classList.add("in"); mio.disconnect(); }
    }, { threshold: 0.22 });
    mio.observe(im);
  }
})();
