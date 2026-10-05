/*!
 * WhatsApp Chat Button (inline, non-floating)
 * Works on Android, iPhone, desktop app and WhatsApp Web.
 *
 * USAGE:
 * 1. Change CONFIG below (phone number + message).
 * 2. Add this where you want the button to appear on your page:
 *      <div id="whatsapp-button"></div>
 *      <script src="whatsapp-button.js"></script>
 *    (If the div is missing, the button is inserted right where the <script> tag is.)
 */
(function () {
  "use strict";

  // ======== CHANGE THESE ========
  var CONFIG = {
    phone: "919910108453",          // country code + number, digits only (no +, spaces, or dashes). 91 = India
    message: "Hi",                  // pre-filled message
    label: "Chat on WhatsApp",      // button text
    containerId: "whatsapp-button", // id of the element to place the button in
    openInNewTab: true,             // true = new tab on desktop
    // "wa.me"  -> universal link; opens the app on phone, and on desktop offers
    //             WhatsApp Desktop app or WhatsApp Web (recommended)
    // "web"    -> on desktop, jump straight to WhatsApp Web
    desktopMode: "wa.me"
  };
  // ==============================

  var phone = String(CONFIG.phone).replace(/\D/g, "");
  var text = encodeURIComponent(CONFIG.message);

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS
  }

  function buildUrl() {
    if (!isMobile() && CONFIG.desktopMode === "web") {
      return "https://web.whatsapp.com/send?phone=" + phone + "&text=" + text;
    }
    return "https://wa.me/" + phone + "?text=" + text;
  }

  // ---- Styles (injected once) ----
  function injectStyles() {
    if (document.getElementById("wa-btn-styles")) return;
    var css =
      ".wa-btn{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;" +
      "font:600 16px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;" +
      "padding:12px 20px;border-radius:999px;text-decoration:none;border:0;cursor:pointer;" +
      "box-shadow:0 2px 6px rgba(0,0,0,.18);transition:background .2s,transform .1s;}" +
      ".wa-btn:hover{background:#1ebe5a;color:#fff;}" +
      ".wa-btn:active{transform:scale(.97);}" +
      ".wa-btn:focus-visible{outline:3px solid #128C7E;outline-offset:2px;}" +
      ".wa-btn svg{width:22px;height:22px;fill:currentColor;flex:none;}";
    var style = document.createElement("style");
    style.id = "wa-btn-styles";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.200l-.3-.2-3 .8.8-2.9-.2-.3A8.200 8.200 0 1 1 12 20.200z"/></svg>';

  function createButton() {
    var a = document.createElement("a");
    a.className = "wa-btn";
    a.href = buildUrl();
    a.setAttribute("aria-label", CONFIG.label);
    if (CONFIG.openInNewTab) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    a.innerHTML = ICON + "<span></span>";
    a.lastChild.textContent = CONFIG.label;
    return a;
  }

  function mount() {
    injectStyles();
    var btn = createButton();
    var container = document.getElementById(CONFIG.containerId);
    if (container) {
      container.appendChild(btn);
    } else if (document.currentScript && document.currentScript.parentNode) {
      document.currentScript.parentNode.insertBefore(btn, document.currentScript);
    } else {
      document.body.appendChild(btn);
    }
  }

  // Capture currentScript now (it's null after load)
  var scriptEl = document.currentScript;
  if (!document.getElementById(CONFIG.containerId) && scriptEl) {
    var holder = document.createElement("div");
    holder.id = CONFIG.containerId;
    scriptEl.parentNode.insertBefore(holder, scriptEl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();