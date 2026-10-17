import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { DEFAULT_CATEGORIES, type Budgets, type CategoryOption, type UserProfile } from "../types";

interface CategoriesResponse {
  categories?: CategoryOption[];
}

interface ProfileResponse {
  profile?: UserProfile | null;
  budgets?: Budgets | null;
}

/** หมวดหมู่ + โปรไฟล์ + โควต้างบ (โหลดครั้งเดียวตอนเปิดแอป) */
export function useUserMeta() {
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<Budgets | null>(null);

  useEffect(() => {
    async function load() {
      const [catResult, profResult] = await Promise.allSettled([
        apiFetch<CategoriesResponse>("/api/categories", { cache: "no-store" }),
        apiFetch<ProfileResponse>("/api/profile", { cache: "no-store" }),
      ]);

      if (catResult.status === "fulfilled" && catResult.value.categories?.length) {
        setCategories(catResult.value.categories);
      }
      if (profResult.status === "fulfilled") {
        setProfile(profResult.value.profile ?? null);
        setBudgets(profResult.value.budgets ?? null);
      }
    }
    void load();
  }, []);

  const saveDisplayName = useCallback(async (displayName: string) => {
    const data = await apiFetch<ProfileResponse>("/api/profile", {
      method: "POST",
      body: JSON.stringify({ displayName }),
    });
    setProfile(data.profile ?? null);
  }, []);

  return { categories, profile, budgets, saveDisplayName };
}
