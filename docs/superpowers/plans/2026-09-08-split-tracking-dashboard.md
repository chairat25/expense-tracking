# Split Expense Tracking & Expense Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the expense management platform into an ultra-clean, mobile-first daily logger (`expense-tracking`) and a full-featured financial analytics & budget management backoffice (`expense-dashboard`) sharing a Supabase Postgres DB.

**Architecture:** 
- `expense-tracking` is reduced to a single-page quick transaction logger with today's spending timeline and a profile modal showing assigned daily/weekly/monthly budget quotas. All legacy bulky components (chat, memo, community, full spreadsheets) are excised.
- `expense-dashboard` (upgraded from `expense-tracking-management`) provides the analytics overview, historical transaction spreadsheets, category management, and budget/salary planner that configures quotas for the tracking app.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, Supabase Auth & PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-09-08-split-tracking-dashboard-design.md`

---

## Global Constraints
- Timezone: `Asia/Bangkok` for all date aggregations and today queries.
- Package Manager: `npm` for this repository.
- DB Schema: Shared Supabase PostgreSQL with RLS (`transactions`, `user_settings`, `daily_budgets`, `salaries`, `weekly_envelopes`, `app_categories`, `user_profiles`).

---

## Tasks

### Task 1: Clean Up Unused Legacy Code & Endpoints in `expense-tracking`
- [ ] Remove unused components: `CommunityView.tsx`, `ChatView.tsx`, `DirectChatModal.tsx`, `MemoView.tsx`, `MemoTopicModal.tsx`, `MemoEntryModal.tsx`, `DailyQuotePreScreen.tsx`, `CarryOverCard.tsx`, `SalaryView.tsx`, `MonthStrip.tsx`, `MonthView.tsx`, `Sidebar.tsx`, `NotificationCenter.tsx`, `Onboarding.tsx`, `RestrictedNotice.tsx`.
- [ ] Remove legacy API routes: `community`, `chat`, `memos`, `salary`, `pockets`, `weekly-envelopes`, `weeks`, `notifications`, `savings`, `analytics`, `admin`.
- [ ] Keep essential API routes: `/api/transactions`, `/api/categories`, `/api/profile`, `/api/settings`.

### Task 2: Build Minimalist Single-Page Quick Logger in `expense-tracking`
- [ ] Create/update `src/components/HomeView.tsx` with:
  - Header: Thai date formatting + Profile trigger button.
  - Today's Summary Card: Bold Today's Spent metric (`฿XXX.XX`) + comparison against assigned daily budget.
  - Quick Add Form: Large number input with autofocus, Expense/Income toggle, category emoji pills, note input, instant reset on submit.
  - Today's Timeline: Clean list of today's transactions with time, category icon, amount, and delete button.
  - Profile Modal: Showing user info, assigned budget quotas (Daily, Weekly, Monthly), and Logout.
- [ ] Update `src/app/page.tsx` and `src/app/layout.tsx` to render the clean layout without bloated overlays.

### Task 3: Update Profile & Settings APIs in `expense-tracking`
- [ ] Ensure `GET /api/profile` returns user profile alongside the current active daily budget, weekly budget envelope, and monthly salary for display in the Profile Modal.
- [ ] Ensure `GET /api/transactions` and `POST /api/transactions` properly handle today's transactions and category mappings.

### Task 4: Enhance `expense-dashboard` (Backoffice Portal)
- [ ] In `expense-tracking-management`:
  - Implement **Overview & Financial Analytics** tab (Total spending, category breakdown, trend charts).
  - Implement **Transactions Ledger** tab (View, search, and manage all historical transactions).
  - Implement **Budget & Salary Planner** tab (Set Daily Budget, Weekly Envelope, and Monthly Salary).
  - Retain Category Management & User Management.

### Task 5: End-to-End Verification & Build Check
- [ ] Run `npm run build` in `expense-tracking` — must pass cleanly without TypeScript or lint errors.
- [ ] Run `npm run build` in `expense-tracking-management` — must pass cleanly.
- [ ] Verify transactions entry, today's calculation, and budget quota display.
