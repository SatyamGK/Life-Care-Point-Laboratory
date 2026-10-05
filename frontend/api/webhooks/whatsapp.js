/*!
 * WhatsApp Chat Button (inline, not floating)
 * Plain https link = most reliable on Android, iPhone, desktop app and WhatsApp Web.
 *
 * USAGE:
 *   <div id="whatsapp-button"></div>
 *   <script src="whatsapp-button.js?v=4"></script>
 */
(function () {
  "use strict";

  // ======== CHANGE THESE ========
  var PHONE   = "919910108453; // country code + number, digits only (91 = India). NOT your own testing number
  var MESSAGE = "Hi";           // pre-filled message
  var LABEL   = "Chat on WhatsApp";
  var CONTAINER_ID = "whatsapp-button";
  var NEW_TAB = true;
  // ==============================

  var phone = String(PHONE).replace(/\D/g, "");
  var url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(MESSAGE);

  var scriptEl = document.currentScript;

  function mount() {
    // styles
    if (!document.getElementById("wa-btn-styles")) {
      var st = document.createElement("style");
      st.id = "wa-btn-styles";
      st.textContent =
        ".wa-btn{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;" +
        "font:600 16px/1 Arial,Helvetica,sans-serif;padding:12px 20px;border-radius:999px;" +
        "text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:background .2s;}" +
        ".wa-btn:hover{background:#1ebe5a;color:#fff;}" +
        ".wa-btn svg{width:22px;height:22px;fill:currentColor;flex:none;}";
      document.head.appendChild(st);
    }

    // button
    var a = document.createElement("a");
    a.className = "wa-btn";
    a.href = url;
    a.setAttribute("aria-label", LABEL);
    if (NEW_TAB) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    a.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.5 14.2c-.2.7-1.300 1.300-1.800 1.300-.5.1-1.100.1-1.800-.1-.4-.1-1-.3-1.700-.6-3-1.300-4.900-4.300-5-4.500-.1-.2-1.200-1.600-1.200-3s.7-2.100 1-2.400c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500.2.600.8 2 .9 2.200.1.1.1.3 0 .5l-.4.600c-.1.100-.3.300-.1.600.2.300.7 1.100 1.500 1.800 1 .9 1.800 1.200 2.100 1.300.3.100.4.100.6-.1l.8-1c.2-.2.400-.2.600-.1l2 1c.3.100.5.2.5.300.1.200.1.700-.1 1.400z"/></svg><span></span>';
    a.lastChild.textContent = LABEL;

    var box = document.getElementById(CONTAINER_ID);
    if (box) {
      box.appendChild(a);
    } else if (scriptEl && scriptEl.parentNode) {
      scriptEl.parentNode.insertBefore(a, scriptEl);
    } else {
      document.body.appendChild(a);
    }

    // Helps debugging: open browser console (F12) to see the exact link being used
    if (window.console) console.log("WhatsApp button link:", url);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();