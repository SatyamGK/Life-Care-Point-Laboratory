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
    const error = new Error(
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`
    );
    error.status = response.status;
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

    throw error instanceof Error && error.message
      ? error
      : new Error("Unable to connect to the server. Please try again.");
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

export async function trackEvent(eventType, data = {}) {
  const payload = {
    event_type: eventType,
    page: window.location.pathname,
    source: data.source || "website",
    session_id: data.session_id || undefined,
    metadata: data.metadata || {},
  };

  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon && body.length < 60000) {
      const blob = new Blob([body], {
        type: "application/json",
      });

      if (navigator.sendBeacon(`${API_BASE}/events`, blob)) {
        return { success: true };
      }
    }

    const response = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
      body,
    });

    return readResponse(response);
  } catch {
    return { success: false };
  }
}

export function getApiBase() {
  return API_BASE;
}
