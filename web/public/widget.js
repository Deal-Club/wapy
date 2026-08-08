/* Wapy — loader du widget chatbot à intégrer sur un site tiers.
   Usage : <script src="https://.../widget.js" data-wapy="wk_xxx" async></script>
   Crée une bulle en bas à droite qui ouvre une iframe (servie par notre domaine,
   donc appels API same-origin — pas de CORS, pas de fuite de données). */
(function () {
  var s = document.currentScript;
  var key = s && s.getAttribute("data-wapy");
  if (!key || window.__wapyWidget) return;
  window.__wapyWidget = true;
  var origin = new URL(s.src).origin;
  var open = false;

  var frame = document.createElement("iframe");
  frame.src = origin + "/widget?k=" + encodeURIComponent(key);
  frame.title = "Assistant";
  frame.style.cssText =
    "position:fixed;bottom:92px;right:20px;width:380px;height:560px;" +
    "max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);border:none;" +
    "border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);z-index:2147483000;" +
    "display:none;background:#fff;";

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Ouvrir le chat");
  btn.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;" +
    "border:none;cursor:pointer;background:#12b76a;color:#fff;font-size:26px;" +
    "box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:2147483001;display:flex;" +
    "align-items:center;justify-content:center;transition:transform .15s;";
  btn.textContent = "💬";
  btn.onmouseenter = function () { btn.style.transform = "scale(1.06)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };
  btn.addEventListener("click", function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
    btn.textContent = open ? "✕" : "💬";
  });

  function mount() {
    document.body.appendChild(frame);
    document.body.appendChild(btn);
  }
  if (document.body) mount();
  else window.addEventListener("DOMContentLoaded", mount);
})();
