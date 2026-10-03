import {
  getSupabaseAdmin,
  sendJson,
} from "../_lib/server.js";

function queryValue(req, name) {
  const value =
    req.query?.[name];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value == null
    ? ""
    : String(value);
}

function bodyObject(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

async function updateMessageStatus(
  statusRecord
) {
  const messageId =
    String(
      statusRecord?.id || ""
    ).trim();

  const status =
    String(
      statusRecord?.status || ""
    )
      .trim()
      .toLowerCase();

  if (!messageId || !status) {
    return;
  }

  const timestamp =
    statusRecord?.timestamp
      ? new Date(
          Number(
            statusRecord.timestamp
          ) * 1000
        ).toISOString()
      : new Date().toISOString();

  const errorRecord =
    Array.isArray(
      statusRecord?.errors
    )
      ? statusRecord.errors[0]
      : null;

  const update = {
    whatsapp_status:
      status,

    whatsapp_error_code:
      errorRecord?.code
        ? String(
            errorRecord.code
          )
        : null,

    whatsapp_error_message:
      errorRecord?.title ||
      errorRecord?.message ||
      null,
  };

  if (status === "sent") {
    update.whatsapp_sent_at =
      timestamp;
  }

  if (status === "delivered") {
    update.whatsapp_delivered_at =
      timestamp;
  }

  if (status === "read") {
    update.whatsapp_read_at =
      timestamp;
  }

  const supabase =
    getSupabaseAdmin();

  const [
    bookingResult,
    enquiryResult,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .update(update)
      .eq(
        "whatsapp_message_id",
        messageId
      ),

    supabase
      .from("enquiries")
      .update(update)
      .eq(
        "whatsapp_message_id",
        messageId
      ),
  ]);

  if (bookingResult.error) {
    console.error(
      "WhatsApp booking webhook update error:",
      bookingResult.error.message
    );
  }

  if (enquiryResult.error) {
    console.error(
      "WhatsApp enquiry webhook update error:",
      enquiryResult.error.message
    );
  }

  console.log(
    "WhatsApp status update:",
    {
      messageId,
      status,

      recipientId:
        statusRecord?.recipient_id ||
        null,

      errorCode:
        errorRecord?.code ||
        null,

      errorTitle:
        errorRecord?.title ||
        null,
    }
  );
}

/* =========================================================
   WEBHOOK HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  /* -----------------------------------------
     META VERIFICATION
  ----------------------------------------- */

  if (req.method === "GET") {
    const mode =
      queryValue(
        req,
        "hub.mode"
      );

    const token =
      queryValue(
        req,
        "hub.verify_token"
      );

    const challenge =
      queryValue(
        req,
        "hub.challenge"
      );

    const verifyToken =
      String(
        process.env
          .WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
          ""
      ).trim();

    if (
      mode === "subscribe" &&
      token &&
      verifyToken &&
      token === verifyToken
    ) {
      /*
       * Meta requires the challenge
       * as plain text with HTTP 200.
       */
      return res
        .status(200)
        .send(challenge);
    }

    return res
      .status(403)
      .json({
        success: false,
        message:
          "Webhook verification failed.",
      });
  }

  /* -----------------------------------------
     ONLY POST AFTER VERIFICATION
  ----------------------------------------- */

  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "GET, POST"
    );

    return sendJson(
      res,
      405,
      {
        success: false,
        message:
          "Method not allowed.",
      }
    );
  }

  try {
    const payload =
      bodyObject(req);

    /*
     * Ignore non-WhatsApp webhook payloads.
     */
    if (
      payload.object !==
      "whatsapp_business_account"
    ) {
      return sendJson(
        res,
        200,
        {
          success: true,
          ignored: true,
        }
      );
    }

    const statusRecords = [];

    for (
      const entry of
      payload.entry || []
    ) {
      for (
        const change of
        entry.changes || []
      ) {
        const statuses =
          change?.value
            ?.statuses || [];

        for (
          const status of
          statuses
        ) {
          statusRecords.push(
            status
          );
        }
      }
    }

    for (
      const status of
      statusRecords
    ) {
      await updateMessageStatus(
        status
      );
    }

    return sendJson(
      res,
      200,
      {
        success: true,

        processed:
          statusRecords.length,
      }
    );
  } catch (error) {
    console.error(
      "WhatsApp webhook processing error:",
      error?.message || error
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        message:
          "Webhook processing failed.",
      }
    );
  }
}