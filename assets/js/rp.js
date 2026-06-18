/* ============================================================
   RESILIENCE POINT — experience engine
   ============================================================ */
(function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- PRELOADER + VIDEO ---------------- */
  var video = $("#film-video");
  var loader = $("#loader");
  var fill = $("#loaderFill");
  var pct = $("#loaderPct");
  var started = false;

  function setProgress(p) {
    p = clamp(p, 0, 1);
    fill.style.width = (p * 100) + "%";
    pct.textContent = "Caricamento esperienza · " + Math.round(p * 100) + "%";
  }

  function reveal() {
    if (started) return;
    started = true;
    setProgress(1);
    setTimeout(function () {
      loader.classList.add("done");
      document.body.classList.remove("loading");
      window.scrollTo(0, 0);
      startLoop();
    }, 320);
  }

  // ---- Robust load: fetch the whole clip to a Blob so every frame is
  // instantly seekable (a paused <video> only buffers a few seconds ahead,
  // which makes scrubbing show black). Falls back to streaming if fetch fails.
  var VIDEO_SRC = "assets/video/walkthrough.mp4";

  function afterReady() { try { video.pause(); video.currentTime = 0; } catch (e) {} reveal(); }

  function loadDirect() {
    if (started) return;
    try { video.src = VIDEO_SRC; video.load(); } catch (e) {}
    video.addEventListener("loadeddata", function () { try { video.pause(); } catch (e) {} }, { once: true });
    video.addEventListener("canplaythrough", afterReady, { once: true });
    video.addEventListener("progress", function () {
      try {
        if (video.duration && video.buffered.length) {
          var r = video.buffered.end(video.buffered.length - 1) / video.duration;
          setProgress(0.1 + 0.85 * r);
          if (r >= 0.985) afterReady();
        }
      } catch (e) {}
    });
    setTimeout(afterReady, 12000);
  }

  function loadViaFetch() {
    if (!window.fetch || !window.ReadableStream) { loadDirect(); return; }
    fetch(VIDEO_SRC).then(function (resp) {
      if (!resp.ok || !resp.body) throw new Error("no-stream");
      var total = parseInt(resp.headers.get("Content-Length") || "0", 10) || 16850000;
      var reader = resp.body.getReader();
      var chunks = [], received = 0;
      (function pump() {
        return reader.read().then(function (res) {
          if (res.done) {
            var blob = new Blob(chunks, { type: "video/mp4" });
            video.src = URL.createObjectURL(blob);
            video.load();
            video.addEventListener("loadeddata", afterReady, { once: true });
            setProgress(0.99);
            setTimeout(afterReady, 4000);
            return;
          }
          chunks.push(res.value); received += res.value.length;
          setProgress(0.03 + 0.94 * Math.min(1, received / total));
          return pump();
        });
      })();
    }).catch(loadDirect);
  }

  setProgress(0.04);
  loadViaFetch();
  setTimeout(function () { if (!started && video.readyState >= 3) afterReady(); }, 16000);
  setTimeout(reveal, 20000); // ultimate fallback

  /* ---------------- SCROLL-SCRUBBED FILM ---------------- */
  var film = $("#film");
  var railfill = $("#railfill");
  var stageLabel = $("#stageLabel");
  var hint = $("#hint");
  var caps = $$("#caps .cap").map(function (el) {
    return { el: el, s: parseFloat(el.dataset.start), e: parseFloat(el.dataset.end),
             center: el.classList.contains("cap--center") };
  });

  var STAGES = [
    [0.00, "Presenza su strada"],
    [0.14, "Un'estetica d'impatto"],
    [0.30, "La parete dei servizi"],
    [0.48, "La lounge · LED wall"],
    [0.66, "Il desk consulenziale"],
    [0.82, "Di nuovo su strada"]
  ];

  var targetT = 0, curT = 0, lastSet = -1, loopOn = false;

  function filmProgress() {
    var r = film.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    if (span <= 0) return 0;
    return clamp(-r.top / span, 0, 1);
  }

  function capOpacity(p, s, e) {
    if (p <= s || p >= e) return 0;
    var fade = (e - s) * 0.24;
    if (p < s + fade) return (p - s) / fade;
    if (p > e - fade) return (e - p) / fade;
    return 1;
  }

  function startLoop() {
    if (loopOn) return;
    loopOn = true;
    requestAnimationFrame(frame);
  }

  function frame() {
    var p = filmProgress();
    var dur = video.duration || 31;
    targetT = p * (dur - 0.05);
    curT = lerp(curT, targetT, 0.14);
    if (Math.abs(targetT - curT) < 0.002) curT = targetT;

    if (video.readyState >= 2 && Math.abs(curT - lastSet) > 0.012) {
      try { video.currentTime = curT; lastSet = curT; } catch (e) {}
    }

    // captions — Scene 2+ are hard-blocked while Scene 1 (intro) is still on screen,
    // so the two narrative scenes can never be visible at the same time.
    var blockCaps = document.body.classList.contains("scene1-on");
    for (var i = 0; i < caps.length; i++) {
      var c = caps[i];
      var o = blockCaps ? 0 : capOpacity(p, c.s, c.e);
      c.el.style.opacity = o.toFixed(3);
      var local = (p - c.s) / (c.e - c.s);          // 0..1 across window
      var ty = (0.5 - clamp(local, 0, 1)) * 46;       // drift +23 -> -23
      c.el.style.transform = (c.center ? "translateY(-50%) " : "") + "translateY(" + ty.toFixed(1) + "px)";
    }

    // chrome
    railfill.style.width = (p * 100).toFixed(2) + "%";
    var label = STAGES[0][1];
    for (var k = 0; k < STAGES.length; k++) { if (p >= STAGES[k][0]) label = STAGES[k][1]; }
    if (stageLabel.textContent !== label) stageLabel.textContent = label;
    if (p > 0.02) hint.classList.add("gone"); else hint.classList.remove("gone");

    requestAnimationFrame(frame);
  }

  /* ---------------- NAV hide/show ---------------- */
  var nav = $("#nav");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (y > 240 && y > lastY) nav.classList.add("hide");
    else nav.classList.remove("hide");
    lastY = y;
  }, { passive: true });

  /* ---------------- REVEAL on scroll ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        if (en.target.classList.contains("tract-bar")) {
          en.target.style.height = en.target.style.getPropertyValue("--h");
        }
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  $$(".rv").forEach(function (el) { io.observe(el); });
  $$(".tract-bar").forEach(function (el) { io.observe(el); });

  /* ---------------- ECON radial node diagram ---------------- */
  (function buildEcon() {
    var svg = $("#econSvg");
    if (!svg) return;
    var nodesG = $("#econNodes"), linesG = $("#econLines");
    var cx = 260, cy = 230, R = 132;
    var channels = ["Walk-in", "Mappatura", "Eventi", "Ricorrenti", "Referral", "Partner", "ADV locale"];
    var NS = "http://www.w3.org/2000/svg";
    var lines = [];
    channels.forEach(function (name, i) {
      var a = (-90 + i * (360 / channels.length)) * Math.PI / 180;
      var nx = cx + R * Math.cos(a), ny = cy + R * Math.sin(a);
      var ex = cx + 46 * Math.cos(a), ey = cy + 46 * Math.sin(a);
      var ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", ex); ln.setAttribute("y1", ey);
      ln.setAttribute("x2", nx); ln.setAttribute("y2", ny);
      var len = Math.hypot(nx - ex, ny - ey);
      ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
      ln.style.transition = "stroke-dashoffset .9s var(--ease) " + (0.1 + i * 0.06) + "s";
      linesG.appendChild(ln); lines.push(ln);

      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", nx); dot.setAttribute("cy", ny); dot.setAttribute("r", 6.5);
      dot.setAttribute("fill", "#0c0c0e"); dot.setAttribute("stroke", "#ed1566"); dot.setAttribute("stroke-width", "1.6");
      dot.style.opacity = 0; dot.style.transition = "opacity .5s ease " + (0.3 + i * 0.06) + "s";
      nodesG.appendChild(dot);

      var tx = nx + Math.cos(a) * 17, ty = ny + Math.sin(a) * 17 + 3.5;
      var anchor = Math.cos(a) > 0.35 ? "start" : (Math.cos(a) < -0.35 ? "end" : "middle");
      var t = document.createElementNS(NS, "text");
      t.setAttribute("x", tx); t.setAttribute("y", ty); t.setAttribute("text-anchor", anchor);
      t.setAttribute("fill", "rgba(244,244,244,0.72)"); t.setAttribute("font-family", "Raleway");
      t.setAttribute("font-weight", "600"); t.setAttribute("font-size", "10.5"); t.setAttribute("letter-spacing", "0.4");
      t.textContent = name;
      t.style.opacity = 0; t.style.transition = "opacity .5s ease " + (0.36 + i * 0.06) + "s";
      nodesG.appendChild(t);
      dot._t = t;
    });
    var eio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        lines.forEach(function (l) { l.style.strokeDashoffset = 0; });
        $$("circle", nodesG).forEach(function (c) { c.style.opacity = 1; if (c._t) c._t.style.opacity = 1; });
        $$("text", nodesG).forEach(function (t) { t.style.opacity = 1; });
        eio.disconnect();
      }
    }, { threshold: 0.3 });
    eio.observe(svg);
  })();

  /* ---------------- FRANCHISE network ---------------- */
  (function buildNetwork() {
    var svg = $("#netSvg");
    if (!svg) return;
    var nodesG = $("#netNodes"), linesG = $("#netLines");
    var NS = "http://www.w3.org/2000/svg";
    var cities = [
      { x: 70, y: 95, n: "Torino", real: true },
      { x: 190, y: 60, n: "Milano", real: true },
      { x: 300, y: 150, n: "Bologna", real: true },
      { x: 345, y: 220, n: "Firenze", real: true },
      { x: 400, y: 300, n: "Roma", hub: true, real: true },
      { x: 500, y: 372, n: "Napoli", real: true },
      // expansion / future network
      { x: 600, y: 150 }, { x: 690, y: 250 }, { x: 560, y: 90 },
      { x: 780, y: 120 }, { x: 730, y: 350 }, { x: 860, y: 230 },
      { x: 660, y: 70 }, { x: 900, y: 330 }, { x: 820, y: 400 }
    ];
    var hub = cities[4];
    var links = [];
    cities.forEach(function (c, i) {
      if (c === hub) return;
      var partner = c.real ? hub : cities[Math.max(4, i - (1 + (i % 3)))];
      if (!partner) partner = hub;
      links.push([partner, c, c.real]);
    });

    var lineEls = [];
    links.forEach(function (lk, i) {
      var a = lk[0], b = lk[1], real = lk[2];
      var ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", a.x); ln.setAttribute("y1", a.y);
      ln.setAttribute("x2", b.x); ln.setAttribute("y2", b.y);
      ln.setAttribute("stroke", real ? "rgba(237,21,102,0.45)" : "rgba(244,244,244,0.13)");
      ln.setAttribute("stroke-width", real ? "1.4" : "1");
      var len = Math.hypot(b.x - a.x, b.y - a.y);
      ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
      ln.style.transition = "stroke-dashoffset 1s var(--ease) " + (0.1 + i * 0.05) + "s";
      linesG.appendChild(ln); lineEls.push(ln);
    });

    cities.forEach(function (c, i) {
      var r = c.hub ? 9 : (c.real ? 5.5 : 3.2);
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", c.x); dot.setAttribute("cy", c.y); dot.setAttribute("r", r);
      if (c.hub) { dot.setAttribute("fill", "#ed1566"); dot.setAttribute("class", "net-hub"); }
      else if (c.real) { dot.setAttribute("fill", "#f4f4f4"); }
      else { dot.setAttribute("fill", "rgba(244,244,244,0.4)"); }
      dot.style.opacity = 0; dot.style.transition = "opacity .5s ease " + (0.25 + i * 0.05) + "s";
      nodesG.appendChild(dot);

      if (c.hub) {
        var halo = document.createElementNS(NS, "circle");
        halo.setAttribute("cx", c.x); halo.setAttribute("cy", c.y); halo.setAttribute("r", 9);
        halo.setAttribute("fill", "none"); halo.setAttribute("stroke", "#ed1566"); halo.setAttribute("class", "net-halo");
        nodesG.insertBefore(halo, dot);
      }
      if (c.real) {
        var t = document.createElementNS(NS, "text");
        t.setAttribute("x", c.x + (c.hub ? 16 : 11)); t.setAttribute("y", c.y + 4);
        t.setAttribute("fill", c.hub ? "#f4f4f4" : "rgba(244,244,244,0.7)");
        t.setAttribute("font-family", "Raleway"); t.setAttribute("font-weight", c.hub ? "800" : "600");
        t.setAttribute("font-size", c.hub ? "16" : "12.5"); t.setAttribute("letter-spacing", "0.3");
        t.textContent = c.n;
        t.style.opacity = 0; t.style.transition = "opacity .5s ease " + (0.4 + i * 0.05) + "s";
        nodesG.appendChild(t);
      }
    });

    var nio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        lineEls.forEach(function (l) { l.style.strokeDashoffset = 0; });
        $$("circle,text", nodesG).forEach(function (el) { el.style.opacity = 1; });
        nio.disconnect();
      }
    }, { threshold: 0.25 });
    nio.observe(svg);
  })();

  /* smooth anchor scrolling */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: "smooth" }); }
    });
  });
})();
