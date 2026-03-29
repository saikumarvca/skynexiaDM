// Email utility supporting multiple providers.
//
// Configuration via environment variables:
//   EMAIL_PROVIDER: 'smtp' | 'resend' | 'none'  (default: 'none')
//   For Resend:  RESEND_API_KEY, EMAIL_FROM
//   For SMTP:   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<EmailResult> {
  const provider = (process.env.EMAIL_PROVIDER ?? "none").toLowerCase();
  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: "RESEND_API_KEY is not set" };
    }
    const from = process.env.EMAIL_FROM ?? "noreply@example.com";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: toList,
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Resend error ${res.status}: ${body}` };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (provider === "smtp") {
    const host = process.env.SMTP_HOST;
    const portRaw = process.env.SMTP_PORT ?? "587";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from =
      process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? "noreply@example.com";

    if (!host) {
      return { success: false, error: "SMTP_HOST is not set" };
    }

    try {
      const nodemailer = await import("nodemailer");
      const port = Number.parseInt(portRaw, 10) || 587;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });

      await transporter.sendMail({
        from,
        to: toList,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Default: 'none' — log to console for development
  console.log("[email:console]", {
    to: toList,
    subject: opts.subject,
    preview: opts.text?.slice(0, 200) ?? opts.html.slice(0, 200),
  });
  return { success: true };
}
