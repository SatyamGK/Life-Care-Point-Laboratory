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

function findCatalogItem(type, itemId, itemName) {
  const collection = type === "package" ? catalog.packages : catalog.tests;
  const normalizedId = cleanText(itemId, 100);
  const normalizedName = cleanText(itemName, 150).toLowerCase();

  return collection.find(
    (item) =>
      (normalizedId && item.id === normalizedId) ||
      (normalizedName && item.name.toLowerCase() === normalizedName)
  );
}

export default async function handler(req, res) {
  if (!methodOnly(req, res, "POST")) return;

  let rateLimit;
  try {
    assertSupabaseConfig();
    enforceBodyLimit(req);
    assertAllowedOrigin(req);

    rateLimit = await enforceIpRateLimit(req, "booking", {
      windowSeconds: Number(process.env.FORM_RATE_LIMIT_WINDOW_SECONDS || 900),
      maxRequests: Number(process.env.FORM_RATE_LIMIT_MAX_REQUESTS || 5),
      globalPrefix: "global-form-ip",
    });

    if (!rateLimit.allowed) {
      return sendJson(
        res,
        429,
        {
          success: false,
          message: "Too many booking attempts. Please try again later.",
        },
        commonRateHeaders(rateLimit)
      );
    }

    const data = parseJsonBody(req);
    const type = data.type === "package" ? "package" : "test";
    const name = cleanText(data.name, 80);
    const mobile = cleanText(data.mobile, 10);
    const itemId = cleanText(data.itemId, 100);
    const itemName = cleanText(data.itemName, 150);

    if (!validName(name)) {
      return sendJson(res, 400, {
        success: false,
        message: "Please enter a valid full name.",
      });
    }

    if (!validIndianMobile(mobile)) {
      return sendJson(res, 400, {
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    const item = findCatalogItem(type, itemId, itemName);

    if (!item) {
      return sendJson(res, 400, {
        success: false,
        message: "The selected test or package is not available.",
      });
    }

    const identityLimit = await enforceIdentityRateLimit(mobile, "booking", {
      windowSeconds: Number(process.env.PHONE_RATE_LIMIT_WINDOW_SECONDS || 3600),
      maxRequests: Number(process.env.PHONE_RATE_LIMIT_MAX_REQUESTS || 3),
    });

    if (!identityLimit.allowed) {
      return sendJson(res, 429, {
        success: false,
        message: "Too many requests for this mobile number. Please try again later.",
      }, commonRateHeaders(identityLimit));
    }

    const duplicateLimit = await enforceDuplicateRateLimit(
      JSON.stringify({ type, itemId: item.id, name: name.toLowerCase(), mobile }),
      "booking",
      { windowSeconds: Number(process.env.DUPLICATE_RATE_LIMIT_WINDOW_SECONDS || 600), maxRequests: 1 }
    );

    if (!duplicateLimit.allowed) {
      return sendJson(res, 409, {
        success: false,
        message: "A matching booking was already submitted recently.",
      }, commonRateHeaders(duplicateLimit));
    }

    const ipHash = hashIp(
      clientIp(req)
    );
    const userAgent = requestUserAgent(req);

    const { data: booking, error: insertError } = await getSupabaseAdmin()
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
      .select("id, created_at, booking_type, name, mobile, item_name, price")
      .single();

    if (insertError) {
      console.error("Booking database error:", insertError.message);
      return sendJson(res, 500, {
        success: false,
        message: "We could not save your booking. Please try again.",
      });
    }

    const message =
      "New Booking - Life Care Point Laboratory\n\n" +
      `Patient Name: ${name}\n` +
      `Mobile: ${mobile}\n` +
      `Type: ${type}\n` +
      `Test/Package: ${item.name}\n` +
      `Price: ₹${item.price}\n\n` +
      "Please contact the patient for confirmation.";

    try {
      const whatsapp = await sendWhatsAppText(message);
      const messageId = whatsapp?.messages?.[0]?.id || null;

      await getSupabaseAdmin()
        .from("bookings")
        .update({
          whatsapp_status: "sent",
          whatsapp_message_id: messageId,
        })
        .eq("id", booking.id);

      return sendJson(
        res,
        201,
        {
          success: true,
          message: "Booking submitted successfully.",
          bookingId: booking.id,
          whatsapp: "sent",
        },
        commonRateHeaders(rateLimit)
      );
    } catch (error) {
      console.error("WhatsApp booking notification failed:", {
        status: error?.providerStatus,
        message: error?.message,
      });

      await getSupabaseAdmin()
        .from("bookings")
        .update({ whatsapp_status: "failed" })
        .eq("id", booking.id);

      return sendJson(
        res,
        502,
        {
          success: false,
          stored: true,
          message:
            "Your booking was saved, but WhatsApp notification could not be delivered. Please call the Life Care Point Laboratory.",
        },
        commonRateHeaders(rateLimit)
      );
    }
  } catch (error) {
    console.error("Booking API error:", error?.message || error);
    return sendJson(res, error?.statusCode || 500, {
      success: false,
      message:
        error?.statusCode === 413
          ? "Request payload is too large."
          : "Unable to process your booking right now.",
    });
  }
}
