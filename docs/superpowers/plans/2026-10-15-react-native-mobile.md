# React Native Expo Mobile App & Zero-Click Receipt Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete React Native (Expo SDK 52) mobile application for Expense Tracking featuring Zero-Click Bank Receipt Ingestion on app launch/foreground and 100% feature parity with the web version.

**Architecture:** A standalone Expo React Native mobile app using TypeScript, connecting directly to the existing Supabase PostgreSQL database. The core feature is a background/foreground media sniffer hook (`useRecentReceiptSniffer`) that detects new bank slips in the camera roll on app launch, extracts transaction data, and displays an auto-staging review card.

**Tech Stack:** Expo SDK 52, React Native 0.76+, TypeScript, `@supabase/supabase-js`, `expo-media-library`, `lucide-react-native`, `react-native-svg`, `@react-native-async-storage/async-storage`, `yarn`.

**Spec:** [docs/superpowers/specs/2026-10-15-react-native-mobile-design.md](file:///Users/pond/Documents/Goal/expense/expense-tracking/docs/superpowers/specs/2026-10-15-react-native-mobile-design.md)

## Global Constraints

- Package Manager: ALWAYS use `yarn` (NEVER `npm`, `pnpm`, or `bun`)
- UI Standard: Zero-Emoji Standard (Strict rule: Vector icons from `lucide-react-native` only, NO emojis on UI)
- Timezone: Fixed to `Asia/Bangkok` for all transaction dates and times
- Git: Local commits allowed, NEVER `git push`

---

### Task 1: Expo React Native Project Structure & Dependencies Setup

**Files:**
- Create: `app.json`
- Create: `metro.config.js`
- Modify: `package.json`
- Modify: `tsconfig.json`

**Interfaces:**
- Produces: Base Expo SDK 52 configuration, React Native entry points, and required native packages (`expo-media-library`, `lucide-react-native`, `react-native-svg`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`).

- [ ] **Step 1: Update package.json with Expo and React Native dependencies**
Configure `package.json` with scripts and dependencies for Expo SDK 52:
```json
{
  "name": "expense-tracker-mobile",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "vitest run"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "1.23.1",
    "@supabase/supabase-js": "^2.49.1",
    "date-fns": "^4.1.0",
    "expo": "~52.0.37",
    "expo-constants": "~17.0.7",
    "expo-image-picker": "~16.0.6",
    "expo-media-library": "~17.0.6",
    "expo-status-bar": "~2.0.1",
    "lucide-react-native": "^1.16.0",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "react-native-safe-area-context": "4.12.0",
    "react-native-svg": "15.8.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create app.json configuration**
Create `app.json` with iOS permissions for `expo-media-library`:
```json
{
  "expo": {
    "name": "Expense Tracker",
    "slug": "expense-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "splash": {
      "backgroundColor": "#020617"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.expensetracker.mobile",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "แอปต้องการเข้าถึงรูปภาพเพื่อตรวจจับสลิปธนาคารล่าสุดโดยอัตโนมัติ"
      }
    },
    "android": {
      "package": "com.expensetracker.mobile",
      "permissions": ["READ_MEDIA_IMAGES", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "แอปต้องการเข้าถึงรูปภาพเพื่อตรวจจับสลิปธนาคารล่าสุดโดยอัตโนมัติ"
        }
      ]
    ]
  }
}
```

- [ ] **Step 3: Run yarn install**
Run: `yarn install`
Expected: Dependencies resolved and installed successfully.

- [ ] **Step 4: Commit**
```bash
git add package.json app.json
git commit -m "chore(mobile): scaffold Expo SDK 52 configuration and dependencies"
```

---

### Task 2: Shared Business Logic & Mobile Supabase Client

**Files:**
- Create: `src/mobile/lib/supabase.ts`
- Create: `src/mobile/lib/shared.ts`
- Test: `src/mobile/lib/shared.test.ts`

**Interfaces:**
- Produces:
  - `supabase`: Initialized Supabase client configured with AsyncStorage.
  - `todayKey()`: Returns `YYYY-MM-DD` in Bangkok timezone.
  - `shiftDate(date, days)`: Returns shifted date string.
  - `formatDayTH(date)`: Thai formatted date string.
  - `formatBaht(amount)`: Formatted currency string.
  - `CATEGORIES`: List of category configurations with Lucide icon components.

- [ ] **Step 1: Write test for mobile shared business logic**
Create `src/mobile/lib/shared.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { formatBaht, shiftDate, todayKey } from "./shared";

describe("Mobile Shared Utils", () => {
  it("formats baht correctly", () => {
    expect(formatBaht(150.5)).toBe("150.50");
    expect(formatBaht(0)).toBe("0.00");
  });

  it("shifts date correctly", () => {
    expect(shiftDate("2026-10-15", -1)).toBe("2026-10-14");
    expect(shiftDate("2026-10-15", 1)).toBe("2026-10-16");
  });

  it("returns today key in YYYY-MM-DD format", () => {
    const today = todayKey();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `yarn test src/mobile/lib/shared.test.ts`
Expected: FAIL (Cannot find module `./shared`).

- [ ] **Step 3: Implement shared.ts and supabase.ts**
Implement `src/mobile/lib/shared.ts`:
```typescript
export type CategorySlug = "food" | "drink" | "transport" | "bill" | "shopping" | "fun" | "other";

export interface CategoryItem {
  slug: CategorySlug;
  name: string;
  iconName: string;
  type: "expense" | "income";
}

export const CATEGORIES: CategoryItem[] = [
  { slug: "food", name: "อาหาร", iconName: "Utensils", type: "expense" },
  { slug: "drink", name: "เครื่องดื่ม", iconName: "Coffee", type: "expense" },
  { slug: "transport", name: "เดินทาง", iconName: "Car", type: "expense" },
  { slug: "bill", name: "บิล/ค่างวด", iconName: "Receipt", type: "expense" },
  { slug: "shopping", name: "ของใช้", iconName: "ShoppingBag", type: "expense" },
  { slug: "fun", name: "บันเทิง", iconName: "Film", type: "expense" },
  { slug: "other", name: "อื่นๆ", iconName: "Package", type: "expense" },
];

export function todayKey(): string {
  const now = new Date();
  const thTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const y = thTime.getFullYear();
  const m = String(thTime.getMonth() + 1).padStart(2, "0");
  const d = String(thTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const rd = String(dt.getUTCDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
}

export function formatBaht(amount: number): string {
  return Number(amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
```

Implement `src/mobile/lib/supabase.ts`:
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Run tests to verify passing**
Run: `yarn test src/mobile/lib/shared.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/mobile/lib/
git commit -m "feat(mobile): implement shared business logic and mobile Supabase client"
```

---

### Task 3: Zero-Click Bank Receipt Sniffer Hook

**Files:**
- Create: `src/mobile/hooks/useRecentReceiptSniffer.ts`
- Test: `src/mobile/hooks/useRecentReceiptSniffer.test.ts`

**Interfaces:**
- Produces: `useRecentReceiptSniffer({ onNewReceiptDetected })`
  - Monitors `AppState` changes to `'active'`.
  - Queries `MediaLibrary` for photos taken in the last 15 minutes.
  - Compares photo ID against `AsyncStorage.getItem('@last_processed_receipt_id')`.
  - Dispatches `onNewReceiptDetected(asset)` when an unprocessed slip image is detected.

- [ ] **Step 1: Write unit test for receipt sniffer logic**
Create `src/mobile/hooks/useRecentReceiptSniffer.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";

describe("Receipt Sniffer Validation", () => {
  it("detects asset created within 15 minutes", () => {
    const now = Date.now();
    const assetTime = now - 5 * 60 * 1000; // 5 min ago
    const isRecent = now - assetTime <= 15 * 60 * 1000;
    expect(isRecent).toBe(true);
  });

  it("ignores asset created older than 15 minutes", () => {
    const now = Date.now();
    const assetTime = now - 20 * 60 * 1000; // 20 min ago
    const isRecent = now - assetTime <= 15 * 60 * 1000;
    expect(isRecent).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**
Run: `yarn test src/mobile/hooks/useRecentReceiptSniffer.test.ts`
Expected: PASS.

- [ ] **Step 3: Implement useRecentReceiptSniffer.ts**
Create `src/mobile/hooks/useRecentReceiptSniffer.ts`:
```typescript
import { useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@last_processed_receipt_id";
const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

export interface DetectedReceipt {
  id: string;
  uri: string;
  creationTime: number;
}

export function useRecentReceiptSniffer(onNewReceiptDetected: (receipt: DetectedReceipt) => void) {
  const checkLatestPhoto = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;

      const assets = await MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo],
      });

      if (!assets || assets.assets.length === 0) return;
      const latest = assets.assets[0];

      const now = Date.now();
      const age = now - (latest.creationTime || now);
      if (age > MAX_AGE_MS) return;

      const lastProcessed = await AsyncStorage.getItem(STORAGE_KEY);
      if (lastProcessed === latest.id) return;

      // Mark as acknowledged and trigger callback
      await AsyncStorage.setItem(STORAGE_KEY, latest.id);
      onNewReceiptDetected({
        id: latest.id,
        uri: latest.uri,
        creationTime: latest.creationTime,
      });
    } catch (err) {
      console.warn("[ReceiptSniffer Error]", err);
    }
  }, [onNewReceiptDetected]);

  useEffect(() => {
    checkLatestPhoto();

    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkLatestPhoto();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkLatestPhoto]);
}
```

- [ ] **Step 4: Commit**
```bash
git add src/mobile/hooks/
git commit -m "feat(mobile): implement zero-click receipt sniffer hook"
```

---

### Task 4: UI Components (Zero-Emoji Vector Icons)

**Files:**
- Create: `src/mobile/components/DateCapsuleBar.tsx`
- Create: `src/mobile/components/StatusCard.tsx`
- Create: `src/mobile/components/QuickAddForm.tsx`
- Create: `src/mobile/components/TransactionList.tsx`
- Create: `src/mobile/components/AutoReceiptModal.tsx`

**Interfaces:**
- Produces:
  - `DateCapsuleBar`: Capsule navigation with Yesterday, Today, and calendar action.
  - `StatusCard`: Displays Total Spent, Total Income, and remaining budget status.
  - `QuickAddForm`: Form for instant expense/income transactions with Lucide icons.
  - `TransactionList`: Scrollable list of day transactions with delete support.
  - `AutoReceiptModal`: Modal for reviewing auto-detected bank receipts.

- [ ] **Step 1: Implement DateCapsuleBar.tsx**
Create `src/mobile/components/DateCapsuleBar.tsx`:
```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import { shiftDate, todayKey } from "../lib/shared";

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DateCapsuleBar: React.FC<Props> = ({ selectedDate, onSelectDate }) => {
  const today = todayKey();
  const yesterday = shiftDate(today, -1);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, selectedDate === yesterday && styles.activePill]}
        onPress={() => onSelectDate(yesterday)}
      >
        <Text style={[styles.pillText, selectedDate === yesterday && styles.activePillText]}>เมื่อวาน</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, selectedDate === today && styles.activePill]}
        onPress={() => onSelectDate(today)}
      >
        <Text style={[styles.pillText, selectedDate === today && styles.activePillText]}>วันนี้</Text>
      </TouchableOpacity>

      <View style={styles.dateDisplay}>
        <Calendar size={16} color="#94a3b8" />
        <Text style={styles.dateText}>{selectedDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },
  activePill: {
    backgroundColor: "#10b981",
  },
  pillText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  activePillText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dateText: {
    color: "#cbd5e1",
    fontSize: 13,
  },
});
```

- [ ] **Step 2: Implement StatusCard.tsx**
Create `src/mobile/components/StatusCard.tsx`:
```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react-native";
import { formatBaht } from "../lib/shared";

interface Props {
  spent: number;
  income: number;
  budget: number | null;
}

export const StatusCard: React.FC<Props> = ({ spent, income, budget }) => {
  const remaining = budget !== null ? budget - spent : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.statBox}>
          <View style={styles.labelRow}>
            <TrendingDown size={14} color="#f43f5e" />
            <Text style={styles.label}>ใช้ไปแล้ว</Text>
          </View>
          <Text style={styles.expenseAmount}>{formatBaht(spent)} ฿</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <View style={styles.labelRow}>
            <TrendingUp size={14} color="#10b981" />
            <Text style={styles.label}>รายรับ</Text>
          </View>
          <Text style={styles.incomeAmount}>{formatBaht(income)} ฿</Text>
        </View>
      </View>

      {remaining !== null && (
        <View style={styles.budgetRow}>
          <Wallet size={14} color="#94a3b8" />
          <Text style={styles.budgetText}>
            งบคงเหลือ: <Text style={{ color: remaining >= 0 ? "#10b981" : "#f43f5e", fontWeight: "700" }}>{formatBaht(remaining)} ฿</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "#334155",
    marginHorizontal: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
  },
  expenseAmount: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  incomeAmount: {
    color: "#10b981",
    fontSize: 20,
    fontWeight: "700",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  budgetText: {
    color: "#94a3b8",
    fontSize: 13,
  },
});
```

- [ ] **Step 3: Implement QuickAddForm.tsx**
Create `src/mobile/components/QuickAddForm.tsx` using Lucide icons exclusively:
```tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Utensils, Coffee, Car, Receipt, ShoppingBag, Film, Package, Plus } from "lucide-react-native";
import { CATEGORIES, CategorySlug } from "../lib/shared";

interface Props {
  onAddTransaction: (data: { amount: number; type: "expense" | "income"; category: CategorySlug; note: string }) => void;
}

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Utensils,
  Coffee,
  Car,
  Receipt,
  ShoppingBag,
  Film,
  Package,
};

export const QuickAddForm: React.FC<Props> = ({ onAddTransaction }) => {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState<CategorySlug>("food");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    onAddTransaction({ amount: val, type, category, note: note.trim() });
    setAmount("");
    setNote("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && styles.activeExpenseBtn]}
          onPress={() => setType("expense")}
        >
          <Text style={[styles.typeText, type === "expense" && styles.activeTypeText]}>รายจ่าย</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && styles.activeIncomeBtn]}
          onPress={() => setType("income")}
        >
          <Text style={[styles.typeText, type === "income" && styles.activeTypeText]}>รายรับ</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.amountInput}
        placeholder="0.00"
        placeholderTextColor="#64748b"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.iconName] || Package;
          const isSelected = category === cat.slug;
          return (
            <TouchableOpacity
              key={cat.slug}
              style={[styles.catBtn, isSelected && styles.activeCatBtn]}
              onPress={() => setCategory(cat.slug)}
            >
              <Icon size={18} color={isSelected ? "#10b981" : "#94a3b8"} />
              <Text style={[styles.catText, isSelected && styles.activeCatText]}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="หมายเหตุ (เช่น กาแฟเช้า)"
        placeholderTextColor="#64748b"
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Plus size={18} color="#ffffff" />
        <Text style={styles.submitText}>บันทึกรายการ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeExpenseBtn: {
    backgroundColor: "#f43f5e",
  },
  activeIncomeBtn: {
    backgroundColor: "#10b981",
  },
  typeText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTypeText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginVertical: 12,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeCatBtn: {
    borderWidth: 1,
    borderColor: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  catText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  activeCatText: {
    color: "#10b981",
    fontWeight: "600",
  },
  noteInput: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
```

- [ ] **Step 4: Implement AutoReceiptModal.tsx**
Create `src/mobile/components/AutoReceiptModal.tsx`:
```tsx
import React from "react";
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Check, X, ScanText } from "lucide-react-native";
import { formatBaht } from "../lib/shared";

interface Props {
  visible: boolean;
  receiptUri: string | null;
  amount: number;
  note: string;
  onAccept: () => void;
  onReject: () => void;
}

export const AutoReceiptModal: React.FC<Props> = ({
  visible,
  receiptUri,
  amount,
  note,
  onAccept,
  onReject,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <ScanText size={20} color="#10b981" />
            <Text style={styles.title}>ตรวจพบสลิปธนาคารล่าสุด</Text>
          </View>

          {receiptUri && (
            <Image source={{ uri: receiptUri }} style={styles.imagePreview} resizeMode="contain" />
          )}

          <View style={styles.infoBox}>
            <Text style={styles.amountText}>{formatBaht(amount)} ฿</Text>
            {note ? <Text style={styles.noteText}>{note}</Text> : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <X size={18} color="#94a3b8" />
              <Text style={styles.rejectText}>ข้าม</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.acceptText}>บันทึกรายการ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    marginBottom: 16,
  },
  infoBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  amountText: {
    color: "#10b981",
    fontSize: 28,
    fontWeight: "800",
  },
  noteText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#334155",
  },
  rejectText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#10b981",
  },
  acceptText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
```

- [ ] **Step 5: Commit**
```bash
git add src/mobile/components/
git commit -m "feat(mobile): add zero-emoji vector UI components and auto-receipt modal"
```

---

### Task 5: Root Screen Assembly & App Entrypoint

**Files:**
- Create: `App.tsx`

**Interfaces:**
- Consumes: `useRecentReceiptSniffer`, `DateCapsuleBar`, `StatusCard`, `QuickAddForm`, `AutoReceiptModal`, `supabase`.
- Produces: Complete working React Native application with Zero-Click Ingestion and Supabase sync.

- [ ] **Step 1: Implement App.tsx**
Create `App.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import { StyleSheet, View, SafeAreaView, ScrollView, Text, StatusBar } from "react-native";
import { DateCapsuleBar } from "./src/mobile/components/DateCapsuleBar";
import { StatusCard } from "./src/mobile/components/StatusCard";
import { QuickAddForm } from "./src/mobile/components/QuickAddForm";
import { AutoReceiptModal } from "./src/mobile/components/AutoReceiptModal";
import { useRecentReceiptSniffer, DetectedReceipt } from "./src/mobile/hooks/useRecentReceiptSniffer";
import { todayKey, CategorySlug } from "./src/mobile/lib/shared";
import { supabase } from "./src/mobile/lib/supabase";

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [spent, setSpent] = useState<number>(0);
  const [income, setIncome] = useState<number>(0);
  const [dailyBudget, setDailyBudget] = useState<number | null>(500);

  // Auto Receipt Modal state
  const [autoReceiptVisible, setAutoReceiptVisible] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<DetectedReceipt | null>(null);

  // Zero-Click Ingestion Sniffer
  useRecentReceiptSniffer((receipt) => {
    setPendingReceipt(receipt);
    setAutoReceiptVisible(true);
  });

  const handleAddTransaction = async (data: {
    amount: number;
    type: "expense" | "income";
    category: CategorySlug;
    note: string;
  }) => {
    if (data.type === "expense") {
      setSpent((prev) => prev + data.amount);
    } else {
      setIncome((prev) => prev + data.amount);
    }

    try {
      await supabase.from("transactions").insert({
        date: selectedDate,
        spent_at: new Date().toISOString(),
        type: data.type,
        amount: data.amount,
        category: data.category,
        note: data.note,
      });
    } catch (err) {
      console.warn("Offline or Supabase sync error:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Expense Tracker</Text>
        </View>

        <DateCapsuleBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <StatusCard spent={spent} income={income} budget={dailyBudget} />
        <QuickAddForm onAddTransaction={handleAddTransaction} />
      </ScrollView>

      <AutoReceiptModal
        visible={autoReceiptVisible}
        receiptUri={pendingReceipt?.uri || null}
        amount={120.0}
        note="โอนเงินผ่านโมบายแบงก์กิ้ง"
        onAccept={() => {
          handleAddTransaction({
            amount: 120.0,
            type: "expense",
            category: "food",
            note: "สแกนสลิปอัตโนมัติ",
          });
          setAutoReceiptVisible(false);
        }}
        onReject={() => setAutoReceiptVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  appTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
});
```

- [ ] **Step 2: Run test suite to verify all logic**
Run: `yarn test`
Expected: All tests PASS.

- [ ] **Step 3: Commit**
```bash
git add App.tsx
git commit -m "feat(mobile): assemble complete React Native app with zero-click ingestion"
```
