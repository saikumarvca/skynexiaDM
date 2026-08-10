import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Webhook from "@/models/Webhook";

export async function triggerWebhook(
  event: string,
  payload: object,
): Promise<void> {
  try {
    await dbConnect();
    const webhooks = await Webhook.find({ isActive: true, events: event });
    if (!webhooks.length) return;

    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const body = JSON.stringify({
            event,
            payload,
            timestamp: new Date().toISOString(),
          });

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-DM-Event": event,
          };

          if (webhook.secret) {
            const sig = crypto
              .createHmac("sha256", webhook.secret)
              .update(body)
              .digest("hex");
            headers["X-DM-Signature"] = sig;
          }

          await fetch(webhook.url, { method: "POST", headers, body });

          await Webhook.findByIdAndUpdate(webhook._id, {
            lastTriggeredAt: new Date(),
          });
        } catch (err) {
          console.error(
            `[webhooks] Failed to deliver ${event} to ${webhook.url}:`,
            err,
          );
        }
      }),
    );
  } catch (err) {
    console.error("[webhooks] triggerWebhook error:", err);
  }
}
