import { getSupabaseAdmin } from "./_lib/server.js";

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  let supabaseRoleOk = false;

  try {
    const { data, error } = await getSupabaseAdmin().rpc(
      "verify_server_role"
    );

    supabaseRoleOk = !error && data === "service_role";
  } catch {
    supabaseRoleOk = false;
  }

  const recipient = digits(process.env.WHATSAPP_NOTIFICATION_RECIPIENT);
  const sender = digits(process.env.WHATSAPP_BUSINESS_NUMBER);

  return res.status(200).json({
    success: true,

    api: "online",

    environment: process.env.VERCEL_ENV || "unknown",

    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.IP_HASH_SALT
    ),

    supabaseRoleOk,

    whatsappConfigured: Boolean(
      process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        process.env.WHATSAPP_NOTIFICATION_RECIPIENT &&
        process.env.META_GRAPH_API_VERSION
    ),

    /* MUST be true, otherwise notifications are not delivered
       outside the 24-hour window. */
    whatsappTemplatesConfigured: Boolean(
      process.env.WHATSAPP_BOOKING_TEMPLATE_NAME &&
        process.env.WHATSAPP_ENQUIRY_TEMPLATE_NAME &&
        process.env.WHATSAPP_TEMPLATE_LANGUAGE
    ),

    /* MUST be true: a business number cannot message itself. */
    whatsappRecipientDiffersFromSender: Boolean(
      recipient && (!sender || recipient !== sender)
    ),

    whatsappWebhookConfigured: Boolean(
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    ),

    whatsappWebhookSignatureConfigured: Boolean(
      process.env.WHATSAPP_APP_SECRET
    ),

    timestamp: new Date().toISOString(),
  });
}