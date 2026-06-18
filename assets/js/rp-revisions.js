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

  /* ---------- #2/#3  opening screen: fades out for good after a beat or first scroll ---------- */
  var film = $("#film");
  var intro = $("#introCap");
  var introDismissed = false;
  // Scene 1 owns the screen until the intro has fully faded — block every walkthrough cap.
  if (intro) document.body.classList.add("scene1-on");
  function dismissIntro() {
    if (introDismissed || !intro) return;
    intro.classList.add("is-hidden");
    introDismissed = true;
    window.removeEventListener("scroll", introUpd);

    // Release Scene 2 ONLY once Scene 1 has actually finished fading to opacity 0.
    var released = false;
    function releaseScene2() {
      if (released) return;
      released = true;
      if (intro) intro.removeEventListener("transitionend", onIntroFade);
      var capsEl = document.getElementById("caps");
      if (capsEl) capsEl.classList.add("caps-unlock");   // brief fade so Scene 2 eases in
      document.body.classList.remove("scene1-on");
      setTimeout(function () { if (capsEl) capsEl.classList.remove("caps-unlock"); }, 700);
    }
    function onIntroFade(e) {
      // wait for the headline/container opacity transition specifically
      if (e.target === intro && e.propertyName === "opacity") releaseScene2();
    }
    intro.addEventListener("transitionend", onIntroFade);
    // Safety fallback only — covers prefers-reduced-motion / interrupted transitions
    // where transitionend may never fire. Generous margin over the ~0.94s CSS fade.
    setTimeout(releaseScene2, 1600);
  }
  function introUpd() {
    if (introDismissed || !film || !intro) return;
    var r = film.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    if (p > 0.02) dismissIntro();        // first real scroll → gone for good
  }
  window.addEventListener("scroll", introUpd, { passive: true });
  // arm a 2.8s auto-dismiss once the experience is actually on screen (gate gone, video ready)
  var armCheck = setInterval(function () {
    if (introDismissed) { clearInterval(armCheck); return; }
    if (document.getElementById("gate")) return;
    if (document.body.classList.contains("loading")) return;
    clearInterval(armCheck);
    setTimeout(dismissIntro, 2800);
  }, 200);
  introUpd();

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
