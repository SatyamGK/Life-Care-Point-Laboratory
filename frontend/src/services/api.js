const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/$/, "");

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    let message = result.message;

    if (!message && response.status === 404) {
      message =
        "The API endpoint was not found. For local testing, start the project with `npx vercel dev` instead of `npm run dev`.";
    } else if (!message && response.status >= 500) {
      message =
        "The server could not process the request. Check the server environment variables and terminal logs.";
    } else if (!message) {
      message = "Unable to process your request.";
    }

    const error = new Error(message);
    error.status = response.status;
    error.stored = Boolean(result.stored);
    error.code = result.code || null;
    throw error;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The API returned a non-JSON response. For local testing, start the project with `npx vercel dev`."
    );
  }

  return result;
}

async function post(path, data) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export function submitBooking(data) {
  return post("/bookings", data);
}

export function submitEnquiry(data) {
  return post("/enquiries", data);
}

let sessionId = sessionStorage.getItem("lcp_session_id");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  sessionStorage.setItem("lcp_session_id", sessionId);
}

export function trackEvent(eventType, metadata = {}) {
  const payload = {
    eventType,
    page: `${window.location.pathname}${window.location.search}`,
    source: "website",
    sessionId,
    metadata,
  };

  const body = JSON.stringify(payload);
  const url = `${API_BASE_URL}/events`;

  // keepalive allows a click event to reach the API even when the browser
  // immediately follows a tel:/navigation link.
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([body], {
        type: "application/json",
      });
      if (navigator.sendBeacon(url, blob)) return;
    } catch {
      // Fall back to fetch below.
    }
  }

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never block the user's primary action.
  });
}
