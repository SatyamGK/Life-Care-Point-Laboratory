import {
  assertSupabaseConfig,
  assertAllowedOrigin,
  cleanText,
  commonRateHeaders,
  enforceIpRateLimit,
  enforceBodyLimit,
  clientIp,
  hashIp,
  methodOnly,
  parseJsonBody,
  requestUserAgent,
  safeSource,
  sendJson,
  supabaseAdmin,
} from "./_lib/server.js";

const ALLOWED_EVENTS = new Set([
  "whatsapp_click",
  "call_click",
  "booking_submit",
  "enquiry_submit",
  "test_view",
  "package_view",
]);

export default async function handler(req, res) {
  if (!methodOnly(req, res, "POST")) return;

  try {
    assertSupabaseConfig();
    enforceBodyLimit(req, 12000);
    assertAllowedOrigin(req);

    const rateLimit = await enforceIpRateLimit(req, "event", {
      windowSeconds: Number(process.env.EVENT_RATE_LIMIT_WINDOW_SECONDS || 60),
      maxRequests: Number(process.env.EVENT_RATE_LIMIT_MAX_REQUESTS || 30),
      globalWindowSeconds: Number(process.env.GLOBAL_IP_RATE_LIMIT_WINDOW_SECONDS || 900),
      globalMaxRequests: Number(process.env.GLOBAL_EVENT_RATE_LIMIT_MAX_REQUESTS || 60),
      globalPrefix: "global-event-ip",
    });

    if (!rateLimit.allowed) {
      return sendJson(
        res,
        429,
        { success: false, message: "Too many requests." },
        commonRateHeaders(rateLimit)
      );
    }

    const data = parseJsonBody(req);
    const eventType = cleanText(data.eventType, 40);
    const page = cleanText(data.page, 200);
    const source = safeSource(data.source);
    const sessionId = cleanText(data.sessionId, 100);
    const metadata =
      data.metadata && typeof data.metadata === "object"
        ? JSON.parse(JSON.stringify(data.metadata))
        : {};

    if (!ALLOWED_EVENTS.has(eventType)) {
      return sendJson(res, 400, {
        success: false,
        message: "Unsupported event type.",
      });
    }

    const { error } = await supabaseAdmin
      .from("interaction_events")
      .insert({
        event_type: eventType,
        page,
        source,
        session_id: sessionId || null,
        user_agent: requestUserAgent(req),
        ip_hash: hashIp(
          clientIp(req)
        ),
        metadata,
      });

    if (error) {
      console.error("Event tracking error:", error.message);
      return sendJson(res, 500, {
        success: false,
        message: "Event could not be recorded.",
      });
    }

    return sendJson(
      res,
      200,
      { success: true },
      commonRateHeaders(rateLimit)
    );
  } catch (error) {
    console.error("Event API error:", error?.message || error);
    return sendJson(res, error?.statusCode || 500, {
      success: false,
      message:
        error?.statusCode === 413
          ? "Request payload is too large."
          : "Unable to record event.",
    });
  }
}
