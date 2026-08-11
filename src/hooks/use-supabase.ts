"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

import { supabaseBrowser } from "@/lib/supabase/browser";

/** Client-side Supabase client scoped to the current Clerk session. */
export function useSupabase() {
  const { getToken } = useAuth();

  return useMemo(
    () => supabaseBrowser(() => getToken({ template: "supabase" })),
    [getToken]
  );
}
