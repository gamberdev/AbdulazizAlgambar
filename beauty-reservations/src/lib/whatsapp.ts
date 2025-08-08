import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  // In dev, we allow missing credentials; functions should no-op.
}

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (!accountSid || !authToken) return null;
  if (!client) client = twilio(accountSid, authToken);
  return client;
}

export async function sendWhatsAppMessage(toPhone: string, body: string, fromOverride?: string) {
  const twilioClient = getTwilioClient();
  const from = fromOverride || process.env.TWILIO_WHATSAPP_FROM || process.env.WHATSAPP_FROM;

  if (!twilioClient || !from) {
    console.warn("Twilio not configured. Skipping WhatsApp send.");
    return { sid: null, status: "SKIPPED" } as const;
  }

  const format = (n: string) => (n.startsWith("whatsapp:") ? n : `whatsapp:${n}`);

  const msg = await twilioClient.messages.create({
    from: format(from),
    to: format(toPhone),
    body,
  });
  return { sid: msg.sid, status: msg.status } as const;
}