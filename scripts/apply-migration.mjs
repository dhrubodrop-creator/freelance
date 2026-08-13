// Applies a .sql migration file to production Supabase via the Management
// API (https://api.supabase.com/v1/projects/{ref}/database/query), since
// PostgREST (the app's normal Supabase client) can't run DDL. Requires
// SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in .env.local (a personal
// access token from https://supabase.com/dashboard/account/tokens — never
// committed, never used by the deployed app).
//
// Usage: node scripts/apply-migration.mjs supabase/migrations/0013_diagnostic.sql

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-migration.sql>");
  process.exit(1);
}

const sql = readFileSync(filePath, "utf8");

const res = await fetch(
  `https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

const body = await res.json().catch(() => null);

if (!res.ok) {
  console.error(`FAILED (${res.status}):`, JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log(`Applied ${filePath} successfully.`);
if (body) console.log(JSON.stringify(body, null, 2));
