# ROPES ORGANIC DISCOVERY BLOCKERS & EXTERNAL DEPENDENCIES

This document tracks any external dependencies, API access requirements, or search engine console connections required for full production operation.

---

## 1. EXTERNAL SEARCH CONSOLE ACCESS (REQUIRES OWNER ACTION)

| System | Item | Status | Action Required | Impact |
|---|---|---|---|---|
| **Google Search Console** | Domain Verification | `EXTERNAL ACCESS REQUIRED` | Add DNS TXT record or HTML file verification for `ropes.buzz` | Enables native GSC query performance, indexing coverage, and sitemap tracking |
| **Google Search Console** | Sitemap Submission | `READY FOR SUBMISSION` | Submit `https://ropes.buzz/sitemap.xml` in GSC dashboard | Accelerates discovery of public acquisition pages and skill guides |
| **Bing Webmaster Tools** | AI Performance & Grounding | `EXTERNAL ACCESS REQUIRED` | Import site from GSC or verify `ropes.buzz` in Bing Webmaster Tools | Enables Bing AI Grounding query tracking and citation performance |
| **IndexNow Protocol** | IndexNow API Key | `CONFIGURED IN CODE` | Key automatically served at `https://ropes.buzz/api/indexing/indexnow` | Instantly notifies Bing, Yandex, and Seznam on page updates |

---

## 2. CODE ISOLATION & NON-CONFLICT VERIFICATION

- **Claude Work Isolation**: Verified 100% clean isolation. All core learner, auth, payment, and AI engine files remain untouched.
- **Sitemap & Robots**: Dynamic sitemap (`/sitemap.xml`) and robots.txt (`/robots.txt`) cleanly export all public routes while protecting learner private routes.
- **Structured Data**: Machine-readable JSON-LD schemas (`EducationalOrganization`, `Course`, `WebPage`, `BreadcrumbList`, `ItemList`, `FAQPage`) generated without third-party heavy dependencies.
- **Search Visibility Admin**: `src/app/admin/search-visibility/page.tsx` added for admin monitoring with distinct separation between verified live data and estimated capabilities.
