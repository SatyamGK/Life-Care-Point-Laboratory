import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

let supabaseAdminClient = null;

/* =========================================================
   SUPABASE
========================================================= */

export function getSupabaseAdmin() {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

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

export function assertSupabaseConfig() {
  const required = [
    ["SUPABASE_URL", process.env.SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
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

/* =========================================================
   WHATSAPP CONFIG
========================================================= */

export function assertWhatsAppConfig() {
  const required = [
    ["WHATSAPP_ACCESS_TOKEN", process.env.WHATSAPP_ACCESS_TOKEN],
    ["WHATSAPP_PHONE_NUMBER_ID", process.env.WHATSAPP_PHONE_NUMBER_ID],
    [
      "WHATSAPP_NOTIFICATION_RECIPIENT",
      process.env.WHATSAPP_NOTIFICATION_RECIPIENT,
    ],
    ["META_GRAPH_API_VERSION", process.env.META_GRAPH_API_VERSION],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    const error = new Error(
      `WhatsApp server configuration is incomplete: ${missing.join(", ")}`
    );

    error.statusCode = 500;
    error.code = "WHATSAPP_CONFIGURATION_ERROR";
    error.missing = missing;

    throw error;
  }
}

/* =========================================================
   RESPONSE HELPERS
========================================================= */

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

/* =========================================================
   REQUEST / VALIDATION HELPERS
========================================================= */

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

export function requestUserAgent(req) {
  return cleanText(req.headers["user-agent"], 500);
}

export function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT;

  if (!salt) {
    return "unknown";
  }

  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex");
}

export function hashValue(value) {
  const salt = process.env.IP_HASH_SALT;

  if (!salt) {
    return "unknown";
  }

  return crypto
    .createHash("sha256")
    .update(`${salt}:${String(value)}`)
    .digest("hex");
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
  return /^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(value);
}

export function safeSource(value) {
  return (
    cleanText(value, 40).replace(/[^a-zA-Z0-9 _.-]/g, "") ||
    "website"
  );
}

export function enforceBodyLimit(req, maxBytes = 20000) {
  const contentLength = Number(
    req.headers["content-length"] || 0
  );

  if (contentLength > maxBytes) {
    const error = new Error("Request body is too large.");
    error.statusCode = 413;

    throw error;
  }
}

export function parseJsonBody(req) {
  if (!req.body) {
    return {};
  }

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

export function assertAllowedOrigin(req) {
  const configured = cleanText(
    process.env.APP_ORIGIN,
    300
  ).replace(/\/$/, "");

  if (!configured || process.env.NODE_ENV !== "production") {
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

/* =========================================================
   RATE LIMITING
========================================================= */

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

  if (error) {
    throw error;
  }

  const result = Array.isArray(data)
    ? data[0]
    : data;

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

/* =========================================================
   WHATSAPP CLOUD API
   Template-first delivery (works outside the 24-hour window)
========================================================= */

/*
 * WHY TEMPLATES?
 * WhatsApp only delivers a free-form text message if the recipient has
 * messaged the business number within the last 24 hours. Otherwise Meta
 * still answers "200 OK + message id" (so the website shows success) and
 * then drops the message later with error 131047. A business-initiated
 * notification therefore MUST be an approved template message.
 */

const TEMPLATE_PARAM_MAX_LENGTH = 1000;

/* Meta wants country code + number, digits only. */
export function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");

  /* 10-digit Indian number saved without country code -> add 91 */
  if (digits.length === 10) {
    return `91${digits}`;
  }

  /* 0XXXXXXXXXX -> 91XXXXXXXXXX */
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}

/*
 * Template variables may not contain new lines, tabs or runs of
 * 4+ spaces (Meta error 132018) and may not be empty (132000).
 */
function templateParam(value) {
  return (
    String(value ?? "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/ {2,}/g, " ")
      .trim()
      .slice(0, TEMPLATE_PARAM_MAX_LENGTH) || "-"
  );
}

/*
 * The notification recipient must be a DIFFERENT phone from the
 * WhatsApp Business (sender) number. A business number cannot
 * message itself.
 */
function assertRecipientIsNotSender(recipient) {
  const sender = normalizeWhatsAppNumber(
    process.env.WHATSAPP_BUSINESS_NUMBER
  );

  if (sender && recipient && sender === recipient) {
    const error = new Error(
      "WHATSAPP_NOTIFICATION_RECIPIENT is the same as the WhatsApp " +
        "Business sender number. Set it to a different personal/staff " +
        "WhatsApp number."
    );

    error.statusCode = 500;
    error.code = "WHATSAPP_RECIPIENT_IS_SENDER";

    throw error;
  }
}

function getRecipient() {
  const recipient = normalizeWhatsAppNumber(
    process.env.WHATSAPP_NOTIFICATION_RECIPIENT
  );

  if (!recipient) {
    const error = new Error(
      "WhatsApp notification recipient is not configured."
    );

    error.statusCode = 500;
    error.code = "WHATSAPP_RECIPIENT_NOT_CONFIGURED";

    throw error;
  }

  assertRecipientIsNotSender(recipient);

  return recipient;
}

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
  }, 8000);

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${String(
          process.env.WHATSAPP_ACCESS_TOKEN
        ).trim()}`,

        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),

      signal: controller.signal,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const details = result?.error?.error_data?.details;

      const error = new Error(
        [
          result?.error?.message ||
            "WhatsApp provider rejected the message.",
          details,
        ]
          .filter(Boolean)
          .join(" - ")
      );

      error.providerStatus = response.status;
      error.providerResponse = result;

      error.providerErrorCode = result?.error?.code
        ? String(result.error.code)
        : null;

      error.providerErrorType = result?.error?.type || null;

      error.providerErrorSubcode = result?.error?.error_subcode
        ? String(result.error.error_subcode)
        : null;

      throw error;
    }

    const messageId = result?.messages?.[0]?.id;

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
            "Meta Graph API request timed out after 8 seconds.",
        },
      };

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/*
 * Approved TEMPLATE message.
 * Delivered at any time (no 24-hour window needed).
 */
export async function sendWhatsAppTemplate(
  templateName,
  parameters = [],
  language = "en_US"
) {
  const name = String(templateName || "").trim();

  if (!name) {
    const error = new Error(
      "WhatsApp template name is not configured."
    );

    error.statusCode = 500;
    error.code = "WHATSAPP_TEMPLATE_NOT_CONFIGURED";

    throw error;
  }

  const recipient = getRecipient();

  const bodyParameters = parameters.map((value) => ({
    type: "text",
    text: templateParam(value),
  }));

  return metaGraphRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "template",
    template: {
      name,

      language: {
        code: String(language || "en_US").trim(),
      },

      ...(bodyParameters.length
        ? {
            components: [
              {
                type: "body",
                parameters: bodyParameters,
              },
            ],
          }
        : {}),
    },
  });
}

/*
 * Free-form TEXT message.
 * Only delivered if the recipient messaged the business number
 * during the last 24 hours. Used as a fallback only.
 */
export async function sendWhatsAppText(body) {
  const recipient = getRecipient();

  const message = String(body || "").trim();

  if (!message) {
    const error = new Error(
      "WhatsApp message cannot be empty."
    );

    error.statusCode = 400;
    error.code = "WHATSAPP_MESSAGE_EMPTY";

    throw error;
  }

  return metaGraphRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  });
}

/*
 * Template first. If no template is configured, or the template
 * request is rejected, fall back to a plain text message.
 */
export async function sendWhatsAppNotification({
  templateName,
  parameters = [],
  language,
  fallbackText,
}) {
  const templateLanguage =
    language ||
    process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
    "en_US";

  if (templateName) {
    try {
      const result = await sendWhatsAppTemplate(
        templateName,
        parameters,
        templateLanguage
      );

      return {
        mode: "template",
        messageId: result.messages[0].id,
        result,
      };
    } catch (templateError) {
      console.error("WhatsApp template send failed:", {
        template: templateName,
        language: templateLanguage,
        code: templateError?.providerErrorCode || templateError?.code,
        message: templateError?.message,
      });

      if (!fallbackText) {
        throw templateError;
      }

      try {
        const result = await sendWhatsAppText(fallbackText);

        return {
          mode: "text-fallback",
          messageId: result.messages[0].id,
          result,
        };
      } catch (textError) {
        /* Report the template error: it is the actionable one. */
        templateError.fallbackError = textError?.message;

        throw templateError;
      }
    }
  }

  console.warn(
    "No WhatsApp template configured: sending plain text. " +
      "Plain text is only delivered inside the 24-hour customer " +
      "service window. Configure an approved template."
  );

  const result = await sendWhatsAppText(fallbackText);

  return {
    mode: "text",
    messageId: result.messages[0].id,
    result,
  };
}

/*
 * Tries each payload in order until one really updates the row.
 * Every failure is logged with the exact database error, so a row stuck
 * on "pending" always leaves a reason in the Vercel function logs.
 */
async function updateRowWithFallback(table, rowId, payloads) {
  const supabase = getSupabaseAdmin();

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", rowId)
      .select("id");

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }

    console.error(`${table} row update failed`, {
      rowId,
      fields: Object.keys(payload),
      dbCode: error?.code,
      dbMessage: error?.message,
      dbDetails: error?.details,
      rowsUpdated: Array.isArray(data) ? data.length : 0,
    });
  }

  return false;
}

/*
 * Sends the notification and records the outcome on the
 * bookings / enquiries row.
 *
 * "sent" = Meta accepted the request. It is NOT yet delivery.
 * The webhook (/api/webhooks/whatsapp) later moves it to
 * delivered -> read, or to failed with Meta's reason.
 */
export async function dispatchWhatsAppNotification({
  table,
  rowId,
  templateName,
  parameters,
  fallbackText,
}) {
  try {
    const { messageId, mode } = await sendWhatsAppNotification({
      templateName,
      parameters,
      fallbackText,
    });

    console.log(`${table} WhatsApp accepted by Meta:`, {
      rowId,
      messageId,
      mode,
    });

    await updateRowWithFallback(table, rowId, [
      {
        whatsapp_status: "sent",
        whatsapp_message_id: messageId,
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_error_code: null,
        whatsapp_error_message: null,
      },
      /* migration not applied yet */
      {
        whatsapp_status: "sent",
        whatsapp_message_id: messageId,
      },
      /* e.g. a CHECK constraint rejected the status value */
      {
        whatsapp_message_id: messageId,
      },
    ]);

    return { ok: true, messageId, mode };
  } catch (error) {
    const errorCode =
      error?.providerErrorCode || error?.code || null;

    const errorMessage = String(
      error?.providerResponse?.error?.message ||
        error?.message ||
        "Unknown WhatsApp error"
    ).slice(0, 500);

    console.error(`${table} WhatsApp notification failed:`, {
      rowId,
      providerStatus: error?.providerStatus,
      providerErrorCode: error?.providerErrorCode,
      providerErrorType: error?.providerErrorType,
      providerErrorSubcode: error?.providerErrorSubcode,
      code: error?.code,
      message: error?.message,
      fallbackError: error?.fallbackError,
      providerResponse: error?.providerResponse,
    });

    await updateRowWithFallback(table, rowId, [
      {
        whatsapp_status: "failed",
        whatsapp_error_code: errorCode,
        whatsapp_error_message: errorMessage,
      },
      { whatsapp_status: "failed" },
    ]);

    return { ok: false, error };
  }
}