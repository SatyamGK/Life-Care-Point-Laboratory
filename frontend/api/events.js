import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_EVENTS = new Set([
  "whatsapp_click",
  "call_click",
  "booking_submit",
  "enquiry_submit",
  "test_view",
  "package_view",
]);

const MAX_BODY_BYTES = 64 * 1024;
const EVENT_RATE_WINDOW = Number(
  process.env.EVENT_RATE_LIMIT_WINDOW_SECONDS || 60
);
const EVENT_RATE_MAX = Number(
  process.env.EVENT_RATE_LIMIT_MAX_REQUESTS || 30
);

let adminClient;

function getAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase server configuration is incomplete."
    );
  }

  adminClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}

function getClientIp(req) {
  const forwarded =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-vercel-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim().slice(0, 100);
  }

  return ( req.socket?.remoteAddress || "unknown" ).slice(0, 100);
}

function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT;

  if (!salt) {
    throw new Error("IP_HASH_SALT is not configured.");
  }

  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex");
}

function safeUserAgent(req) {
  return String(req.headers["user-agent"] || "")
    .slice(0, 500);
}

function jsonBodySize(body) {
  try {
    return Buffer.byteLength(JSON.stringify(body ?? {}), "utf8");
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

function setCommonHeaders(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}

function rateLimitResponse(res, retryAfter) {
  const retry = Math.max(1, Number(retryAfter) || 60);

  res.setHeader("Retry-After", String(retry));

  return res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
}

async function consumeRateLimit(supabase, key) {
  const { data, error } = await supabase.rpc(
    "consume_rate_limit",
    {
      p_key: key,
      p_window_seconds: EVENT_RATE_WINDOW,
      p_max_requests: EVENT_RATE_MAX,
    }
  );

  if (error) {
    const wrapped = new Error(
      `Rate limiter failed: ${error.message}`
    );

    wrapped.code = error.code;
    wrapped.details = error.details;
    wrapped.hint = error.hint;

    throw wrapped;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: row?.allowed !== false,
    retryAfter: Number(row?.retry_after || EVENT_RATE_WINDOW),
  };
}

function validatePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid request body.";
  }

  if (!ALLOWED_EVENTS.has(body.event_type)) {
    return "Invalid event type.";
  }

  if (
    body.page !== undefined &&
    typeof body.page !== "string"
  ) {
    return "Invalid page.";
  }

  if (
    body.source !== undefined &&
    typeof body.source !== "string"
  ) {
    return "Invalid source.";
  }

  if (
    body.session_id !== undefined &&
    body.session_id !== null &&
    typeof body.session_id !== "string"
  ) {
    return "Invalid session.";
  }

  if (
    body.metadata !== undefined &&
    (
      body.metadata === null ||
      typeof body.metadata !== "object" ||
      Array.isArray(body.metadata)
    )
  ) {
    return "Invalid metadata.";
  }

  return null;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const output = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(output).length >= 20) break;

    const safeKey = String(key).slice(0, 50);

    if ( typeof value === "string" || typeof value === "number" || typeof value === "boolean" ) {
      output[safeKey] = typeof value === "string" ? value.slice(0, 300) : value;
    }
  }

  return output;
}

export default async function handler(req, res) {
  setCommonHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    if (jsonBodySize(req.body) > MAX_BODY_BYTES) {
      return res.status(413).json({
        success: false,
        message: "Request body is too large.",
      });
    }

    const validationError = validatePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const supabase = getAdminClient();

    const ipHash = hashIp(getClientIp(req));

    const rate = await consumeRateLimit(
      supabase,
      `events:${ipHash}`
    );

    if (!rate.allowed) {
      return rateLimitResponse(
        res,
        rate.retryAfter
      );
    }

    const eventType = req.body.event_type;

    const row = {
      event_type: eventType,
      page: String(req.body.page || "/").slice(0, 300),
      source: String(req.body.source || "website").slice(0, 100),
      session_id: req.body.session_id ? String(req.body.session_id).slice(0, 128) : null,
      user_agent: safeUserAgent(req),
      ip_hash: ipHash,
      metadata: sanitizeMetadata(req.body.metadata),
    };

    const { error } = await supabase
      .from("interaction_events")
      .insert(row);

    if (error) {
      console.error("interaction_events insert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        eventType,
      });

      return res.status(500).json({
        success: false,
        message: "Unable to record this interaction.",
      });
    }

    return res.status(201).json({
      success: true,
      recorded: true,
    });
  } catch (error) {
    console.error("events API failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });

    return res.status(500).json({
      success: false,
      message: "Unable to record this interaction.",
    });
  }
}
