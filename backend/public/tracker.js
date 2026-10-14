(function () {
  "use strict";

  if (window.CausalFunnel) return;

  var script = document.currentScript;
  var endpoint =
    (script && script.getAttribute("data-endpoint")) ||
    (script && script.src ? new URL("/api/events", script.src).href : "/api/events");

  var SESSION_KEY = "cf_session";
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  var FLUSH_DELAY_MS = 1000;
  var MAX_BATCH = 20;
  var INTERACTIVE = "a,button,input,select,textarea,label,summary,[role=button],[role=link]";

  var queue = [];
  var timer = null;
  var lastHref = null;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function readSession() {
    try {
      var stored = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (stored && stored.id) return stored;
    } catch (_) {
      var match = document.cookie.match(new RegExp("(?:^|; )" + SESSION_KEY + "=([^;]+)"));
      if (match) {
        var parts = decodeURIComponent(match[1]).split("|");
        return { id: parts[0], last: Number(parts[1]) };
      }
    }
    return null;
  }

  function writeSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (_) {
      document.cookie =
        SESSION_KEY +
        "=" +
        encodeURIComponent(session.id + "|" + session.last) +
        "; max-age=" +
        SESSION_TIMEOUT_MS / 1000 +
        "; path=/; SameSite=Lax";
    }
  }

  function sessionId() {
    var now = Date.now();
    var session = readSession();
    if (!session || !(now - session.last < SESSION_TIMEOUT_MS)) session = { id: uuid(), last: now };
    session.last = now;
    writeSession(session);
    return session.id;
  }

  function sizes() {
    var root = document.documentElement;
    var body = document.body || root;
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        width: Math.max(root.scrollWidth, body.scrollWidth),
        height: Math.max(root.scrollHeight, body.scrollHeight),
      },
    };
  }

  function baseEvent(type) {
    var size = sizes();
    return {
      id: uuid(),
      session_id: sessionId(),
      type: type,
      url: location.href,
      timestamp: new Date().toISOString(),
      title: document.title ? document.title.slice(0, 300) : undefined,
      referrer: document.referrer || undefined,
      viewport: size.viewport,
      document: size.document,
    };
  }

  function describe(element) {
    if (!element || !element.tagName) return undefined;
    var interactive = element.closest && element.closest(INTERACTIVE);
    var target = interactive || element;
    var tag = target.tagName.toLowerCase();
    var text = /^(input|textarea|select)$/.test(tag)
      ? target.getAttribute("aria-label") || target.getAttribute("placeholder") || target.getAttribute("name")
      : target.getAttribute("aria-label") || target.textContent;
    text = (text || "").replace(/\s+/g, " ").trim();
    if (!interactive && text.length > 80) text = "";
    text = text.slice(0, 80);
    var description = { tag: tag };
    if (target.id) description.id = target.id.slice(0, 128);
    if (text) description.text = text;
    return description;
  }

  function send(events) {
    var body = JSON.stringify({ events: events });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }))) return;
    } catch (_) {}
    if (window.fetch) {
      fetch(endpoint, {
        method: "POST",
        body: body,
        headers: { "Content-Type": "text/plain" },
        keepalive: true,
        credentials: "omit",
      }).catch(function () {});
    }
  }

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    while (queue.length) send(queue.splice(0, MAX_BATCH));
  }

  function enqueue(event) {
    queue.push(event);
    if (queue.length >= MAX_BATCH) flush();
    else if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
  }

  function trackPageView() {
    var href = location.href.split("#")[0];
    if (href === lastHref) return;
    lastHref = href;
    enqueue(baseEvent("page_view"));
  }

  function trackClick(e) {
    var event = baseEvent("click");
    event.x = Math.max(0, Math.round(e.pageX));
    event.y = Math.max(0, Math.round(e.pageY));
    var target = describe(e.target);
    if (target) event.target = target;
    enqueue(event);
  }

  var pushState = history.pushState;
  history.pushState = function () {
    var result = pushState.apply(this, arguments);
    trackPageView();
    return result;
  };
  window.addEventListener("popstate", trackPageView);

  document.addEventListener("click", trackClick, true);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);

  window.CausalFunnel = {
    flush: flush,
    sessionId: sessionId,
    trackPageView: trackPageView,
  };

  trackPageView();
})();
