import { supabaseAdmin } from "@/lib/supabase/server";
import { AnnouncementsTable } from "@/components/admin/announcements-table";
import type { AnnouncementRow } from "@/types/db";

export default async function AdminAnnouncementsPage() {
  const { data } = await supabaseAdmin()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  const announcements = (data ?? []) as AnnouncementRow[];

  return <AnnouncementsTable announcements={announcements} />;
}
