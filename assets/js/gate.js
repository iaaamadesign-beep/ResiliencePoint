/* ============================================================
   RESILIENCE POINT — Private investor access gate
   ------------------------------------------------------------
   Change the password here:
   ============================================================ */
const ACCESS_PASSWORD = "resilience2026";
/* ============================================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "rp_investor_access";
  var html = document.documentElement;
  var gate = document.getElementById("gate");
  if (!gate) return;

  var form  = document.getElementById("gateForm");
  var input = document.getElementById("gateInput");
  var field = document.getElementById("gateField");
  var error = document.getElementById("gateError");
  var btn   = document.getElementById("gateBtn");

  function alreadyAuthed() {
    try { return sessionStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; }
  }
  function remember() {
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
  }

  // Remove the gate immediately (returning visitor within the session).
  function unlockInstant() {
    html.classList.remove("gate-active");
    if (gate.parentNode) gate.parentNode.removeChild(gate);
  }

  // Cinematic unlock: fade content out → fade to black → fade up into the experience.
  function unlockCinematic() {
    remember();
    if (btn) { btn.setAttribute("disabled", "true"); btn.textContent = "Accesso consentito"; }
    gate.classList.add("unlocking");
    setTimeout(function () {
      html.classList.remove("gate-active");
      window.scrollTo(0, 0);
      gate.classList.add("hidden");
    }, 1000);
    setTimeout(function () {
      if (gate.parentNode) gate.parentNode.removeChild(gate);
    }, 1900);
  }

  function fail() {
    field.classList.remove("shake");
    void field.offsetWidth;          // restart the animation
    field.classList.add("shake");
    error.classList.add("show");
    input.value = "";
    try { input.focus(); } catch (e) {}
    clearTimeout(fail._t);
    fail._t = setTimeout(function () { error.classList.remove("show"); }, 2800);
  }

  // Returning this session → skip the gate entirely.
  if (alreadyAuthed()) { unlockInstant(); return; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var val = (input.value || "").trim();
    if (val.toLowerCase() === ACCESS_PASSWORD.toLowerCase()) {
      unlockCinematic();
    } else {
      fail();
    }
  });

  // Autofocus on pointer devices only (avoids forcing the keyboard open on mobile).
  if (!("ontouchstart" in window) && !navigator.maxTouchPoints) {
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 450);
  }
})();
