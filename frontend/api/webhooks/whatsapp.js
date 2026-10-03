import {
  getSupabaseAdmin,
  sendJson,
} from "../_lib/server.js";

function getQueryValue(req, name) {
  const value = req.query?.[name];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value == null
    ? ""
    : String(value);
}

function getBody(req) {
  if (!req.body) return {};

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

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  /*
   * META WEBHOOK VERIFICATION
   *
   * Meta sends:
   * GET ?hub.mode=subscribe
   *     &hub.verify_token=...
   *     &hub.challenge=...
   */

//   if (req.method === "GET") {
//     const mode =
//       getQueryValue(
//         req,
//         "hub.mode"
//       );

//     const token =
//       getQueryValue(
//         req,
//         "hub.verify_token"
//       );

//     const challenge =
//       getQueryValue(
//         req,
//         "hub.challenge"
//       );

//     if (
//       mode === "subscribe" &&
//       token &&
//       process.env
//         .WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
//       token ===
//         process.env
//           .WHATSAPP_WEBHOOK_VERIFY_TOKEN
//     ) {
//       return res
//         .status(200)
//         .send(challenge);
//     }

//     return res
//       .status(403)
//       .json({
//         success: false,
//         message:
//           "Webhook verification failed.",
//       });
//   }

// export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (
      mode === "subscribe" &&
      token === verifyToken
    ) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({
      success: false,
      message: "Webhook verification failed.",
    });
  }

  // POST webhook handling...
// }

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
      getBody(req);

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

    let processed = 0;

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
          await updateMessageStatus(
            status
          );

          processed += 1;
        }
      }
    }

    return sendJson(
      res,
      200,
      {
        success: true,
        processed,
      }
    );
  } catch (error) {
    console.error(
      "WhatsApp webhook error:",
      error?.message ||
        error
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