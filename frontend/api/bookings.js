import catalog from "./_lib/catalog.js";

import {
  assertSupabaseConfig,
  assertAllowedOrigin,
  cleanText,
  clientIp,
  commonRateHeaders,
  enforceIpRateLimit,
  enforceIdentityRateLimit,
  enforceDuplicateRateLimit,
  enforceBodyLimit,
  hashIp,
  methodOnly,
  parseJsonBody,
  requestUserAgent,
  sendJson,
  sendWhatsAppText,
  getSupabaseAdmin,
  validIndianMobile,
  validName,
} from "./_lib/server.js";

/* =========================================================
   FIND TEST / PACKAGE
========================================================= */

function findCatalogItem(
  type,
  itemId,
  itemName
) {
  const collection =
    type === "package"
      ? catalog.packages
      : catalog.tests;

  const normalizedId =
    cleanText(itemId, 100);

  const normalizedName =
    cleanText(itemName, 150).toLowerCase();

  return collection.find(
    (item) =>
      (normalizedId &&
        item.id === normalizedId) ||
      (normalizedName &&
        item.name.toLowerCase() ===
          normalizedName)
  );
}

/* =========================================================
   API
========================================================= */

export default async function handler(
  req,
  res
) {
  if (!methodOnly(req, res, "POST")) {
    return;
  }

  let rateLimit;

  try {
    assertSupabaseConfig();

    enforceBodyLimit(req);

    assertAllowedOrigin(req);

    /* -----------------------------------------
       IP RATE LIMIT
    ----------------------------------------- */

    rateLimit =
      await enforceIpRateLimit(
        req,
        "booking",
        {
          windowSeconds: Number(
            process.env
              .FORM_RATE_LIMIT_WINDOW_SECONDS ||
              900
          ),

          maxRequests: Number(
            process.env
              .FORM_RATE_LIMIT_MAX_REQUESTS ||
              5
          ),

          globalPrefix:
            "global-form-ip",
        }
      );

    if (!rateLimit.allowed) {
      return sendJson(
        res,
        429,
        {
          success: false,
          message:
            "Too many booking attempts. Please try again later.",
        },
        commonRateHeaders(
          rateLimit
        )
      );
    }

    /* -----------------------------------------
       REQUEST DATA
    ----------------------------------------- */

    const data =
      parseJsonBody(req);

    const type =
      data.type === "package"
        ? "package"
        : "test";

    const name =
      cleanText(data.name, 80);

    const mobile =
      cleanText(data.mobile, 10);

    const itemId =
      cleanText(data.itemId, 100);

    const itemName =
      cleanText(data.itemName, 150);

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!validName(name)) {
      return sendJson(res, 400, {
        success: false,
        message:
          "Please enter a valid full name.",
      });
    }

    if (!validIndianMobile(mobile)) {
      return sendJson(res, 400, {
        success: false,
        message:
          "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    const item =
      findCatalogItem(
        type,
        itemId,
        itemName
      );

    if (!item) {
      return sendJson(res, 400, {
        success: false,
        message:
          "The selected test or package is not available.",
      });
    }

    /* -----------------------------------------
       PHONE RATE LIMIT
    ----------------------------------------- */

    const identityLimit =
      await enforceIdentityRateLimit(
        mobile,
        "booking",
        {
          windowSeconds: Number(
            process.env
              .PHONE_RATE_LIMIT_WINDOW_SECONDS ||
              3600
          ),

          maxRequests: Number(
            process.env
              .PHONE_RATE_LIMIT_MAX_REQUESTS ||
              3
          ),
        }
      );

    if (!identityLimit.allowed) {
      return sendJson(
        res,
        429,
        {
          success: false,
          message:
            "Too many requests for this mobile number. Please try again later.",
        },
        commonRateHeaders(
          identityLimit
        )
      );
    }

    /* -----------------------------------------
       DUPLICATE PROTECTION
    ----------------------------------------- */

    const duplicateLimit =
      await enforceDuplicateRateLimit(
        JSON.stringify({
          type,
          itemId: item.id,
          name: name.toLowerCase(),
          mobile,
        }),
        "booking",
        {
          windowSeconds: Number(
            process.env
              .DUPLICATE_RATE_LIMIT_WINDOW_SECONDS ||
              600
          ),

          maxRequests: 1,
        }
      );

    if (!duplicateLimit.allowed) {
      return sendJson(
        res,
        409,
        {
          success: false,
          message:
            "A matching booking was already submitted recently.",
        },
        commonRateHeaders(
          duplicateLimit
        )
      );
    }

    /* -----------------------------------------
       CLIENT INFO
    ----------------------------------------- */

    const ipHash =
      hashIp(clientIp(req));

    const userAgent =
      requestUserAgent(req);

    /* -----------------------------------------
       SAVE BOOKING
    ----------------------------------------- */

    const {
      data: booking,
      error: insertError,
    } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        booking_type: type,
        name,
        mobile,
        item_name: item.name,
        price: item.price,
        status: "new",
        whatsapp_status: "pending",
        ip_hash: ipHash,
        user_agent: userAgent,
      })
      .select(
        "id, created_at, booking_type, name, mobile, item_name, price"
      )
      .single();

    if (insertError) {
      console.error(
        "Booking database error:",
        insertError.message
      );

      return sendJson(
        res,
        500,
        {
          success: false,
          message:
            "We could not save your booking. Please try again.",
        }
      );
    }

    /* -----------------------------------------
       BUILD PLAIN TEXT WHATSAPP MESSAGE
    ----------------------------------------- */

    const whatsappMessage = [
      "New booking received at Life Care Point Laboratory.",
      "",
      `Patient: ${name}`,
      `Mobile: ${mobile}`,
      `Type: ${type}`,
      `Test/Package: ${item.name}`,
      `Price: ₹${item.price}`,
      "",
      "Please contact the patient for confirmation.",
    ].join("\n");

    /* -----------------------------------------
       SEND WHATSAPP
    ----------------------------------------- */

    try {
      const whatsapp =
        await sendWhatsAppText(
          whatsappMessage
        );

      const messageId =
        whatsapp?.messages?.[0]?.id;

      if (!messageId) {
        throw new Error(
          "WhatsApp API returned no message ID."
        );
      }

      /* ---------------------------------------
         UPDATE SUCCESS
      --------------------------------------- */

      const {
        error: whatsappUpdateError,
      } = await getSupabaseAdmin()
        .from("bookings")
        .update({
          whatsapp_status: "sent",

          whatsapp_message_id:
            messageId,

          whatsapp_error_code:
            null,

          whatsapp_error_message:
            null,

          whatsapp_sent_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          booking.id
        );

      if (whatsappUpdateError) {
        console.error(
          "Booking WhatsApp status save failed:",
          whatsappUpdateError.message
        );
      }

      return sendJson(
        res,
        201,
        {
          success: true,

          message:
            "Booking submitted successfully.",

          bookingId:
            booking.id,

          whatsapp:
            "accepted",
        },
        commonRateHeaders(
          rateLimit
        )
      );
    } catch (error) {
      /* ---------------------------------------
         SAVE META ERROR
      --------------------------------------- */

      console.error(
        "WhatsApp booking notification failed:",
        {
          providerStatus:
            error?.providerStatus,

          providerErrorCode:
            error?.providerErrorCode,

          providerErrorType:
            error?.providerErrorType,

          providerErrorSubcode:
            error?.providerErrorSubcode,

          message:
            error?.message,

          providerResponse:
            error?.providerResponse,
        }
      );

      await getSupabaseAdmin()
        .from("bookings")
        .update({
          whatsapp_status:
            "failed",

          whatsapp_error_code:
            error?.providerErrorCode ||
            null,

          whatsapp_error_message:
            error?.providerResponse?.error
              ?.message ||
            error?.message ||
            "Unknown WhatsApp error",
        })
        .eq(
          "id",
          booking.id
        );

      return sendJson(
        res,
        502,
        {
          success: false,

          stored: true,

          code:
            "WHATSAPP_NOTIFICATION_FAILED",

          message:
            "Your booking was saved, but the laboratory WhatsApp notification could not be sent. Please call the laboratory.",
        },
        commonRateHeaders(
          rateLimit
        )
      );
    }
  } catch (error) {
    console.error(
      "Booking API error:",
      error?.message || error
    );

    const status =
      error?.statusCode || 500;

    return sendJson(
      res,
      status,
      {
        success: false,

        message:
          status === 413
            ? "Request payload is too large."
            : "Unable to process your booking right now.",
      }
    );
  }
}