/**
 * Plaid Link Token Creation
 *
 * This endpoint creates a Plaid Link token which is used to initialize
 * the Plaid Link flow in the browser. The user then connects their bank
 * account through Plaid's secure OAuth flow.
 *
 * Flow:
 * 1. Frontend calls this endpoint to get a link_token
 * 2. Frontend opens Plaid Link with the token
 * 3. User authenticates with their bank (OAuth or credentials)
 * 4. Plaid returns a public_token to the frontend
 * 5. Frontend calls /api/plaid/exchange-token with the public_token
 * 6. Backend exchanges it for a permanent access_token
 * 7. Backend uses the access_token to fetch transactions
 *
 * To enable real bank connections:
 * 1. Sign up at https://dashboard.plaid.com
 * 2. Get your PLAID_CLIENT_ID and PLAID_SECRET
 * 3. Add them to your .env.local file
 * 4. Uncomment the Plaid client code below
 */

import { NextRequest, NextResponse } from "next/server";

// Real Plaid implementation (uncomment when you have credentials):
// import { PlaidApi, PlaidEnvironments, Configuration, Products, CountryCode } from "plaid";
//
// const plaidClient = new PlaidApi(
//   new Configuration({
//     basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
//     baseOptions: {
//       headers: {
//         "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
//         "PLAID-SECRET": process.env.PLAID_SECRET!,
//       },
//     },
//   })
// );

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // DEMO MODE: Return a mock link token
    // In production, uncomment the Plaid code above and use:
    //
    // const response = await plaidClient.linkTokenCreate({
    //   user: { client_user_id: phone },
    //   client_name: "The Curator",
    //   products: [Products.Transactions],
    //   country_codes: [CountryCode.Us],
    //   language: "en",
    // });
    // return NextResponse.json({ link_token: response.data.link_token });

    return NextResponse.json({
      link_token: `demo_link_token_${Date.now()}`,
      demo: true,
      message:
        "Running in demo mode. Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local for real bank connections.",
    });
  } catch (error) {
    console.error("Plaid link token error:", error);
    return NextResponse.json({ error: "Failed to create link token" }, { status: 500 });
  }
}
