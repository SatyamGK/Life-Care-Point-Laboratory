import {
  assertWhatsAppConfig,
  sendWhatsAppNotification,
} from "./_lib/server.js";

/*
 * Diagnostic endpoint: sends ONE test notification and returns Meta's
 * real answer, so you can see exactly why delivery works or not.
 *
 *   GET /api/whatsapp-test?key=YOUR_WHATSAPP_TEST_KEY
 *
 * Set WHATSAPP_TEST_KEY in Vercel first. Remove the variable afterwards
 * to disable the endpoint.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const expected = process.env.WHATSAPP_TEST_KEY;
  const key = String(req.query?.key || "");

  if (!expected || key !== expected) {
    return res.status(404).json({ success: false });
  }

  try {
    assertWhatsAppConfig();

    const result = await sendWhatsAppNotification({
      templateName: process.env.WHATSAPP_BOOKING_TEMPLATE_NAME,
      parameters: [
        "Test Patient",
        "9999999999",
        "test",
        "Diagnostic Test",
        "Rs 0",
      ],
      fallbackText: "Life Care Point Laboratory: WhatsApp test message.",
    });

    return res.status(200).json({
      success: true,
      mode: result.mode,
      messageId: result.messageId,
      templateFailure: result.templateFailure || null,
      warning:
        result.mode === "template"
          ? null
          : "Template was NOT used, so this plain text will be dropped " +
            "by WhatsApp unless the recipient messaged your business " +
            "number in the last 24 hours. Fix the template (see templateFailure).",
      note:
        "Meta accepted the message. Check the recipient phone; the " +
        "webhook will record delivered/failed in Supabase.",
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      configError: error?.code || null,
      message: error?.message,
      metaStatus: error?.providerStatus || null,
      metaErrorCode: error?.providerErrorCode || null,
      metaErrorType: error?.providerErrorType || null,
      metaResponse: error?.providerResponse || null,
      textFallbackError: error?.fallbackError || null,
    });
  }
}