# Technical Design: Landing Hub & Separated Workspaces

**Date**: 2026-11-26  
**Status**: Approved  
**Author**: Antigravity Assistant  
**Topic**: Landing Hub and Multi-Workspace Architecture (`/daily`, `/debts`, `/salary`)

---

## 1. Problem Statement & Motivation
Currently, visiting the root route (`/`) immediately opens the daily expense logging screen (`HomeView`). Users need a dedicated, elegant entry landing screen (**Landing Hub**) that categorizes their financial management into 3 distinct, color-coded workspaces before entering:
1. **รายรับ-รายจ่าย รายวัน (Daily Income & Expenses)**: Fast daily transaction logging, receipt scanning, and 14-day history.
2. **หนี้สินรายเดือน (Monthly Debts & Obligations)**: Recurring installments, monthly loan payments, fixed liabilities, and due dates.
3. **เงินเดือน (Salary & Envelopes)**: Monthly paycheck management, allocation into pockets/envelopes (`salary_pockets`), and savings splits.

Each workspace must operate in its own focused view while allowing seamless navigation back to the Hub or across workspaces.

---

## 2. Architecture & Route Design

### 2.1 Route Map
- **`/` (Landing Hub)**:
  - Renders `LandingHubView.tsx`.
  - Prominent headline, user greeting/status, and 3 large interactive cards with distinct brand colors and vector icons.
  - Quick summary indicators and immediate entry actions.
- **`/daily` (Daily Income & Expenses Workspace)**:
  - Renders the existing full-featured `HomeView.tsx`.
  - Header updated with a **Workspace Switcher** pill button next to the title allowing instant switching to `/debts`, `/salary`, or `/`.
- **`/debts` (Monthly Debts Workspace)**:
  - Renders `DebtsWorkspaceView.tsx`.
  - Dedicated workspace structure for managing monthly debt obligations, installment amounts, due dates, and payment status.
  - Matches design tokens and theme of the suite with unified header navigation.
- **`/salary` (Salary & Envelopes Workspace)**:
  - Renders `SalaryWorkspaceView.tsx`.
  - Dedicated workspace structure for paycheck records (`salaries`), allocation pockets (`salary_pockets`), and weekly budget envelopes.
  - Unified header navigation with quick switcher.

---

## 3. UI/UX Specifications

### 3.1 Design Standards & Constraints
- **Zero-Emoji Standard (Strict Rule 6)**: No emojis (`💰`, `💳`, `🚀`, etc.) in UI elements or text. Use official vector icons from `lucide-react` (`WalletCards`, `ReceiptText`, `Banknote`, `ArrowRight`, `ChevronRight`, `Layers`, `ShieldCheck`).
- **Dark Mode Enterprise FinTech**: Background `slate-950`, cards `slate-900/90`, borders `slate-800`, subtle radial glowing accents.
- **Responsive Layout**:
  - Mobile (PWA): Single-column stacked cards with large touch targets (min 48px).
  - Desktop/Tablet: Clean centered grid with hover lifts, glowing borders, and smooth transitions.
- **Card Color Palette**:
  - **Daily Expenses**: Emerald Green (`emerald-500` / `emerald-400` / `bg-emerald-950/40 border-emerald-500/30`).
  - **Monthly Debts**: Rose / Crimson (`rose-500` / `rose-400` / `bg-rose-950/40 border-rose-500/30`).
  - **Salary**: Royal Indigo / Violet (`indigo-500` / `indigo-400` / `bg-indigo-950/40 border-indigo-500/30`).

### 3.2 Workspace Switcher Popover
Integrated into the top navigation header across all 3 workspaces:
- Current workspace pill tag showing current icon + name with a subtle dropdown chevron.
- Tapping opens a compact popover dropdown to jump directly to any of the other 2 workspaces or return to the Landing Hub (`/`).
- Supports `useBodyScrollLock` and backdrop dismiss.

---

## 4. Component Structure

```
src/
├── app/
│   ├── page.tsx                  // Landing Hub Page (/)
│   ├── daily/
│   │   └── page.tsx              // Daily Workspace Route (/daily)
│   ├── debts/
│   │   └── page.tsx              // Monthly Debts Workspace Route (/debts)
│   └── salary/
│       └── page.tsx              // Salary Workspace Route (/salary)
├── components/
│   ├── LandingHubView.tsx        // Full Landing Hub UI with 3 primary action cards
│   ├── WorkspaceHeader.tsx       // Reusable top bar with Workspace Switcher Popover
│   ├── DebtsWorkspaceView.tsx    // Workspace view for monthly debt management
│   ├── SalaryWorkspaceView.tsx   // Workspace view for salary & pocket allocation
│   └── HomeView.tsx              // Enhanced with Workspace Switcher
```

---

## 5. Security & Defensive Programming
- All user property accesses and auth tokens protected via optional chaining (`user?.displayName`, `item?.amount`) with safe default fallbacks.
- Auth protection: Protected middleware / layout redirecting unauthenticated users to `/login`.
- Zero impact on shared production databases; non-destructive local queries and schema reuse.

---

## 6. Testing & Verification Plan
- **Unit Tests**:
  - `LandingHubView.test.tsx`: Render tests for all 3 workspace cards, color classes, and proper navigation paths (`/daily`, `/debts`, `/salary`).
  - `WorkspaceHeader.test.tsx`: Popover open/close toggle and switching behavior.
- **Integration & Build Verification**:
  - `yarn test`: All test suites pass (100% passing rate).
  - `yarn build:web`: Next.js Turbopack build generates clean static and dynamic routes for `/`, `/daily`, `/debts`, and `/salary`.
