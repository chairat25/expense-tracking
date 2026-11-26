# Landing Hub & Multi-Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a visual Landing Hub with 3 distinct large color-coded buttons/cards (Daily Expenses, Monthly Debts, Salary) and route users into separated, focused workspaces with mutual switching.

**Architecture:** Next.js App Router sub-routes (`/` for Landing Hub, `/daily` for Daily Expenses, `/debts` for Monthly Debts, and `/salary` for Salary Management). A shared header workspace switcher allows switching between workspaces or returning to the Landing Hub.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-landing-workspace-hub-design.md`

## Global Constraints
- Zero-Emoji Standard: Strictly no emojis in UI. Use Lucide vector icons only.
- Package Manager: `yarn` only. Never `npm` or `pnpm`.
- Git Policy: NEVER run `git push`. Commit locally only.
- Defensive Programming: Mandatory optional chaining (`?.`) and safe default fallbacks for nested objects.

---

### Task 1: Create Reusable WorkspaceSwitcher & WorkspaceHeader Components

**Files:**
- Create: `src/components/WorkspaceHeader.tsx`
- Test: `src/components/WorkspaceHeader.test.tsx`

**Interfaces:**
- Produces: `WorkspaceHeader` component taking `activeWorkspace: "landing" | "daily" | "debts" | "salary"` and optional custom right-side actions.

- [ ] **Step 1: Write unit tests for WorkspaceHeader**
- [ ] **Step 2: Run test to verify it fails** (`yarn test src/components/WorkspaceHeader.test.tsx`)
- [ ] **Step 3: Implement `WorkspaceHeader.tsx` with popover switcher**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 2: Create LandingHubView Component

**Files:**
- Create: `src/components/LandingHubView.tsx`
- Test: `src/components/LandingHubView.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceHeader` from Task 1, `lucide-react` icons.
- Produces: `LandingHubView` rendering 3 distinct color-coded workspace cards (Emerald: Daily, Rose: Debts, Indigo: Salary).

- [ ] **Step 1: Write unit tests for LandingHubView**
- [ ] **Step 2: Run test to verify it fails** (`yarn test src/components/LandingHubView.test.tsx`)
- [ ] **Step 3: Implement `LandingHubView.tsx` with responsive layout, zero-emoji, hover glow, and deep links**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 3: Implement DebtsWorkspaceView and SalaryWorkspaceView

**Files:**
- Create: `src/components/DebtsWorkspaceView.tsx`
- Create: `src/components/SalaryWorkspaceView.tsx`
- Test: `src/components/Workspaces.test.tsx`

**Interfaces:**
- Produces: `DebtsWorkspaceView` and `SalaryWorkspaceView` components providing dedicated workspace structures.

- [ ] **Step 1: Write unit tests for both workspace views**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `DebtsWorkspaceView.tsx` and `SalaryWorkspaceView.tsx`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 4: Configure App Router Routes and Connect Workspaces

**Files:**
- Modify: `src/app/page.tsx` (render `LandingHubView`)
- Create: `src/app/daily/page.tsx` (render `HomeView`)
- Create: `src/app/debts/page.tsx` (render `DebtsWorkspaceView`)
- Create: `src/app/salary/page.tsx` (render `SalaryWorkspaceView`)
- Modify: `src/components/HomeView.tsx` (embed Workspace Switcher in header)

- [ ] **Step 1: Update routes in `src/app/`**
- [ ] **Step 2: Update `HomeView.tsx` with workspace switcher pill**
- [ ] **Step 3: Run all unit tests** (`yarn test`)
- [ ] **Step 4: Run production build** (`yarn build:web`)
- [ ] **Step 5: Commit changes**
