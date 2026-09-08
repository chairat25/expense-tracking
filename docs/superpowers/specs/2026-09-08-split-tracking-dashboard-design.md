# Design Spec: Split Expense Tracking & Expense Dashboard

## 1. Overview & Goals

- **Objective**: Restructure the expense management ecosystem into two dedicated applications sharing a single Supabase PostgreSQL database:
  1. **`expense-tracking` (Frontend)**: Ultra-minimalist, mobile-first quick logger for recording daily transactions in seconds and viewing today's expenses and budget quota.
  2. **`expense-dashboard` (Backoffice)**: Upgraded from `expense-tracking-management` to serve as a comprehensive desktop/web portal for deep financial analytics, spreadsheets, and setting budget/salary quotas (daily, weekly, monthly) that feed into the tracking app.

---

## 2. System Architecture & Boundaries

```
                 +-----------------------------------+
                 |     Supabase PostgreSQL DB        |
                 |  (Transactions, Budgets, Users,   |
                 |   Categories, Salaries, Settings) |
                 +-----------------+-----------------+
                                   |
                +------------------+------------------+
                |                                     |
                v                                     v
+-------------------------------+   +------------------------------------+
|       expense-tracking        |   |         expense-dashboard          |
|  (Mobile-First Quick Logger)  |   | (Analytics, Spreadsheets & Admin)  |
|                               |   |                                    |
| - Header (Date + Profile)     |   | - Financial Analytics & Charts     |
| - Today's Summary & Status    |   | - Monthly Spreadsheet & History    |
| - Quick Add Form (Instant)    |   | - Budget & Salary Planner          |
| - Today's Timeline Only       |   | - Category & User Management       |
| - Profile Modal (Budget View) |   |                                    |
+-------------------------------+   +------------------------------------+
```

---

## 3. Detailed Component Specifications

### 3.1 `expense-tracking` (Client App)

#### User Interface
- **Header**:
  - Displays current date formatted in Thai (e.g. `วันอังคาร 8 ก.ย. 2026`).
  - Profile avatar button triggering the Profile Modal.
- **Today's Status Card**:
  - Big metric: Total amount spent today (`฿XXX.XX`).
  - Subtitle metric: Comparison against assigned daily budget if set (e.g. `จากงบรายวัน ฿500.00 · เหลือ ฿160.00`).
- **Quick Add Form**:
  - Number input with automatic focus, numpad input mode, clear button.
  - Type toggle: **รายจ่าย (Expense)** [default] / **รายรับ (Income)**.
  - Category selector: Clean pill chips with emojis (Food, Drink, Transport, Bill, Shopping, Other).
  - Note input (optional).
  - Primary "บันทึก" button (submits, clears input, refocuses).
- **Today's Timeline**:
  - Lists only transactions for the current date (`Asia/Bangkok`), ordered newest first.
  - Row details: Category icon, category name / note, time (`spentAt`), formatted amount, delete button.
  - Empty state with clean friendly illustration/icon when 0 transactions exist today.
- **Profile Modal**:
  - User details (Email / Display Name).
  - Read-only Budget Summary card:
    - ☀️ **งบรายวัน (Daily Budget)**
    - 📆 **งบรายสัปดาห์ (Weekly Budget)**
    - 📅 **งบประจำเดือน (Monthly Budget / Salary)**
  - Logout button.

#### Deprecations & Clean-up
- Remove all unused bloated features:
  - Community, friendships, and 1-on-1 chat
  - Memo topics, checklist entries, mileage and maintenance trackers
  - Month carousel / Month strip, monthly spreadsheets, end-of-month carryover card
  - Daily motivational quote overlay
  - Notification center & sidebars

---

### 3.2 `expense-dashboard` (Backoffice App)

#### User Interface & Modules
- **Overview & Financial Analytics**:
  - Expense breakdown by category (Pie / Bar charts).
  - Daily spending trends, weekly spending aggregations, monthly comparisons.
- **Transactions & Monthly Ledger**:
  - Full tabular ledger of all historical transactions with filtering by date, category, type, and user.
  - In-place transaction editing and deletion.
- **Budget & Salary Manager**:
  - Configures user budget parameters:
    - Monthly salary / budget (`salaries`, `user_settings.defaultSalary`)
    - Weekly budget envelopes (`weekly_envelopes`)
    - Daily budget allocation (`daily_budgets`)
  - Writes directly to the shared Supabase DB so `expense-tracking` reads updated budget figures immediately.
- **Category & User Management**:
  - Manage standard categories (icon, slug, name, type, sort order).
  - User administration.

---

## 4. Shared Database Schema Contracts

Both apps operate against the identical PostgreSQL database:
- `transactions`: Core transactions (`userId`, `date`, `spentAt`, `type`, `amount`, `category`, `note`).
- `user_settings`: User configuration (`userId`, `budgetMode`, `defaultSalary`).
- `daily_budgets`: Daily budget targets (`userId`, `date`, `amount`).
- `salaries` & `weekly_envelopes`: Monthly and weekly budget allocations.
- `app_categories`: Standard category definitions.
- `user_profiles`: User profile information (`displayName`, `avatarUrl`, `bio`).

---

## 5. Testing & Verification Plan

1. **`expense-tracking` Verification**:
   - `npm run build` succeeds with zero TypeScript or Lint errors.
   - Quick Add adds a transaction in <1 second and updates today's total immediately.
   - Deleting a transaction removes it and recalculates today's total.
   - Profile modal correctly fetches and displays daily, weekly, and monthly budget targets.
   - Responsive layout works seamlessly on mobile viewports.

2. **`expense-dashboard` Verification**:
   - `npm run build` passes without errors.
   - Dashboard loads aggregated analytics and transaction history.
   - Setting a budget quota in the dashboard immediately updates the database.
