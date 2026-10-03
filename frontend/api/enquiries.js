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
  getSupabaseAdmin,
  validIndianMobile,
  validName,
} from "./_lib/server.js";

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
        "enquiry",
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
            "Too many enquiry attempts. Please try again later.",
        },
        commonRateHeaders(
          rateLimit
        )
      );
    }

    /* -----------------------------------------
       DATA
    ----------------------------------------- */

    const data =
      parseJsonBody(req);

    const name =
      cleanText(data.name, 80);

    const mobile =
      cleanText(data.mobile, 10);

    const message =
      cleanText(data.message, 1000);

    const source =
      safeSource(data.source);

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

    /* -----------------------------------------
       PHONE RATE LIMIT
    ----------------------------------------- */

    const identityLimit =
      await enforceIdentityRateLimit(
        mobile,
        "enquiry",
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
          name:
            name.toLowerCase(),

          mobile,

          message:
            message.toLowerCase(),
        }),
        "enquiry",
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
            "A matching enquiry was already submitted recently.",
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
       SAVE ENQUIRY
    ----------------------------------------- */

    const {
      data: enquiry,
      error: insertError,
    } = await getSupabaseAdmin()
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

    if (insertError) {
      console.error(
        "Enquiry database error:",
        insertError.message
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

    /* -----------------------------------------
       BUILD PLAIN TEXT MESSAGE
    ----------------------------------------- */

    const whatsappMessage = [
      "New website enquiry received at Life Care Point Laboratory.",
      "",
      `Name: ${name}`,
      `Mobile: ${mobile}`,
      `Source: ${source}`,
      `Message: ${
        message ||
        "No message provided"
      }`,
      "",
      "Please contact the customer.",
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
        .from("enquiries")
        .update({
          whatsapp_status:
            "sent",

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
          enquiry.id
        );

      if (whatsappUpdateError) {
        console.error(
          "Enquiry WhatsApp status save failed:",
          whatsappUpdateError.message
        );
      }

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
        "WhatsApp enquiry notification failed:",
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
        .from("enquiries")
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
          enquiry.id
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
            "Your request was saved, but the laboratory WhatsApp notification could not be sent. Please call the laboratory.",
        },
        commonRateHeaders(
          rateLimit
        )
      );
    }
  } catch (error) {
    console.error(
      "Enquiry API error:",
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
            : "Unable to process your request right now.",
      }
    );
  }
}