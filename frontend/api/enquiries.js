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
  safeSource,
  sendJson,
  sendWhatsAppText,
  supabaseAdmin,
  validIndianMobile,
  validName,
  logServerError,
} from "./_lib/server.js";

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
     * 1. SUPABASE SERVER CONFIG
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
        "enquiry",
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
            "Too many enquiry attempts. Please try again later.",
        },

        commonRateHeaders(
          rateLimit
        )
      );
    }

    /*
     * ----------------------------------------------------
     * 4. PARSE REQUEST
     * ----------------------------------------------------
     */
    const data =
      parseJsonBody(req);

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

    const message =
      cleanText(
        data.message,
        1000
      );

    const source =
      safeSource(
        data.source
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
     * 6. MOBILE RATE LIMIT
     * ----------------------------------------------------
     */
    const identityLimit =
      await enforceIdentityRateLimit(
        mobile,
        "enquiry",
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
     * 7. DUPLICATE REQUEST PROTECTION
     * ----------------------------------------------------
     */
    const duplicateLimit =
      await enforceDuplicateRateLimit(
        JSON.stringify({
          name:
            name.toLowerCase(),

          mobile,

          message:
            message.toLowerCase(),
        }),

        "enquiry",

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
            "A matching enquiry was already submitted recently.",
        },

        commonRateHeaders(
          duplicateLimit
        )
      );
    }

    /*
     * ----------------------------------------------------
     * 8. SERVER-DERIVED IDENTITY
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
     * 9. SAVE TO SUPABASE
     * ----------------------------------------------------
     */
    const {
      data: enquiry,
      error: insertError,
    } =
      await supabaseAdmin
        .from("enquiries")
        .insert({
          name,

          mobile,

          message:
            message || null,

          source,

          status: "new",

          whatsapp_status:
            "pending",

          ip_hash:
            ipHash,

          user_agent:
            userAgent,
        })
        .select(
          "id, created_at"
        )
        .single();

    if (
      insertError
    ) {
      logServerError(
        "Enquiry database error",
        insertError
      );

      return sendJson(
        res,
        500,
        {
          success: false,

          message:
            "We could not save your request. Please try again.",
        }
      );
    }

    /*
     * ----------------------------------------------------
     * 10. CREATE WHATSAPP MESSAGE
     * ----------------------------------------------------
     */
    let whatsappMessage =
      "📩 New Website Enquiry - Life Care Point Laboratory\n\n" +
      `Name: ${name}\n` +
      `Mobile: ${mobile}\n` +
      `Source: ${source}\n`;

    if (message) {
      whatsappMessage +=
        `\nMessage: ${message}`;
    }

    /*
     * ----------------------------------------------------
     * 11. WHATSAPP
     *
     * If WhatsApp configuration is missing,
     * the database record is NOT lost.
     * ----------------------------------------------------
     */
    try {
      const whatsapp =
        await sendWhatsAppText(
          whatsappMessage
        );

      const messageId =
        whatsapp
          ?.messages?.[0]?.id ||
        null;

      await supabaseAdmin
        .from("enquiries")
        .update({
          whatsapp_status:
            "sent",

          whatsapp_message_id:
            messageId,
        })
        .eq(
          "id",
          enquiry.id
        );

      return sendJson(
        res,
        201,
        {
          success: true,

          message:
            "Your request has been submitted successfully.",

          enquiryId:
            enquiry.id,

          whatsapp:
            "sent",
        },

        commonRateHeaders(
          rateLimit
        )
      );
    } catch (error) {
      logServerError(
        "WhatsApp enquiry notification failed",
        error
      );

      await supabaseAdmin
        .from("enquiries")
        .update({
          whatsapp_status:
            "failed",
        })
        .eq(
          "id",
          enquiry.id
        );

      /*
       * Database succeeded.
       *
       * WhatsApp configuration/provider failed.
       *
       * Tell the frontend the actual safe
       * user-level state.
       */
      return sendJson(
        res,
        502,
        {
          success: false,

          stored: true,

          message:
            error?.code ===
            "WHATSAPP_CONFIGURATION_ERROR"
              ? "Your enquiry was saved successfully, but WhatsApp notification is not configured yet."
              : "Your enquiry was saved, but WhatsApp notification could not be delivered. Please call the laboratory.",
        },

        commonRateHeaders(
          rateLimit
        )
      );
    }
  } catch (error) {
    logServerError(
      "Enquiry API error",
      error
    );

    let message =
      "Unable to process your request right now.";

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
        "Supabase server configuration is missing. Check the Vercel/local server environment variables.";
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