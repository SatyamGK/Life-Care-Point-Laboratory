import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function env(name) {
  const value = process.env[name];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export const supabaseAdmin = createClient(
  env("SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Send JSON response without exposing server secrets.
 */
export function sendJson(res, status, body, extraHeaders = {}) {
  Object.entries(jsonHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  Object.entries(extraHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return res.status(status).json(body);
}

/**
 * HTTP method protection.
 */
export function methodOnly(req, res, method) {
  if (req.method === method) {
    return true;
  }

  res.setHeader("Allow", method);

  sendJson(res, 405, {
    success: false,
    message: "Method not allowed.",
  });

  return false;
}

/**
 * Verify the minimum configuration required for Supabase.
 *
 * WhatsApp is intentionally NOT checked here.
 *
 * Why?
 * A database request should not fail before the record is saved
 * merely because WhatsApp configuration is missing.
 */
export function assertSupabaseConfig() {
  const required = [
    ["SUPABASE_URL", env("SUPABASE_URL")],
    ["SUPABASE_SERVICE_ROLE_KEY", env("SUPABASE_SERVICE_ROLE_KEY")],
    ["IP_HASH_SALT", env("IP_HASH_SALT")],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    const error = new Error("Required server configuration is missing.");

    error.statusCode = 500;
    error.code = "SUPABASE_SERVER_CONFIGURATION_ERROR";
    error.missingVariables = missing;

    throw error;
  }
}

/**
 * Verify WhatsApp configuration only when we actually need
 * to communicate with Meta.
 */
export function assertWhatsAppConfig() {
  const required = [
    ["WHATSAPP_ACCESS_TOKEN", env("WHATSAPP_ACCESS_TOKEN")],
    ["WHATSAPP_PHONE_NUMBER_ID", env("WHATSAPP_PHONE_NUMBER_ID")],
    [
      "WHATSAPP_NOTIFICATION_RECIPIENT",
      env("WHATSAPP_NOTIFICATION_RECIPIENT"),
    ],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    const error = new Error("WhatsApp configuration is missing.");

    error.statusCode = 503;
    error.code = "WHATSAPP_CONFIGURATION_ERROR";
    error.missingVariables = missing;

    throw error;
  }
}

/**
 * Use this only if an endpoint genuinely requires both services
 * before it starts processing.
 */
export function assertServerConfig() {
  assertSupabaseConfig();
  assertWhatsAppConfig();
}

/**
 * Vercel supplies trusted request IP headers.
 *
 * IMPORTANT:
 * Never accept an IP address from req.body.
 */
export function clientIp(req) {
  const candidates = [
    req.headers["x-vercel-forwarded-for"],
    req.headers["x-real-ip"],
    req.headers["x-forwarded-for"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const value = candidate
      .split(",")[0]
      .trim();

    if (value) {
      return value;
    }
  }

  /**
   * Local Vercel development fallback.
   */
  if (process.env.NODE_ENV !== "production") {
    return String(
      req.socket?.remoteAddress ||
      "127.0.0.1"
    );
  }

  const error = new Error(
    "Unable to determine requester IP."
  );

  error.statusCode = 503;
  error.code = "CLIENT_IP_UNAVAILABLE";

  throw error;
}

/**
 * Hash sensitive identity information before storing/using it
 * as a rate-limit key.
 */
export function hashIp(ip) {
  const salt = env("IP_HASH_SALT");

  if (!salt) {
    throw new Error("IP_HASH_SALT is not configured.");
  }

  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex");
}

export function hashValue(value) {
  const salt = env("IP_HASH_SALT");

  if (!salt) {
    throw new Error("IP_HASH_SALT is not configured.");
  }

  return crypto
    .createHash("sha256")
    .update(`${salt}:${String(value)}`)
    .digest("hex");
}

/**
 * Atomic Supabase rate limiter.
 */
export async function consumeRateLimit(
  key,
  windowSeconds,
  maxRequests
) {
  if (!key) {
    throw new Error("Rate-limit key is empty.");
  }

  const safeWindow = Math.max(
    1,
    Math.floor(Number(windowSeconds) || 1)
  );

  const safeMax = Math.max(
    1,
    Math.floor(Number(maxRequests) || 1)
  );

  const { data, error } =
    await supabaseAdmin.rpc(
      "consume_rate_limit",
      {
        p_key: key,
        p_window_seconds: safeWindow,
        p_max_requests: safeMax,
      }
    );

  if (error) {
    console.error(
      "Rate limiter database error:",
      error.message
    );

    throw error;
  }

  const result = Array.isArray(data)
    ? data[0]
    : data;

  return {
    allowed: Boolean(result?.allowed),
    remaining: Number(
      result?.remaining ?? 0
    ),
    retryAfter: Number(
      result?.retry_after ?? safeWindow
    ),
  };
}

/**
 * IP-based rate limiting.
 *
 * Uses the server-derived IP, not a client supplied value.
 */
export async function enforceIpRateLimit(
  req,
  endpoint,
  options = {}
) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  const windowSeconds = Number(
    options.windowSeconds || 900
  );

  const maxRequests = Number(
    options.maxRequests || 5
  );

  const globalWindowSeconds = Number(
    options.globalWindowSeconds ||
      env("GLOBAL_IP_RATE_LIMIT_WINDOW_SECONDS") ||
      900
  );

  const globalMaxRequests = Number(
    options.globalMaxRequests ||
      env("GLOBAL_IP_RATE_LIMIT_MAX_REQUESTS") ||
      20
  );

  const globalPrefix =
    options.globalPrefix ||
    "global-ip";

  /**
   * Global IP limit.
   */
  const globalResult =
    await consumeRateLimit(
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

  /**
   * Endpoint-specific IP limit.
   */
  const endpointResult =
    await consumeRateLimit(
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

/**
 * Mobile-number rate limiting.
 */
export async function enforceIdentityRateLimit(
  identity,
  endpoint,
  options = {}
) {
  const identityHash =
    hashValue(identity);

  return consumeRateLimit(
    `identity:${endpoint}:${identityHash}`,
    Number(
      options.windowSeconds || 3600
    ),
    Number(
      options.maxRequests || 3
    )
  );
}

/**
 * Duplicate request protection.
 */
export async function enforceDuplicateRateLimit(
  fingerprint,
  endpoint,
  options = {}
) {
  const fingerprintHash =
    hashValue(fingerprint);

  return consumeRateLimit(
    `duplicate:${endpoint}:${fingerprintHash}`,
    Number(
      options.windowSeconds || 600
    ),
    Number(
      options.maxRequests || 1
    )
  );
}

/**
 * Request body size protection.
 */
export function enforceBodyLimit(
  req,
  maxBytes = 20000
) {
  const contentLength = Number(
    req.headers["content-length"] || 0
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > maxBytes
  ) {
    const error = new Error(
      "Request body is too large."
    );

    error.statusCode = 413;
    error.code = "REQUEST_TOO_LARGE";

    throw error;
  }
}

/**
 * Safely parse request body.
 */
export function parseJsonBody(req) {
  if (!req.body) {
    return {};
  }

  if (
    typeof req.body === "object" &&
    !Buffer.isBuffer(req.body)
  ) {
    return req.body;
  }

  try {
    return JSON.parse(
      Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : req.body
    );
  } catch {
    const error = new Error(
      "Invalid JSON body."
    );

    error.statusCode = 400;
    error.code = "INVALID_JSON";

    throw error;
  }
}

/**
 * Normalize text.
 */
export function cleanText(
  value,
  maxLength
) {
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
    cleanText(value, 40)
      .replace(
        /[^a-zA-Z0-9 _.-]/g,
        ""
      ) ||
    "website"
  );
}

/**
 * Production origin protection.
 *
 * During local development we allow localhost.
 */
export function assertAllowedOrigin(req) {
  const configuredOrigin =
    cleanText(
      env("APP_ORIGIN"),
      300
    ).replace(/\/$/, "");

  /**
   * Local development.
   */
  if (
    process.env.NODE_ENV !== "production"
  ) {
    return;
  }

  /**
   * Production must have APP_ORIGIN.
   */
  if (!configuredOrigin) {
    const error = new Error(
      "APP_ORIGIN is not configured."
    );

    error.statusCode = 500;
    error.code = "APP_ORIGIN_CONFIGURATION_ERROR";

    throw error;
  }

  const origin =
    cleanText(
      req.headers.origin,
      300
    ).replace(/\/$/, "");

  /**
   * Allow same-origin requests where browsers
   * don't send Origin.
   */
  if (!origin) {
    return;
  }

  if (
    origin !== configuredOrigin
  ) {
    const error = new Error(
      "Origin not allowed."
    );

    error.statusCode = 403;
    error.code = "ORIGIN_NOT_ALLOWED";

    throw error;
  }
}

/**
 * Server-only WhatsApp Cloud API.
 *
 * The access token NEVER goes to the browser.
 */
export async function sendWhatsAppText(
  body
) {
  assertWhatsAppConfig();

  const version =
    env("META_GRAPH_API_VERSION") ||
    "v23.0";

  const phoneNumberId =
    env("WHATSAPP_PHONE_NUMBER_ID");

  const accessToken =
    env("WHATSAPP_ACCESS_TOKEN");

  const recipient =
    env(
      "WHATSAPP_NOTIFICATION_RECIPIENT"
    ).replace(/\D/g, "");

  const url =
    `https://graph.facebook.com/` +
    `${encodeURIComponent(version)}/` +
    `${encodeURIComponent(phoneNumberId)}/messages`;

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      8000
    );

  try {
    const response =
      await fetch(url, {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          messaging_product:
            "whatsapp",

          recipient_type:
            "individual",

          to: recipient,

          type: "text",

          text: {
            preview_url: false,
            body,
          },
        }),

        signal:
          controller.signal,
      });

    const result =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      const error =
        new Error(
          "WhatsApp provider rejected the message."
        );

      error.statusCode = 502;
      error.providerStatus =
        response.status;

      /**
       * Do not send provider response
       * to the browser.
       */
      error.providerResponse =
        result;

      throw error;
    }

    return result;
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      const timeoutError =
        new Error(
          "WhatsApp provider request timed out."
        );

      timeoutError.statusCode =
        504;

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function requestUserAgent(req) {
  return cleanText(
    req.headers["user-agent"],
    500
  );
}

export function commonRateHeaders(
  result
) {
  return {
    "X-RateLimit-Remaining":
      String(
        result.remaining
      ),

    "Retry-After":
      String(
        result.retryAfter
      ),
  };
}

/**
 * Safe server-side error logging.
 */
export function logServerError(
  label,
  error
) {
  console.error(label, {
    code: error?.code,
    statusCode:
      error?.statusCode,
    message:
      error?.message,
    providerStatus:
      error?.providerStatus,
  });
}