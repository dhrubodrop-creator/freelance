import fs from "fs";
import path from "path";

console.log("==========================================");
console.log(" ROPES SEO & SEARCH REGRESSION TEST SUITE ");
console.log("==========================================");

const ACQUISITION_SLUGS = [
  "ai-freelancing",
  "side-hustle-for-working-professionals",
  "solopreneur-with-ai",
  "turn-skills-into-freelance-services",
  "ai-automation-freelancing",
  "freelancing-without-coding"
];

const TOOL_ROUTES = [
  "/tools/ai-readiness-checker",
  "/tools/freelance-readiness-checker",
  "/tools/production-readiness-checker"
];

const SKILL_SLUGS = [
  "ai-automation",
  "ai-agents",
  "rag",
  "ai-testing",
  "ai-security",
  "mlops",
  "ai-product-management",
  "data-science"
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedChecks++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// 1. Verify File Existence & Structure
console.log("\n[1] File & Utility Existence Checks");
const requiredFiles = [
  "src/lib/seo.ts",
  "src/lib/seo/structured-data.ts",
  "src/lib/seo/indexing.ts",
  "src/app/sitemap.ts",
  "src/app/robots.ts",
  "src/app/(marketing)/tools/ai-readiness-checker/page.tsx",
  "src/app/(marketing)/tools/freelance-readiness-checker/page.tsx",
  "src/app/(marketing)/tools/production-readiness-checker/page.tsx",
  "src/app/admin/search-visibility/page.tsx",
  "src/app/api/indexing/indexnow/route.ts"
];

for (const file of requiredFiles) {
  const fullPath = path.join(process.cwd(), file);
  assert(fs.existsSync(fullPath), `File exists: ${file}`);
}

// 2. Verify Sitemap Coverage
console.log("\n[2] Sitemap Routing Integrity");
const sitemapContent = fs.readFileSync(path.join(process.cwd(), "src/app/sitemap.ts"), "utf8");
for (const route of TOOL_ROUTES) {
  assert(sitemapContent.includes(route), `Sitemap includes tool route: ${route}`);
}

// 3. Verify Robots.txt Security Scoping
console.log("\n[3] Robots.txt Privacy Scoping");
const robotsContent = fs.readFileSync(path.join(process.cwd(), "src/app/robots.ts"), "utf8");
assert(robotsContent.includes('allow: "/"'), "Robots allows root index");
assert(robotsContent.includes('disallow:'), "Robots disallows sensitive paths");
assert(robotsContent.includes('/dashboard'), "Robots disallows /dashboard");
assert(robotsContent.includes('/admin/'), "Robots disallows /admin/");

// 4. Verify Structured Data Engine
console.log("\n[4] Structured Data Engine Exports");
const sdContent = fs.readFileSync(path.join(process.cwd(), "src/lib/seo/structured-data.ts"), "utf8");
assert(sdContent.includes("organizationJsonLd"), "Exports organizationJsonLd");
assert(sdContent.includes("websiteJsonLd"), "Exports websiteJsonLd");
assert(sdContent.includes("webPageJsonLd"), "Exports webPageJsonLd");
assert(sdContent.includes("courseJsonLd"), "Exports courseJsonLd");
assert(sdContent.includes("EducationalOrganization"), "Includes EducationalOrganization schema");

// Summary
console.log("\n==========================================");
console.log(` SUMMARY: ${passedChecks}/${totalChecks} checks PASSED (${failedChecks} failed)`);
console.log("==========================================");

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log("✅ All SEO regression checks completed successfully!");
}
