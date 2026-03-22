/**
 * Plaid Public Token Exchange + Subscription Detection
 *
 * After the user completes Plaid Link, this endpoint:
 * 1. Exchanges the public_token for a permanent access_token
 * 2. Fetches the last 90 days of transactions
 * 3. Detects recurring charges (subscriptions) using pattern matching
 * 4. Returns detected subscriptions to be saved to the user's account
 *
 * Subscription Detection Algorithm:
 * - Groups transactions by merchant name
 * - Finds transactions that repeat monthly/yearly/weekly with similar amounts
 * - Filters by known subscription merchant names
 * - Returns candidates with confidence scores
 */

import { NextRequest, NextResponse } from "next/server";

// Known subscription merchants for pattern matching
const SUBSCRIPTION_KEYWORDS = [
  "netflix", "spotify", "hulu", "disney", "apple", "amazon prime",
  "youtube premium", "google one", "microsoft 365", "adobe", "notion",
  "github", "dropbox", "slack", "zoom", "canva", "figma", "linear",
  "airtable", "monday", "asana", "atlassian", "jira", "confluence",
  "hubspot", "salesforce", "mailchimp", "twilio", "aws", "gcp",
  "digitalocean", "vercel", "heroku", "cloudflare", "fastmail",
  "1password", "lastpass", "nordvpn", "expressvpn", "duolingo",
  "headspace", "calm", "noom", "peloton", "playstation", "xbox",
];

interface Transaction {
  date: string;
  name: string;
  amount: number;
  merchant_name?: string;
}

function detectSubscriptions(transactions: Transaction[]) {
  // Group by merchant
  const byMerchant: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    const key = (tx.merchant_name || tx.name).toLowerCase().trim();
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(tx);
  }

  const subscriptions = [];

  for (const [merchant, txs] of Object.entries(byMerchant)) {
    // Need at least 2 occurrences
    if (txs.length < 2) continue;

    // Check if keyword matches
    const isKnownSub = SUBSCRIPTION_KEYWORDS.some((kw) => merchant.includes(kw));

    // Check for consistent amounts (within 5% variance)
    const amounts = txs.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const isConsistent = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.05);

    if (isKnownSub || isConsistent) {
      // Estimate billing cycle based on date gaps
      const sorted = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const gaps = [];
      for (let i = 1; i < sorted.length; i++) {
        const days =
          (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24);
        gaps.push(days);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

      let billingCycle = "Monthly";
      if (avgGap < 10) billingCycle = "Weekly";
      else if (avgGap > 300) billingCycle = "Yearly";
      else if (avgGap > 80) billingCycle = "Quarterly";

      // Estimate next renewal
      const lastDate = new Date(sorted[sorted.length - 1].date);
      const nextDate = new Date(lastDate);
      if (billingCycle === "Monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (billingCycle === "Yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      else if (billingCycle === "Quarterly") nextDate.setMonth(nextDate.getMonth() + 3);
      else nextDate.setDate(nextDate.getDate() + 7);

      subscriptions.push({
        name: txs[0].merchant_name || txs[0].name,
        amount: avgAmount,
        billingCycle,
        nextRenewal: nextDate.toISOString().split("T")[0],
        confidence: isKnownSub ? "high" : "medium",
        occurrences: txs.length,
      });
    }
  }

  return subscriptions;
}

export async function POST(req: NextRequest) {
  try {
    const { public_token, phone } = await req.json();

    if (!public_token) {
      return NextResponse.json({ error: "public_token required" }, { status: 400 });
    }

    // DEMO MODE: Return mock detected subscriptions
    // In production, use Plaid to exchange token and fetch transactions:
    //
    // const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    // const accessToken = exchangeResponse.data.access_token;
    //
    // const startDate = new Date();
    // startDate.setDate(startDate.getDate() - 90);
    // const txResponse = await plaidClient.transactionsGet({
    //   access_token: accessToken,
    //   start_date: startDate.toISOString().split("T")[0],
    //   end_date: new Date().toISOString().split("T")[0],
    // });
    //
    // const detected = detectSubscriptions(txResponse.data.transactions);
    // return NextResponse.json({ subscriptions: detected, accessToken });

    const mockTransactions: Transaction[] = [
      { date: "2026-03-01", name: "NETFLIX.COM", merchant_name: "Netflix", amount: 22.99 },
      { date: "2026-02-01", name: "NETFLIX.COM", merchant_name: "Netflix", amount: 22.99 },
      { date: "2026-01-01", name: "NETFLIX.COM", merchant_name: "Netflix", amount: 22.99 },
      { date: "2026-03-05", name: "SPOTIFY", merchant_name: "Spotify", amount: 14.99 },
      { date: "2026-02-05", name: "SPOTIFY", merchant_name: "Spotify", amount: 14.99 },
      { date: "2026-03-10", name: "ADOBE SYSTEMS", merchant_name: "Adobe", amount: 54.99 },
      { date: "2026-02-10", name: "ADOBE SYSTEMS", merchant_name: "Adobe", amount: 54.99 },
    ];

    const detected = detectSubscriptions(mockTransactions);

    return NextResponse.json({
      subscriptions: detected,
      demo: true,
      message: "Demo mode: showing sample detected subscriptions. Connect Plaid for real bank data.",
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json({ error: "Failed to process bank connection" }, { status: 500 });
  }
}
