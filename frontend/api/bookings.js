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
  supabaseAdmin,
  validIndianMobile,
  validName,
  logServerError,
} from "./_lib/server.js";

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
    cleanText(
      itemId,
      100
    );

  const normalizedName =
    cleanText(
      itemName,
      150
    ).toLowerCase();

  return collection.find(
    (item) =>
      (
        normalizedId &&
        item.id === normalizedId
      ) ||
      (
        normalizedName &&
        item.name
          .toLowerCase() ===
          normalizedName
      )
  );
}

export default async function handler(
  req,
  res
) {
  if (
    !methodOnly(
      req,
      res,
      "POST"
    )
  ) {
    return;
  }

  let rateLimit;

  try {
    /*
     * ----------------------------------------------------
     * 1. SUPABASE CONFIG
     * ----------------------------------------------------
     */
    assertSupabaseConfig();

    /*
     * ----------------------------------------------------
     * 2. REQUEST SECURITY
     * ----------------------------------------------------
     */
    enforceBodyLimit(
      req,
      20000
    );

    assertAllowedOrigin(req);

    /*
     * ----------------------------------------------------
     * 3. IP RATE LIMIT
     * ----------------------------------------------------
     */
    rateLimit =
      await enforceIpRateLimit(
        req,
        "booking",
        {
          windowSeconds:
            Number(
              process.env
                .FORM_RATE_LIMIT_WINDOW_SECONDS ||
                900
            ),

          maxRequests:
            Number(
              process.env
                .FORM_RATE_LIMIT_MAX_REQUESTS ||
                5
            ),

          globalPrefix:
            "global-form-ip",
        }
      );

    if (
      !rateLimit.allowed
    ) {
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

    /*
     * ----------------------------------------------------
     * 4. PARSE
     * ----------------------------------------------------
     */
    const data =
      parseJsonBody(req);

    const type =
      data.type === "package"
        ? "package"
        : "test";

    const name =
      cleanText(
        data.name,
        80
      );

    const mobile =
      cleanText(
        data.mobile,
        10
      );

    const itemId =
      cleanText(
        data.itemId,
        100
      );

    const itemName =
      cleanText(
        data.itemName,
        150
      );

    /*
     * ----------------------------------------------------
     * 5. VALIDATION
     * ----------------------------------------------------
     */
    if (
      !validName(name)
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,

          message:
            "Please enter a valid full name.",
        }
      );
    }

    if (
      !validIndianMobile(
        mobile
      )
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,

          message:
            "Please enter a valid 10-digit Indian mobile number.",
        }
      );
    }

    /*
     * ----------------------------------------------------
     * 6. SERVER-SIDE CATALOG VERIFICATION
     * ----------------------------------------------------
     */
    const item =
      findCatalogItem(
        type,
        itemId,
        itemName
      );

    if (!item) {
      return sendJson(
        res,
        400,
        {
          success: false,

          message:
            "The selected test or package is not available.",
        }
      );
    }

    /*
     * ----------------------------------------------------
     * 7. MOBILE RATE LIMIT
     * ----------------------------------------------------
     */
    const identityLimit =
      await enforceIdentityRateLimit(
        mobile,
        "booking",
        {
          windowSeconds:
            Number(
              process.env
                .PHONE_RATE_LIMIT_WINDOW_SECONDS ||
                3600
            ),

          maxRequests:
            Number(
              process.env
                .PHONE_RATE_LIMIT_MAX_REQUESTS ||
                3
            ),
        }
      );

    if (
      !identityLimit.allowed
    ) {
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

    /*
     * ----------------------------------------------------
     * 8. DUPLICATE BOOKING PROTECTION
     * ----------------------------------------------------
     */
    const duplicateLimit =
      await enforceDuplicateRateLimit(
        JSON.stringify({
          type,

          itemId:
            item.id,

          name:
            name.toLowerCase(),

          mobile,
        }),

        "booking",

        {
          windowSeconds:
            Number(
              process.env
                .DUPLICATE_RATE_LIMIT_WINDOW_SECONDS ||
                600
            ),

          maxRequests: 1,
        }
      );

    if (
      !duplicateLimit.allowed
    ) {
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

    /*
     * ----------------------------------------------------
     * 9. SERVER-DERIVED IP
     * ----------------------------------------------------
     */
    const ipHash =
      hashIp(
        clientIp(req)
      );

    const userAgent =
      requestUserAgent(
        req
      );

    /*
     * ----------------------------------------------------
     * 10. SAVE BOOKING
     * ----------------------------------------------------
     */
    const {
      data: booking,
      error: insertError,
    } =
      await supabaseAdmin
        .from("bookings")
        .insert({
          booking_type:
            type,

          name,

          mobile,

          item_name:
            item.name,

          price:
            item.price,

          status:
            "new",

          whatsapp_status:
            "pending",

          ip_hash:
            ipHash,

          user_agent:
            userAgent,
        })
        .select(
          "id, created_at, booking_type, name, mobile, item_name, price"
        )
        .single();

    if (
      insertError
    ) {
      logServerError(
        "Booking database error",
        insertError
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

    /*
     * ----------------------------------------------------
     * 11. WHATSAPP MESSAGE
     * ----------------------------------------------------
     */
    const message =
      "🔔 New Booking - Life Care Point Laboratory\n\n" +
      `Patient Name: ${name}\n` +
      `Mobile: ${mobile}\n` +
      `Type: ${type}\n` +
      `Test/Package: ${item.name}\n` +
      `Price: ₹${item.price}\n\n` +
      "Please contact the patient for confirmation.";

    /*
     * ----------------------------------------------------
     * 12. SEND WHATSAPP
     * ----------------------------------------------------
     */
    try {
      const whatsapp =
        await sendWhatsAppText(
          message
        );

      const messageId =
        whatsapp
          ?.messages?.[0]?.id ||
        null;

      await supabaseAdmin
        .from("bookings")
        .update({
          whatsapp_status:
            "sent",

          whatsapp_message_id:
            messageId,
        })
        .eq(
          "id",
          booking.id
        );

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
            "sent",
        },

        commonRateHeaders(
          rateLimit
        )
      );
    } catch (error) {
      logServerError(
        "WhatsApp booking notification failed",
        error
      );

      await supabaseAdmin
        .from("bookings")
        .update({
          whatsapp_status:
            "failed",
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

          message:
            error?.code ===
            "WHATSAPP_CONFIGURATION_ERROR"
              ? "Your booking was saved successfully, but WhatsApp notification is not configured yet."
              : "Your booking was saved, but WhatsApp notification could not be delivered. Please call the laboratory.",
        },

        commonRateHeaders(
          rateLimit
        )
      );
    }
  } catch (error) {
    logServerError(
      "Booking API error",
      error
    );

    let message =
      "Unable to process your booking right now.";

    if (
      error?.statusCode ===
      413
    ) {
      message =
        "Request payload is too large.";
    }

    if (
      error?.code ===
      "SUPABASE_SERVER_CONFIGURATION_ERROR"
    ) {
      message =
        "Supabase server configuration is missing. Check the local server environment variables.";
    }

    if (
      error?.code ===
      "ORIGIN_NOT_ALLOWED"
    ) {
      message =
        "This request origin is not allowed.";
    }

    if (
      error?.code ===
      "CLIENT_IP_UNAVAILABLE"
    ) {
      message =
        "Unable to determine the request source. Please try again.";
    }

    return sendJson(
      res,
      error?.statusCode || 500,
      {
        success: false,
        message,
      }
    );
  }
}