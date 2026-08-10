// Email template functions for common notification scenarios.
// Each returns { subject, html, text }.

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">DM Dashboard</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f4f5;padding:16px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
                This is an automated message from DM Dashboard. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr>
      <td style="background-color:#18181b;border-radius:6px;">
        <a href="${url}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------

export function taskAssignedEmail(opts: {
  taskTitle: string;
  assigneeName: string;
  dueDate?: string;
  taskUrl: string;
}): EmailTemplate {
  const subject = `Task assigned: ${opts.taskTitle}`;

  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">You have a new task</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">Hi ${opts.assigneeName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">
      A task has been assigned to you:
    </p>
    <div style="background-color:#f4f4f5;border-radius:6px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#18181b;">${opts.taskTitle}</p>
      ${opts.dueDate ? `<p style="margin:0;font-size:13px;color:#71717a;">Due: ${opts.dueDate}</p>` : ""}
    </div>
    ${ctaButton("View task", opts.taskUrl)}
  `;

  const text = [
    `Hi ${opts.assigneeName},`,
    ``,
    `A task has been assigned to you: ${opts.taskTitle}`,
    opts.dueDate ? `Due date: ${opts.dueDate}` : null,
    ``,
    `View task: ${opts.taskUrl}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return {
    subject,
    html: baseHtml(subject, bodyHtml),
    text,
  };
}

export function reviewRequestEmail(opts: {
  clientName: string;
  reviewerName: string;
  reviewUrl: string;
}): EmailTemplate {
  const subject = `Review request for ${opts.clientName}`;

  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Review request</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">Hi ${opts.reviewerName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">
      You have been asked to submit a review for <strong>${opts.clientName}</strong>.
      Click the button below to complete your review.
    </p>
    ${ctaButton("Leave a review", opts.reviewUrl)}
  `;

  const text = [
    `Hi ${opts.reviewerName},`,
    ``,
    `You have been asked to submit a review for ${opts.clientName}.`,
    ``,
    `Leave a review: ${opts.reviewUrl}`,
  ].join("\n");

  return {
    subject,
    html: baseHtml(subject, bodyHtml),
    text,
  };
}

export function leadNotificationEmail(opts: {
  leadName: string;
  source?: string;
  clientName: string;
  leadUrl: string;
}): EmailTemplate {
  const subject = `New lead: ${opts.leadName}`;

  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">New lead received</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">
      A new lead has been added for <strong>${opts.clientName}</strong>.
    </p>
    <div style="background-color:#f4f4f5;border-radius:6px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#18181b;">${opts.leadName}</p>
      ${opts.source ? `<p style="margin:0;font-size:13px;color:#71717a;">Source: ${opts.source}</p>` : ""}
    </div>
    ${ctaButton("View lead", opts.leadUrl)}
  `;

  const text = [
    `New lead received for ${opts.clientName}:`,
    ``,
    `Name: ${opts.leadName}`,
    opts.source ? `Source: ${opts.source}` : null,
    ``,
    `View lead: ${opts.leadUrl}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return {
    subject,
    html: baseHtml(subject, bodyHtml),
    text,
  };
}
