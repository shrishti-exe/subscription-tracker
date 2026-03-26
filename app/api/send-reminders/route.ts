import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

// Called by Vercel Cron daily, or manually by any authenticated user.
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const isVercelCron = cronSecret === process.env.CRON_SECRET;

  if (!isVercelCron) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createClient();

  // Get all active subscriptions for the Dognosis team
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("id, name, amount, billing_cycle, start_date, category, status")
    .eq("status", "active");

  if (error || !subscriptions) {
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ADVANCE_DAYS = 3;
  const alertDate = new Date(today.getTime() + ADVANCE_DAYS * 24 * 60 * 60 * 1000);

  const upcoming = subscriptions.filter((sub) => {
    const renewal = computeNextRenewal(sub.start_date, sub.billing_cycle);
    return renewal >= today.toISOString().split("T")[0] &&
           renewal <= alertDate.toISOString().split("T")[0];
  });

  if (upcoming.length === 0) {
    return NextResponse.json({ sent: 0, message: "No upcoming renewals in window" });
  }

  // Get all users who opted in for email alerts via get_opted_in_emails()
  const { data: optedIn } = await supabase.rpc("get_opted_in_emails");

  if (!optedIn || optedIn.length === 0) {
    return NextResponse.json({ sent: 0, message: "No users opted in for email alerts" });
  }

  // Send one email per opted-in user
  let sent = 0;
  for (const recipient of optedIn as { email: string; advance_days: number }[]) {
    const emailHtml = buildEmailHtml(upcoming, recipient.email);
    const { error: emailError } = await resend.emails.send({
      from: "The Curator <reminders@thecurator.app>",
      to: recipient.email,
      subject: `${upcoming.length} subscription${upcoming.length > 1 ? "s" : ""} renewing soon`,
      html: emailHtml,
    });
    if (!emailError) sent++;
  }

  return NextResponse.json({ sent, renewals: upcoming.length });
}

function computeNextRenewal(startDate: string, billingCycle: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(startDate);
  next.setHours(0, 0, 0, 0);
  while (next < today) {
    if (billingCycle === "Monthly") next.setMonth(next.getMonth() + 1);
    else if (billingCycle === "Yearly") next.setFullYear(next.getFullYear() + 1);
    else if (billingCycle === "Quarterly") next.setMonth(next.getMonth() + 3);
    else next.setDate(next.getDate() + 7);
  }
  return next.toISOString().split("T")[0];
}

function buildEmailHtml(
  subscriptions: { name: string; amount: number; billing_cycle: string; start_date: string; category: string }[],
  email: string
): string {
  const rows = subscriptions
    .map((sub) => {
      const renewal = computeNextRenewal(sub.start_date, sub.billing_cycle);
      const renewalDate = new Date(renewal).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysLeft = Math.round(
        (new Date(renewal).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      // Show in INR (default)
      const inrAmount = `₹${Math.round(sub.amount * 84).toLocaleString("en-IN")}`;
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
            <strong style="color:#1a1a1a;">${sub.name}</strong>
            <span style="color:#666;font-size:12px;margin-left:8px;">${sub.category}</span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#006872;font-weight:700;">
            ${inrAmount}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
            <span style="background:${daysLeft === 0 ? "#fef3c7" : "#f0fdfd"};color:${daysLeft === 0 ? "#92400e" : "#006872"};padding:3px 8px;border-radius:20px;font-size:12px;font-weight:600;">
              ${daysLeft === 0 ? "Today" : `In ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
            </span>
            <span style="color:#888;font-size:12px;margin-left:8px;">${renewalDate}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const totalINR = `₹${Math.round(subscriptions.reduce((sum, s) => sum + s.amount, 0) * 84).toLocaleString("en-IN")}`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafb;font-family:'Inter',system-ui,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#006872,#00838f);padding:40px 40px 32px;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">The Curator</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:2px;">Renewal Reminder</p>
        </div>
        <div style="padding:32px 40px;">
          <p style="color:#374151;font-size:16px;margin:0 0 8px;">
            Hey 👋 — you have <strong>${subscriptions.length} subscription${subscriptions.length > 1 ? "s" : ""}</strong> renewing soon.
          </p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">
            Here's what's coming up so you're not caught off guard.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">Subscription</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">Amount</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">When</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="background:#f0fdfd;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
            <span style="color:#374151;font-size:14px;font-weight:600;">Total upcoming</span>
            <span style="color:#006872;font-size:20px;font-weight:800;">${totalINR}</span>
          </div>
          <div style="text-align:center;">
            <a href="https://subscription-tracker-silk-alpha.vercel.app/reminders"
               style="display:inline-block;background:linear-gradient(135deg,#006872,#00838f);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;">
              View in The Curator →
            </a>
          </div>
        </div>
        <div style="padding:24px 40px;border-top:1px solid #f0f0f0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
            Sent to ${email} · <a href="https://subscription-tracker-silk-alpha.vercel.app/settings" style="color:#006872;">Manage preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
