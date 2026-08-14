import fs from "fs";
import path from "path";

console.log("==========================================");
console.log(" ROPES ADVERSARIAL PRE-PRODUCTION SEO AUDIT ");
console.log("==========================================");

const appDir = path.join(process.cwd(), ".next/server/app");

if (!fs.existsSync(appDir)) {
  console.error("❌ Error: Production build output (.next/server/app) does not exist. Run npm run build first.");
  process.exit(1);
}

let totalAudited = 0;
let passCount = 0;
let failCount = 0;
const errors = [];

function auditHtmlFile(filePath, routePath, isPublic) {
  totalAudited++;
  const html = fs.readFileSync(filePath, "utf8");
  const issues = [];

  // 1. Canonical tag check for public pages
  if (isPublic && !routePath.startsWith("/api") && !routePath.includes("404") && !routePath.includes("_not-found")) {
    const hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'") || html.includes("canonical");
    if (!hasCanonical) {
      issues.push(`Public route ${routePath} is missing canonical link tag`);
    }
  }

  // 2. Robots / Indexability check
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  const robotsContent = robotsMatch ? robotsMatch[1] : "index, follow";

  if (!isPublic) {
    // Private page must have noindex
    if (!robotsContent.includes("noindex")) {
      issues.push(`Private route ${routePath} is missing noindex in robots meta tag (found: ${robotsContent})`);
    }
  } else {
    // Public page should not have noindex unless legal or 404
    if (robotsContent.includes("noindex") && !routePath.includes("/legal/") && !routePath.includes("_not-found")) {
      issues.push(`Public route ${routePath} has accidental noindex meta tag (found: ${robotsContent})`);
    }
  }

  // 3. Title tag check for public pages
  if (isPublic && !routePath.startsWith("/api")) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch || !titleMatch[1].trim()) {
      issues.push("Missing or empty <title> tag");
    }
  }

  // 4. H1 count check for public pages
  if (isPublic && !routePath.startsWith("/api") && !routePath.endsWith(".xml") && !routePath.endsWith(".txt") && !routePath.includes("_not-found")) {
    const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
    if (h1Matches.length === 0) {
      issues.push("Missing <h1> tag");
    } else if (h1Matches.length > 1) {
      issues.push(`Multiple <h1> tags found (${h1Matches.length})`);
    }
  }

  // 5. JSON-LD Structured Data parsing check
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    const jsonStr = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
    try {
      JSON.parse(jsonStr);
    } catch (err) {
      issues.push(`Invalid JSON-LD syntax: ${err.message}`);
    }
  }

  if (issues.length === 0) {
    passCount++;
  } else {
    failCount++;
    errors.push({ route: routePath, issues });
  }
}

// Helper to determine if route is public or private
function isPublicRoute(routePath) {
  if (routePath.startsWith("/resources/skills")) return true;
  if (routePath.includes("_not-found") || routePath.includes("404")) return false;

  const privatePrefixes = [
    "/dashboard",
    "/onboarding",
    "/portfolio",
    "/profile",
    "/skills",
    "/simulations",
    "/growth",
    "/reality-check",
    "/one-person-business",
    "/what-can-i-sell",
    "/assets",
    "/opportunities",
    "/admin",
    "/checkout",
    "/api"
  ];

  for (const prefix of privatePrefixes) {
    if (routePath === prefix || routePath.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  return true;
}

// Crawl .next/server/app for HTML files
function crawlBuildApp(dir, currentRoute = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      crawlBuildApp(fullPath, `${currentRoute}/${entry.name}`);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      let routePath = currentRoute || "/";
      if (entry.name === "_not-found.html") {
        routePath = "/_not-found";
      } else if (entry.name !== "index.html" && !currentRoute.endsWith(entry.name.replace(".html", ""))) {
        routePath = `${currentRoute}/${entry.name.replace(".html", "")}`;
      }
      const isPublic = isPublicRoute(routePath);
      auditHtmlFile(fullPath, routePath, isPublic);
    }
  }
}

console.log("\n[1] Auditing Compiled Next.js Prerendered HTML Files...");
crawlBuildApp(appDir);

console.log("\n[2] Auditing Robots.txt and Sitemap.xml integrity...");
const sitemapPath = path.join(process.cwd(), "src/app/sitemap.ts");
const sitemapText = fs.readFileSync(sitemapPath, "utf8");

// Check private routes in sitemap
const privateKeywords = ["/dashboard", "/onboarding", "/portfolio", "/profile", "/admin", "/checkout", "/api"];
for (const kw of privateKeywords) {
  if (sitemapText.includes(`url: \`\${SITE_URL}${kw}`)) {
    failCount++;
    errors.push({ route: "sitemap.ts", issues: [`Sitemap contains private route prefix: ${kw}`] });
  }
}

console.log("\n==========================================");
console.log(` AUDIT SUMMARY: ${passCount} Passed, ${failCount} Failed (${totalAudited} total files audited)`);
console.log("==========================================");

if (failCount > 0) {
  console.error("\n❌ DETECTED AUDIT BLOCKERS:");
  for (const err of errors) {
    console.error(`Route: ${err.route}`);
    for (const issue of err.issues) {
      console.error(`  - ${issue}`);
    }
  }
  process.exit(1);
} else {
  console.log("✅ ADVERSARIAL AUDIT PASSED WITH ZERO BLOCKERS!");
}
