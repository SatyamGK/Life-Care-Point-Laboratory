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
  dispatchWhatsAppNotification,
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
       SEND WHATSAPP NOTIFICATION
       (template first, plain text only as fallback)
    ----------------------------------------- */

    const messageText = message || "No message provided";

    const fallbackText = [
      "New website enquiry received at Life Care Point Laboratory.",
      "",
      `Name: ${name}`,
      `Mobile: ${mobile}`,
      `Source: ${source}`,
      `Message: ${messageText}`,
      "",
      "Please contact the customer.",
    ].join("\n");

    const notification = await dispatchWhatsAppNotification({
      table: "enquiries",
      rowId: enquiry.id,
      templateName: process.env.WHATSAPP_ENQUIRY_TEMPLATE_NAME,

      /* Must match the template variables {{1}}..{{4}} */
      parameters: [name, mobile, source, messageText],

      fallbackText,
    });

    if (!notification.ok) {
      return sendJson(
        res,
        502,
        {
          success: false,
          stored: true,
          code: "WHATSAPP_NOTIFICATION_FAILED",
          message:
            "Your request was saved, but the laboratory WhatsApp notification could not be sent. Please call the laboratory.",
        },
        commonRateHeaders(rateLimit)
      );
    }

    return sendJson(
      res,
      201,
      {
        success: true,
        message: "Your request has been submitted successfully.",
        enquiryId: enquiry.id,
        whatsapp: "sent",
      },
      commonRateHeaders(rateLimit)
    );
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