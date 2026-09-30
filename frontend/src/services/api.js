const API_BASE = "/api";

async function readResponse(response) {
  const type = response.headers.get("content-type") || "";
  let data = null;

  if (type.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const error = new Error( data?.message || data?.error || `Request failed (${response.status})` );

    error.status = response.status;
    error.code = data?.code;
    error.payload = data;

    throw error;
  }

  return data || { success: true };
}

async function post(path, payload) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return await readResponse(response);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "The request timed out. Please check your connection and try again."
      );
    }

    throw error instanceof Error && error.message ? error : new Error("Unable to connect to the server. Please try again.");
  } finally {
    window.clearTimeout(timer);
  }
}

export function submitEnquiry(data) {
  return post("/enquiries", data);
}

export function submitBooking(data) {
  return post("/bookings", data);
}

export function trackEvent(eventType, data = {}) {
  const allowedEvents = new Set([
    "whatsapp_click",
    "call_click",
    "booking_submit",
    "enquiry_submit",
    "test_view",
    "package_view",
  ]);

  if (!allowedEvents.has(eventType)) {
    return Promise.resolve({
      success: false,
      message: "Unsupported analytics event.",
    });
  }

  const payload = {
    event_type: eventType,
    page: typeof window !== "undefined" ? window.location.pathname.slice(0, 300) : "/",
    source: String(data.source || "website").slice(0, 100),
    session_id: data.session_id ? String(data.session_id).slice(0, 128) : undefined,
    metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {},
  };

  const body = JSON.stringify(payload);

  try {
    if ( typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function" && body.length < 60000 ) {
      const blob = new Blob([body], {
        type: "application/json",
      });

      const accepted = navigator.sendBeacon(
        `${API_BASE}/events`,
        blob
      );

      if (accepted) {
        return Promise.resolve({
          success: true,
          queued: true,
        });
      }
    }
  } catch {
    // Fall through to fetch.
  }

  // Fallback for browsers that reject the beacon.
  return fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    keepalive: true,
    body,
  })
    .then(readResponse)
    .catch(() => ({
      success: false,
    }));
}

export function getApiBase() {
  return API_BASE;
}
