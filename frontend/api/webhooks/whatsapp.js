import crypto from "node:crypto";

import { getSupabaseAdmin } from "../_lib/server.js";

/*
 * Meta WhatsApp webhook
 *
 *   GET  -> one-time verification when you click "Verify and save"
 *   POST -> delivery receipts: sent / delivered / read / failed
 *
 * Callback URL to paste in Meta:
 *   https://YOUR-DOMAIN/api/webhooks/whatsapp
 *
 * The raw (unparsed) body is needed to verify Meta's signature.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

/* Status can only move forward: pending -> accepted -> sent -> delivered -> read */
const ALLOWED_PREVIOUS = {
  sent: ["pending", "accepted", "sent"],
  delivered: ["pending", "accepted", "sent"],
  read: ["pending", "accepted", "sent", "delivered"],
  failed: ["pending", "accepted", "sent"],
};

const TIMESTAMP_COLUMN = {
  sent: "whatsapp_sent_at",
  delivered: "whatsapp_delivered_at",
  read: "whatsapp_read_at",
};

function queryValue(req, name) {
  const value = req.query?.[name];

  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return value == null ? "" : String(value);
}

async function readRawBody(req) {
  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  /* Platform already parsed the body: best-effort re-serialisation. */
  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function validSignature(rawBody, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;

  /* Without the App Secret we cannot verify. Warn but keep working. */
  if (!secret) {
    console.warn(
      "WHATSAPP_APP_SECRET is not set: webhook signature NOT verified."
    );

    return true;
  }

  if (!header || !String(header).startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const received = String(header).slice("sha256=".length);

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function applyStatus(statusRecord) {
  const messageId = String(statusRecord?.id || "").trim();

  const status = String(statusRecord?.status || "")
    .trim()
    .toLowerCase();

  const previous = ALLOWED_PREVIOUS[status];

  if (!messageId || !previous) {
    return false;
  }

  const when = statusRecord?.timestamp
    ? new Date(Number(statusRecord.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  const errorRecord = Array.isArray(statusRecord?.errors)
    ? statusRecord.errors[0]
    : null;

  const core = { whatsapp_status: status };

  const full = { ...core };

  if (TIMESTAMP_COLUMN[status]) {
    full[TIMESTAMP_COLUMN[status]] = when;
  }

  if (status === "failed") {
    full.whatsapp_error_code = errorRecord?.code
      ? String(errorRecord.code)
      : null;

    full.whatsapp_error_message = String(
      errorRecord?.error_data?.details ||
        errorRecord?.message ||
        errorRecord?.title ||
        "Message could not be delivered"
    ).slice(0, 500);
  }

  const supabase = getSupabaseAdmin();

  for (const table of ["bookings", "enquiries"]) {
    let { error } = await supabase
      .from(table)
      .update(full)
      .eq("whatsapp_message_id", messageId)
      .in("whatsapp_status", previous);

    /* Migration not applied yet: still save the status itself. */
    if (error) {
      console.error(
        `${table} webhook update failed, retrying core fields:`,
        error.message
      );

      ({ error } = await supabase
        .from(table)
        .update(core)
        .eq("whatsapp_message_id", messageId)
        .in("whatsapp_status", previous));

      if (error) {
        console.error(
          `${table} webhook core update failed:`,
          error.message
        );
      }
    }
  }

  console.log("WhatsApp status update:", {
    messageId,
    status,
    recipientId: statusRecord?.recipient_id || null,
    errorCode: errorRecord?.code || null,
    errorTitle: errorRecord?.title || null,
    errorDetails: errorRecord?.error_data?.details || null,
  });

  return true;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  /* ---------- META VERIFICATION ---------- */
  if (req.method === "GET") {
    const mode = queryValue(req, "hub.mode");
    const token = queryValue(req, "hub.verify_token");
    const challenge = queryValue(req, "hub.challenge");

    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && expected && token === expected) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");

      return res.status(200).send(challenge);
    }

    return res.status(403).json({
      success: false,
      message: "Webhook verification failed.",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  /* ---------- DELIVERY RECEIPTS ---------- */
  try {
    const rawBody = await readRawBody(req);

    if (!validSignature(rawBody, req.headers["x-hub-signature-256"])) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature.",
      });
    }

    let payload = {};

    try {
      payload = JSON.parse(rawBody || "{}");
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON body.",
      });
    }

    if (payload.object !== "whatsapp_business_account") {
      return res.status(200).json({ success: true, ignored: true });
    }

    let processed = 0;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        for (const status of change?.value?.statuses || []) {
          if (await applyStatus(status)) {
            processed += 1;
          }
        }
      }
    }

    return res.status(200).json({ success: true, processed });
  } catch (error) {
    console.error("WhatsApp webhook error:", error?.message || error);

    /* 500 makes Meta retry, which is what we want for DB hiccups. */
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
}