import { SITE_URL } from "@/lib/seo";

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "ropes-search-intel-2026-key";
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/api/indexing/indexnow`;

export type IndexingTrigger = "CREATED" | "UPDATED" | "DELETED";

export async function submitToIndexNow(urls: string[], trigger: IndexingTrigger = "UPDATED"): Promise<{ success: boolean; status?: number; count: number }> {
  if (!urls || urls.length === 0) {
    return { success: true, count: 0 };
  }

  const host = new URL(SITE_URL).hostname;
  const canonicalUrls = urls.map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`));

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: canonicalUrls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const isOk = res.status >= 200 && res.status < 300;
    console.info(`[IndexNow] ${trigger} submitted ${canonicalUrls.length} URLs. Status: ${res.status}`);
    return { success: isOk, status: res.status, count: canonicalUrls.length };
  } catch (err) {
    console.error("[IndexNow] Submission failed:", err);
    return { success: false, count: canonicalUrls.length };
  }
}
