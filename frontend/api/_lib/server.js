import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

let supabaseAdminClient;

export function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;

  assertSupabaseConfig();

  supabaseAdminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return supabaseAdminClient;
}

export function sendJson(res, status, body, extraHeaders = {}) {
  Object.entries(jsonHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  Object.entries(extraHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return res.status(status).json(body);
}

export function methodOnly(req, res, method) {
  if (req.method === method) return true;

  res.setHeader("Allow", method);

  sendJson(res, 405, {
    success: false,
    message: "Method not allowed.",
  });

  return false;
}

export function assertSupabaseConfig() {
  const required = [
    ["SUPABASE_URL", process.env.SUPABASE_URL],
    [
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ],
    ["IP_HASH_SALT", process.env.IP_HASH_SALT],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    const error = new Error(
      `Supabase server configuration is incomplete: ${missing.join(", ")}`
    );

    error.statusCode = 500;
    error.code = "SERVER_CONFIGURATION_ERROR";
    error.missing = missing;

    throw error;
  }
}

export function assertWhatsAppConfig() {
  const required = [
    ["WHATSAPP_ACCESS_TOKEN", process.env.WHATSAPP_ACCESS_TOKEN],
    [
      "WHATSAPP_PHONE_NUMBER_ID",
      process.env.WHATSAPP_PHONE_NUMBER_ID,
    ],
    [
      "WHATSAPP_NOTIFICATION_RECIPIENT",
      process.env.WHATSAPP_NOTIFICATION_RECIPIENT,
    ],
    [
      "META_GRAPH_API_VERSION",
      process.env.META_GRAPH_API_VERSION,
    ],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    const error = new Error(
      `WhatsApp server configuration is incomplete: ${missing.join(", ")}`
    );

    error.statusCode = 500;
    error.code = "SERVER_CONFIGURATION_ERROR";
    error.missing = missing;

    throw error;
  }
}

export function clientIp(req) {
  const candidates = [
    req.headers["x-vercel-forwarded-for"],
    req.headers["x-real-ip"],
    req.headers["x-forwarded-for"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.split(",")[0].trim();
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return String(req.socket?.remoteAddress || "127.0.0.1");
  }

  const error = new Error("Unable to determine requester IP.");
  error.statusCode = 503;

  throw error;
}

export function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT;

  if (!salt) return "unknown";

  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex");
}

export function hashValue(value) {
  const salt = process.env.IP_HASH_SALT;

  if (!salt) return "unknown";

  return crypto
    .createHash("sha256")
    .update(`${salt}:${String(value)}`)
    .digest("hex");
}

export async function consumeRateLimit(
  key,
  windowSeconds,
  maxRequests
) {
  const { data, error } = await getSupabaseAdmin().rpc(
    "consume_rate_limit",
    {
      p_key: key,
      p_window_seconds: Math.max(
        1,
        Math.floor(windowSeconds)
      ),
      p_max_requests: Math.max(
        1,
        Math.floor(maxRequests)
      ),
    }
  );

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;

  return {
    allowed: Boolean(result?.allowed),
    remaining: Number(result?.remaining ?? 0),
    retryAfter: Number(
      result?.retry_after ?? windowSeconds
    ),
  };
}

export async function enforceIpRateLimit(
  req,
  endpoint,
  options = {}
) {
  const ipHash = hashIp(clientIp(req));

  const windowSeconds = Number(
    options.windowSeconds || 900
  );

  const maxRequests = Number(
    options.maxRequests || 5
  );

  const globalWindowSeconds = Number(
    options.globalWindowSeconds ||
      process.env.GLOBAL_IP_RATE_LIMIT_WINDOW_SECONDS ||
      900
  );

  const globalMaxRequests = Number(
    options.globalMaxRequests ||
      process.env.GLOBAL_IP_RATE_LIMIT_MAX_REQUESTS ||
      20
  );

  const globalPrefix =
    options.globalPrefix || "global-ip";

  const globalResult = await consumeRateLimit(
    `${globalPrefix}:${ipHash}`,
    globalWindowSeconds,
    globalMaxRequests
  );

  if (!globalResult.allowed) {
    return {
      ...globalResult,
      scope: "global-ip",
      ipHash,
    };
  }

  const endpointResult = await consumeRateLimit(
    `endpoint-ip:${endpoint}:${ipHash}`,
    windowSeconds,
    maxRequests
  );

  return {
    ...endpointResult,
    scope: endpoint,
    ipHash,
  };
}

export async function enforceIdentityRateLimit(
  identity,
  endpoint,
  options = {}
) {
  const identityHash = hashValue(identity);

  return consumeRateLimit(
    `identity:${endpoint}:${identityHash}`,
    Number(options.windowSeconds || 3600),
    Number(options.maxRequests || 3)
  );
}

export async function enforceDuplicateRateLimit(
  fingerprint,
  endpoint,
  options = {}
) {
  const fingerprintHash = hashValue(fingerprint);

  return consumeRateLimit(
    `duplicate:${endpoint}:${fingerprintHash}`,
    Number(options.windowSeconds || 600),
    Number(options.maxRequests || 1)
  );
}

export function enforceBodyLimit(
  req,
  maxBytes = 20000
) {
  const contentLength = Number(
    req.headers["content-length"] || 0
  );

  if (contentLength > maxBytes) {
    const error = new Error(
      "Request body is too large."
    );

    error.statusCode = 413;

    throw error;
  }
}

export function parseJsonBody(req) {
  if (!req.body) return {};

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    const error = new Error("Invalid JSON body.");

    error.statusCode = 400;

    throw error;
  }
}

export function cleanText(value, maxLength) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function validIndianMobile(value) {
  return /^[6-9]\d{9}$/.test(value);
}

export function validName(value) {
  return /^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(
    value
  );
}

export function safeSource(value) {
  return (
    cleanText(value, 40).replace(
      /[^a-zA-Z0-9 _.-]/g,
      ""
    ) || "website"
  );
}

export function assertAllowedOrigin(req) {
  const configured = cleanText(
    process.env.APP_ORIGIN,
    300
  ).replace(/\/$/, "");

  if (
    !configured ||
    process.env.NODE_ENV !== "production"
  ) {
    return;
  }

  const origin = cleanText(
    req.headers.origin,
    300
  ).replace(/\/$/, "");

  if (!origin || origin !== configured) {
    const error = new Error("Origin not allowed.");

    error.statusCode = 403;

    throw error;
  }
}

function normalizeWhatsAppNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Sends the request to Meta WhatsApp Cloud API.
 *
 * IMPORTANT:
 * - This function runs ONLY on the server.
 * - Access token is never exposed to React.
 * - Uses POST /PHONE_NUMBER_ID/messages.
 */
async function metaGraphRequest(payload) {
  assertWhatsAppConfig();

  const version = String(
    process.env.META_GRAPH_API_VERSION
  ).trim();

  const phoneNumberId = String(
    process.env.WHATSAPP_PHONE_NUMBER_ID
  ).trim();

  const url =
    `https://graph.facebook.com/` +
    `${encodeURIComponent(version)}/` +
    `${encodeURIComponent(phoneNumberId)}/messages`;

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,

        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),

      signal: controller.signal,
    });

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        result?.error?.message ||
          "WhatsApp provider rejected the message."
      );

      error.providerStatus = response.status;

      error.providerResponse = result;

      error.providerErrorCode =
        result?.error?.code
          ? String(result.error.code)
          : null;

      throw error;
    }

    const messageId =
      result?.messages?.[0]?.id;

    if (!messageId) {
      const error = new Error(
        "WhatsApp API returned no message ID."
      );

      error.providerStatus = response.status;
      error.providerResponse = result;

      throw error;
    }

    return result;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "WhatsApp provider request timed out."
      );

      timeoutError.providerStatus = 504;

      timeoutError.providerResponse = {
        error: {
          message:
            "Meta Graph API request timed out after 15 seconds.",
        },
      };

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Website initiated notifications should use an
 * approved WhatsApp template.
 */
export async function sendWhatsAppTemplate(
  templateName,
  parameters = [],
  language = "en_US"
) {
  if (!templateName) {
    const error = new Error(
      "WhatsApp template name is not configured."
    );

    error.statusCode = 500;
    error.code =
      "WHATSAPP_TEMPLATE_NOT_CONFIGURED";

    throw error;
  }

  const normalizedParameters =
    parameters.map((value) => ({
      type: "text",
      text: String(value ?? ""),
    }));

  return metaGraphRequest({
    messaging_product: "whatsapp",

    recipient_type: "individual",

    to: normalizeWhatsAppNumber(
      process.env.WHATSAPP_NOTIFICATION_RECIPIENT
    ),

    type: "template",

    template: {
      name: String(templateName).trim(),

      language: {
        code: String(
          language || "en_US"
        ).trim(),
      },

      ...(normalizedParameters.length
        ? {
            components: [
              {
                type: "body",

                parameters:
                  normalizedParameters,
              },
            ],
          }
        : {}),
    },
  });
}

/**
 * Kept for compatibility with any old code.
 * New enquiry/booking notifications use templates.
 */
export async function sendWhatsAppText(body) {
  return metaGraphRequest({
    messaging_product: "whatsapp",

    recipient_type: "individual",

    to: normalizeWhatsAppNumber(
      process.env.WHATSAPP_NOTIFICATION_RECIPIENT
    ),

    type: "text",

    text: {
      preview_url: false,
      body: String(body || ""),
    },
  });
}

export function requestUserAgent(req) {
  return cleanText(
    req.headers["user-agent"],
    500
  );
}

export function commonRateHeaders(result) {
  return {
    "X-RateLimit-Remaining": String(
      result.remaining
    ),

    "Retry-After": String(
      result.retryAfter
    ),
  };
}