# The Curator — Subscription Tracker

A clean, manual subscription tracker built for startups and teams. Log every recurring cost once, and The Curator automatically tracks renewals forever — no bank linking required.

---

## Features

- **Dashboard** — Total monthly spend at a glance, subscriptions grouped by category, 7-day renewal forecast
- **Subscription list** — Filter by status/category, sort by renewal date, amount, or name
- **Add subscription** — Enter name, amount, billing cycle, and a start date; next renewal is always computed automatically
- **Subscription detail** — Spending trend chart, full payment history, auto-renew toggle
- **Reminders** — 7-day upcoming renewals, configurable advance notice, push/email/quiet mode toggles
- **Insights** — Monthly spend trend, category breakdown, KPI cards, savings spotlight
- **Payment Method field** — Optional card reference (e.g. "Visa ••4242") reserved for future card integration

## How renewal tracking works

There is no "next renewal date" input. You enter a **start date** once and pick a billing cycle. The app computes the next renewal dynamically on every load:

```
computeNextRenewal("2023-01-15", "Monthly")
→ steps forward month by month from Jan 15, 2023
→ returns the first date >= today  →  Apr 15, 2026
```

This means the renewal date is always accurate and never goes stale — even if you haven't opened the app in months.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS with custom design system |
| State | React Context + localStorage |
| Language | TypeScript |
| Hosting | Vercel |

---

## Local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Production build check
npm run build
```

No environment variables are required — the app ships with sample data and stores everything in `localStorage`.

---

## Deploy to Vercel

### Option 1 — Vercel dashboard (recommended, ~2 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** → select `shrishti-exe/subscription-tracker`
3. Leave all settings as default — Vercel auto-detects Next.js
4. Click **Deploy**
5. Done. You'll get a live URL like `https://subscription-tracker-xyz.vercel.app`

No environment variables needed for the base app.

### Option 2 — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Project structure

```
app/
├── page.tsx                  # Dashboard
├── subscriptions/
│   ├── page.tsx              # All subscriptions list
│   ├── add/page.tsx          # Add subscription form
│   └── [id]/page.tsx         # Subscription detail
├── reminders/page.tsx        # Renewal alerts + preferences
├── insights/page.tsx         # Analytics
└── globals.css

components/
├── SideNav.tsx               # Desktop sidebar
├── BottomNav.tsx             # Mobile tab bar
└── TopBar.tsx                # Header with search

lib/
├── mockData.ts               # Sample data + computeNextRenewal()
└── store.tsx                 # React context + localStorage

types/
└── index.ts                  # Subscription, Payment, AlertPreferences
```

## Key function

```typescript
// lib/mockData.ts
export function computeNextRenewal(
  startDate: string,
  billingCycle: BillingCycle
): string
```

Given a subscription's start date and billing cycle, returns the next upcoming renewal date as an ISO string. Steps forward in cycle increments until the date is >= today. Used everywhere in place of a stored `nextRenewal` field.

---

## Roadmap

- [ ] Card/payment method integration (`linkedAccount` field already reserved)
- [ ] Team/multi-user support
- [ ] CSV export
- [ ] Supabase backend for persistent cross-device storage
- [ ] Email/push notifications via Resend
