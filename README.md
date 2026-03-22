# The Curator

**The smarter way to track your startup's subscriptions.**

Most startups have 20–40 SaaS tools running at any given time. Half the team doesn't know what they are. A third are forgotten and still billing. The Curator fixes that — a clean, team-shared dashboard where you log every recurring cost once and never lose track of what you're paying for.

No bank linking. No auto-detection. Just accurate, permanent records that stay honest.

---

## What it does

### For the whole team
Every subscription your startup runs — Figma, Linear, AWS, Notion, Slack, Loom — in one place. Add it once with a name, amount, billing cycle, and start date. The Curator handles all the renewal math automatically, forever. Open it in six months and every renewal date is still correct.

### Dashboard
Total monthly spend front and center. Subscriptions grouped by category (Design, Productivity, Entertainment, etc.). A 7-day forecast sidebar that tells you exactly what's billing this week and how much it'll cost.

### Subscription detail
Tap any subscription to see a full spending trend chart, auto-generated payment history, days until next renewal, year-to-date spend, and the option to cancel or delete it. Every field is computed — nothing goes stale.

### Reminders
A dedicated renewals view that shows everything due in the next 7 days, ranked by date. Configure how many days in advance you want to be warned, toggle push/email alerts, set quiet hours.

### Insights
Monthly spend trend over 6 months, category breakdown with percentages, your most expensive subscription, KPI cards (monthly total, annual projection, avg cost per tool). Useful for end-of-quarter reviews or whenever someone asks "wait, how much are we spending on software?"

### Team workspaces *(requires Supabase)*
Create a team, invite teammates by email, and share a single subscription list across the whole org. Role-based access (owner → admin → member). Switch between personal and team workspaces.

### Google sign-in *(requires Supabase)*
One click to sign in with Google. Data syncs to your Supabase database and persists across devices and teammates. Without Supabase configured the app runs fully in demo mode with localStorage — no sign-in required.

---

## How renewal tracking works

There is no "next renewal date" field. You enter a **start date** once. The app steps forward from that date in billing cycle increments until it lands on a date ≥ today — on every render, dynamically.

```
computeNextRenewal("2023-01-15", "Monthly")
  → Jan 15 → Feb 15 → Mar 15 → ... → Apr 15, 2026  ✓
```

This means renewal dates are always correct, even if you added a subscription two years ago and haven't touched the app since.

---

## Who it's for

- **Early-stage startups** that need a shared place to track SaaS spend before finance tooling becomes necessary
- **Engineering leads** who want to audit what tools the team is actually paying for
- **Founders** doing a quarterly software audit before a board meeting
- **Ops / finance** who are tired of finding surprise invoices for tools nobody uses

It's intentionally not a full spend management platform. It's a clean, fast, honest tracker. Add a subscription in 20 seconds. See your monthly total immediately. Know when things renew before they hit your card.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 with `@theme {}` design tokens |
| State | React Context + localStorage (demo) / Supabase (production) |
| Auth | Supabase Auth with Google OAuth |
| Database | Supabase (Postgres with RLS) |
| Language | TypeScript |
| Fonts | Manrope (headlines) + Inter (body) + Material Symbols |
| Hosting | Vercel |

---

## Getting started locally

```bash
git clone https://github.com/shrishti-exe/subscription-tracker.git
cd subscription-tracker
npm install
npm run dev
```

Open `http://localhost:3000`. It works immediately with no environment variables — demo data is loaded and everything is persisted to `localStorage`.

---

## Enabling Google sign-in and team workspaces

You need a free [Supabase](https://supabase.com) project.

### 1. Create the database schema

Open your Supabase project → SQL Editor → New Query → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) → Run.

This creates three tables with Row Level Security:
- `teams` — team names and ownership
- `team_members` — who belongs to which team, with roles
- `subscriptions` — all subscription data, scoped to a team

### 2. Enable Google OAuth

In your Supabase dashboard → Authentication → Providers → Google → toggle on.

You'll need a Google OAuth app — create one at [console.cloud.google.com](https://console.cloud.google.com):
1. New project → APIs & Services → Credentials → OAuth 2.0 Client ID
2. Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

Paste the Client ID and Client Secret back into Supabase.

Add your app's URL to Supabase → Authentication → URL Configuration → Redirect URLs:
```
https://your-app.vercel.app/auth/callback
```

### 3. Add environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Find these in Supabase → Project Settings → API.

For Vercel, add the same two variables in Project → Settings → Environment Variables.

### 4. Done

Restart the dev server. The Google sign-in button is now live. Signing in creates a session, and any subscriptions you add are stored in Supabase and shared with your team.

---

## Project structure

```
app/
├── page.tsx                   # Dashboard — spend overview + 7-day forecast
├── subscriptions/
│   ├── page.tsx               # All subscriptions, filter + sort
│   ├── add/page.tsx           # Add subscription form
│   └── [id]/page.tsx          # Detail — chart, history, cancel/delete
├── reminders/page.tsx         # Upcoming renewals + alert preferences
├── insights/page.tsx          # Spend analytics + category breakdown
├── profile/page.tsx           # User profile + subscription stats
├── settings/page.tsx          # Team workspace, billing, notifications
├── login/page.tsx             # Google OAuth login
└── auth/callback/route.ts     # OAuth code exchange

components/
├── SideNav.tsx                # Desktop sidebar
├── BottomNav.tsx              # Mobile bottom tab bar
└── TopBar.tsx                 # Header with search

lib/
├── mockData.ts                # Sample data + computeNextRenewal()
├── store.tsx                  # React Context — localStorage + Supabase hybrid
└── supabase/
    ├── client.ts              # Browser client
    ├── server.ts              # Server/RSC client
    └── middleware.ts          # Session refresh helper

supabase/
└── schema.sql                 # Postgres tables + RLS policies (run in Supabase)

types/
└── index.ts                   # Subscription, Payment, AlertPreferences
```

---

## Deploy to Vercel

### Without Supabase (demo mode)

Push to GitHub and import at [vercel.com/new](https://vercel.com/new). No env vars needed. Works immediately.

### With Supabase (full features)

After importing to Vercel, go to Project → Settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Redeploy and Google sign-in + team workspaces will be live.

---

## Roadmap

- [x] Manual subscription tracking with auto-computed renewals
- [x] Dashboard, reminders, insights pages
- [x] Google OAuth via Supabase
- [x] Team workspaces with roles
- [x] Delete subscription
- [ ] Email notifications via Resend
- [ ] CSV / PDF export
- [ ] Card/payment method linking (`linkedAccount` field already reserved)
- [ ] Budget alerts when monthly spend exceeds a threshold
- [ ] Slack integration — renewal reminders in a channel
