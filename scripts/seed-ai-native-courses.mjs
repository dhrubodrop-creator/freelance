/**
 * Deterministic, idempotent seed for the two AI-Native Builder courses.
 *
 * Safe default: `node scripts/seed-ai-native-courses.mjs` validates content
 * without touching Supabase. Use `--apply` only for an approved deployment.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const SECTION_TYPES = ["the_field", "mental_models", "decision_framework", "workflow", "failure_modes", "debugging_playbook", "checklist", "template", "resources"];

function stableUuid(key) {
  const hex = createHash("sha256").update(`ropes-ai-native:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

const sharedResources = [
  "Next.js documentation — https://nextjs.org/docs",
  "Supabase documentation — https://supabase.com/docs",
  "Vercel deployment documentation — https://vercel.com/docs/deployments",
  "MDN Web Docs — https://developer.mozilla.org/",
];

const courses = [
  {
    slug: "ai-native-web-app-builder",
    title: "AI-Native Web App Builder",
    track: "AI-Native Development",
    price: 1,
    description: "Build a real production-style AI web application from a defensible product specification through frontend, backend, database, authentication, testing, deployment, and portfolio evidence.",
    servicePaths: ["AI-enabled MVP development", "web application development", "AI feature integration", "internal workflow application builds"],
    capstone: {
      title: "Deploy a complete AI-native web application",
      brief: "Ship the application developed across the four modules. A reviewer must be able to use the core workflow at a public URL and understand the product, architecture, AI boundary, reliability controls, and decisions from the submitted evidence.",
      requirements: ["Public live URL and source repository", "Working authentication and persistent database", "One useful AI feature with structured output, loading, retry, and error states", "Responsive and accessible core workflow", "Architecture diagram and decision log", "Fact-grounded case study with screenshots and no invented results"],
      scoring: ["Product thinking", "Architecture", "Implementation", "AI integration", "UX and accessibility", "Reliability and security", "Deployment", "Explanation"],
    },
    modules: [
      {
        title: "From Idea to Product Specification",
        objective: "Turn one observed problem into a build-ready product specification that another builder or coding agent can execute without guessing.",
        topics: ["Problem and target-user discovery", "User stories and acceptance criteria", "MVP boundary and risk", "Data model and system context", "UX flow and interface states", "AI-assisted specification review"],
        build: "A versioned product specification with problem evidence, target user, core flow, 4–8 user stories, acceptance criteria, deferred scope, data model, architecture sketch, and named AI feature.",
        outcome: "A defensible specification and first project decision log entry.",
        mental: ["AI accelerates execution, not product judgment", "A narrow user and workflow create better software than a broad persona", "Every feature carries build, test, security, and maintenance cost", "The data model is a long-lived product decision"],
        decisions: ["Problem urgency versus personal novelty", "Must-have core loop versus attractive extras", "Deterministic software versus probabilistic AI", "Managed free-tier services versus operational complexity"],
        workflow: ["Interview or observe one target user", "Write the current workaround and measurable pain", "Map the happy path and failure states", "Write and cut user stories", "Sketch entities and relationships", "Name the single AI capability and its human review point", "Ask AI to challenge ambiguities, then revise by judgment"],
        failures: ["Generic target user", "Feature-list specification", "AI-generated requirements accepted without review", "Schema deferred until after UI work"],
        debug: ["Trace every user story through the proposed data model", "Remove any feature that does not protect the core loop", "Replace vague adjectives with observable acceptance criteria", "Record unresolved risks instead of hiding them"],
        checklist: ["One real user/problem is named", "Core loop fits one sentence", "4–8 stories have acceptance criteria", "Deferred scope is explicit", "Entities and ownership are mapped", "AI output has a review boundary", "Risks and free-tier limits are documented", "Specification was pressure-tested and revised"],
        template: "Problem → target user → current workaround → core loop → user stories → acceptance criteria → deferred scope → entities/relationships → architecture → AI boundary → risks → definition of done.",
        resources: ["Atlassian user stories — https://www.atlassian.com/agile/project-management/user-stories", "Shape Up: Shaping — https://basecamp.com/shapeup/1.2-chapter-02", ...sharedResources],
        skills: ["AI Product Requirements (PRDs)", "Codebase Context Engineering"],
      },
      {
        title: "Build the Application",
        objective: "Implement the specified core loop as a coherent full-stack system with real data, authentication, authorization, validation, and failure handling.",
        topics: ["Next.js project structure", "Server and client component boundaries", "Reusable UI and forms", "Postgres schema and migrations", "Authentication and authorization", "Route handlers and validation", "Error states and logging"],
        build: "A working application foundation where an authenticated user completes the core workflow and owns persisted records through authorized server operations.",
        outcome: "A real full-stack vertical slice rather than disconnected screens.",
        mental: ["Build one vertical slice before broad horizontal layers", "Authentication proves identity; authorization proves permission", "Server validation is mandatory even when the client validates", "A migration is product code, not dashboard history"],
        decisions: ["Server versus client rendering", "Relational schema versus convenient duplication", "Route handler versus direct server action", "Optimistic UI versus confirmed writes"],
        workflow: ["Initialize and document the stack", "Create the shell and route map", "Write migration and ownership rules", "Connect authentication", "Build the core form and server validation", "Persist and read the user's record", "Exercise unauthorized, invalid, empty, and success paths"],
        failures: ["Mock data survives into production", "Service-role key reaches the browser", "UI hides authorization bugs", "AI changes many layers before any slice works"],
        debug: ["Reproduce with the smallest request", "Inspect browser, server, and database errors separately", "Verify identity and ownership predicates", "Revert the last unverified AI change and restore a known-good slice"],
        checklist: ["Repository runs from a clean clone", "No secret is client-exposed", "Migration is repeatable", "RLS/authorization uses ownership", "Server input is validated", "Core flow persists and reloads", "Empty/error/loading states exist", "AI-generated diff was reviewed line by line"],
        template: "Route → component → form schema → server boundary → table/relationship → authorization rule → success state → failure states → test evidence.",
        resources: ["Next.js App Router — https://nextjs.org/docs/app", "Supabase RLS — https://supabase.com/docs/guides/database/postgres/row-level-security", "Zod — https://zod.dev/", ...sharedResources],
        skills: ["Full-Stack Web App Development", "AI-Assisted Code Review"],
      },
      {
        title: "AI-Native Features + Production Quality",
        objective: "Add one useful AI capability with explicit contracts, evaluation cases, cost controls, safe UX, and production-quality responsive behavior.",
        topics: ["AI task and model boundary", "Prompt and structured output contracts", "Loading, timeout, retry, and fallback UX", "Token and cost budgets", "Prompt-injection and data security", "Automated and human evaluation", "Accessibility, responsiveness, and performance"],
        build: "The named AI feature working end to end against a small evaluation set, with validation, observability, failure UX, responsive layouts, and accessibility checks.",
        outcome: "A trustworthy AI product feature whose limitations can be explained and tested.",
        mental: ["Probabilistic output needs deterministic guardrails", "An AI feature is a task, not a chat-shaped decoration", "Latency and failure are interface states", "Evaluation starts before prompt tuning"],
        decisions: ["AI versus deterministic implementation", "Free-tier model quality versus cost and latency", "JSON schema strictness versus flexibility", "Automatic action versus human confirmation"],
        workflow: ["Write the input/output contract", "Create 10 representative evaluation cases", "Implement provider calls on the server", "Validate structured output", "Add timeout, retry, and honest fallback", "Threat-model untrusted input", "Test keyboard, mobile, slow network, and error paths"],
        failures: ["Secret API key in client code", "Prompt treated as the only guardrail", "No evaluation set", "Infinite retry or unbounded token spend"],
        debug: ["Save the exact failing input and raw model output safely", "Separate transport, parsing, quality, and UX failures", "Use a deterministic fallback when the task permits", "Change one prompt or model variable per experiment"],
        checklist: ["AI task has a clear user benefit", "Server owns credentials", "Inputs and outputs are validated", "Timeout and bounded retry exist", "Evaluation set includes hostile and empty cases", "Cost limits are documented", "Keyboard/mobile/error UX passes", "Limitations are visible and honest"],
        template: "User task → why AI → input contract → output schema → model/prompt version → eval cases → safety boundary → cost budget → UX states → fallback.",
        resources: ["OWASP Top 10 for LLM Applications — https://owasp.org/www-project-top-10-for-large-language-model-applications/", "WAI accessibility introduction — https://www.w3.org/WAI/fundamentals/accessibility-intro/", ...sharedResources],
        skills: ["LLM API Integration", "Prompt Engineering", "LLM Evaluation & Testing", "Prompt Injection Defense"],
      },
      {
        title: "Deploy → Domain → Portfolio",
        objective: "Move the application from local success to an observable production deployment and turn only verified project facts into client- and interview-ready evidence.",
        topics: ["Production build and environment separation", "Vercel deployment", "Custom domain and DNS planning", "Production smoke testing", "Monitoring and rollback", "Architecture and handoff documentation", "Case study and interview defence"],
        build: "Live application URL, source repository, environment-variable inventory, production verification record, architecture diagram, handoff notes, screenshots, and an evidence-grounded portfolio case study.",
        outcome: "A deployed, explainable project connected to Ropes Portfolio and capstone defence.",
        mental: ["Deployment is a distinct environment, not a hosting button", "A domain is a routing and ownership change that needs approval", "A portfolio claim is only as strong as its evidence", "Rollback is part of shipping"],
        decisions: ["Preview versus production promotion", "Platform domain versus approved custom domain", "What to monitor on a free tier", "What belongs in public documentation versus secrets"],
        workflow: ["Run lint, typecheck, tests, and production build", "Create production environment variables without copying secrets into docs", "Deploy a preview and smoke-test", "Promote and verify the live core loop", "Connect a domain only with owner approval", "Capture architecture, decisions, screenshots, URL, and repository", "Create the course-linked Portfolio item and submit capstone defence"],
        failures: ["Local-only environment assumptions", "DNS changed without a rollback plan", "Secrets committed to source", "Case study invents impact or users"],
        debug: ["Compare preview and production environment variables by name, never value", "Inspect deployment logs and first failing request", "Verify DNS with provider and Vercel before changing more records", "State missing results honestly in the case study"],
        checklist: ["Production build passes", "Secrets are server-only", "Live core loop was smoke-tested", "Domain change had explicit approval", "Monitoring and rollback are documented", "Repository and live URL work", "Portfolio item is linked to this course and skills", "Case study contains no invented metrics"],
        template: "Live URL → repository → architecture → environments → verification → decisions/tradeoffs → screenshots → problem/solution → actual outcome → limitations → handoff → next iteration.",
        resources: ["Vercel custom domains — https://vercel.com/docs/domains", "GitHub documentation — https://docs.github.com/", ...sharedResources],
        skills: ["AI Service Deployment", "Freelance Positioning", "Proposal Writing"],
      },
    ],
  },
  {
    slug: "ai-native-website-builder",
    title: "AI-Native Website Builder",
    track: "AI-Native Development",
    price: 1,
    description: "Build a cinematic, responsive, accessible, search-ready website from a real client brief through design system, implementation, performance-safe interaction, deployment, handoff, and portfolio evidence.",
    servicePaths: ["business website development", "landing-page delivery", "website redesign", "AI-assisted content and maintenance"],
    capstone: {
      title: "Build and deploy a complete cinematic AI-native website",
      brief: "Deliver a responsive website that communicates a real offer, guides a target visitor to a working conversion action, remains fast and accessible, and includes the production and handoff evidence expected from a professional freelancer.",
      requirements: ["Public live URL and source repository", "Clear audience, positioning, sitemap, and conversion path", "Responsive implementation with real content and intentional imagery", "Performance-safe motion with reduced-motion behavior", "Metadata, indexability, accessibility, analytics plan, and working form", "Client handoff document and fact-grounded case study"],
      scoring: ["Strategy", "Information architecture", "Visual quality", "Responsive implementation", "Interaction and motion", "Accessibility", "SEO and performance", "Deployment and client readiness"],
    },
    modules: [
      {
        title: "Strategy → Structure → Design",
        objective: "Translate a client brief into an evidence-based website strategy, information architecture, conversion path, content plan, wireframe, and visual direction.",
        topics: ["Brief interrogation and audience", "Positioning and page objective", "Sitemap and hierarchy", "Conversion path and calls to action", "Content-first wireframes", "Visual system and imagery direction", "AI-assisted critique"],
        build: "A complete website specification containing brief assumptions, audience, message hierarchy, sitemap, page outlines, conversion path, mobile wireframes, design tokens, and image brief.",
        outcome: "A design direction tied to business and user decisions rather than visual trend imitation.",
        mental: ["A website is a guided decision journey", "Hierarchy is more important than decoration", "Mobile forces honest content priority", "AI can critique a direction but cannot know the client better than evidence"],
        decisions: ["Single-page versus multi-page structure", "Primary conversion action", "Content proof available versus proof desired", "Distinct visual direction versus accessible restraint"],
        workflow: ["Rewrite the brief as objectives and constraints", "Define one primary audience and action", "Map questions the visitor needs answered", "Create sitemap and content hierarchy", "Wireframe mobile before desktop", "Define type, spacing, color, imagery, and motion principles", "Use AI to challenge gaps and revise deliberately"],
        failures: ["Starting from a fashionable hero", "Navigation mirrors the company org chart", "Generic AI copy", "Fake proof or placeholder testimonials"],
        debug: ["Ask what decision each section helps the visitor make", "Remove repeated claims", "Replace abstract claims with available evidence", "Test the wireframe without color or imagery"],
        checklist: ["Audience and objective are singular", "Sitemap has a reason for every page", "Primary CTA is consistent", "Each page has one H1 and content hierarchy", "Mobile wireframes exist", "Design tokens are bounded", "Image brief is specific and licensable", "No proof or result is fabricated"],
        template: "Client objective → audience → positioning → visitor questions → sitemap → page hierarchy → conversion path → mobile wireframes → visual tokens → imagery → motion principles → assumptions.",
        resources: ["Web Content Accessibility Guidelines — https://www.w3.org/WAI/standards-guidelines/wcag/", "Laws of UX — https://lawsofux.com/", ...sharedResources],
        skills: ["Client Discovery", "AI Product Requirements (PRDs)"],
      },
      {
        title: "Build the Website",
        objective: "Implement the approved structure as a reusable, content-complete, mobile-first website with robust navigation, forms, images, and component boundaries.",
        topics: ["Semantic HTML and App Router", "Responsive grids and containers", "Typography and image handling", "Reusable sections and components", "Navigation and focus behavior", "Validated forms and spam-aware server handling", "Cross-browser mobile QA"],
        build: "A complete responsive website using real copy and optimized imagery, with reusable components, working navigation, accessible forms, and no placeholder sections.",
        outcome: "A technically clean website that matches the specification from small phone to wide desktop.",
        mental: ["Responsive design is content behavior, not breakpoint decoration", "Components should follow repeated responsibility", "Images need art direction and dimensions", "A form is a server workflow, not just inputs"],
        decisions: ["Fluid versus breakpoint layout", "Reusable component versus page-specific section", "Image crop and loading priority", "Form provider versus server route on free tiers"],
        workflow: ["Build tokens, container, type scale, and page shell", "Implement header/footer and keyboard navigation", "Build pages from semantic sections", "Integrate optimized images with explicit sizes", "Add validated form with success and failure states", "Check content at 375px before desktop polish", "Review the AI-generated diff and remove unused code"],
        failures: ["Desktop-first fixed widths", "Every section becomes an over-configured component", "Layout shifts from unsized media", "Form success shown before server confirmation"],
        debug: ["Find the first element wider than the viewport", "Use semantic order before visual reordering", "Inspect computed image dimensions and network priority", "Test form validation and provider failure separately"],
        checklist: ["No horizontal overflow at 375px", "Heading order is logical", "Navigation works by keyboard", "Images have dimensions, alt text, and responsive sizes", "Form validates server-side", "Success/error/loading states exist", "No placeholder content remains", "Reusable boundaries reduce rather than add complexity"],
        template: "Page shell → semantic sections → reusable patterns → content data → image plan → form contract → responsive states → keyboard path → error states.",
        resources: ["Responsive images on MDN — https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images", "Next.js Image — https://nextjs.org/docs/app/api-reference/components/image", ...sharedResources],
        skills: ["Responsive Website Development", "AI-Assisted Code Review"],
      },
      {
        title: "Cinematic + AI-Native Experience",
        objective: "Add memorable interaction, motion, and AI-assisted content while protecting usability, reduced-motion preferences, loading performance, and semantic clarity.",
        topics: ["Motion purpose and hierarchy", "CSS transitions and scroll behavior", "Micro-interactions and feedback", "Reduced-motion accessibility", "AI-assisted copy and image briefs", "Technical SEO and metadata", "Core Web Vitals and bundle discipline"],
        build: "A deliberate motion and interaction layer plus edited AI-assisted content, complete metadata, responsive behavior, reduced-motion support, and before/after performance evidence.",
        outcome: "A cinematic website whose visual quality does not depend on bloat or inaccessible effects.",
        mental: ["Motion should explain state or hierarchy", "Cinematic means composition and pacing before libraries", "The fastest JavaScript is JavaScript not shipped", "AI-assisted copy needs human specificity and fact checking"],
        decisions: ["CSS motion versus animation library", "Above-the-fold image quality versus transfer cost", "Server-rendered content versus client interaction", "AI-generated draft versus approved factual copy"],
        workflow: ["Create a motion inventory with purpose", "Implement CSS transitions first", "Reserve JavaScript for interactions that require state", "Add reduced-motion alternatives", "Edit AI copy against the brief and facts", "Implement metadata, canonical, robots, and structured meaning", "Measure Lighthouse and remove the largest avoidable cost"],
        failures: ["Scroll-jacking", "Animation library imported globally", "AI copy contains generic or unsupported claims", "Visual effects hide content or keyboard focus"],
        debug: ["Disable all animation and verify the page still works", "Profile long tasks and third-party scripts", "Compare visible copy against the approved brief", "Test prefers-reduced-motion and keyboard focus"],
        checklist: ["Every motion has a purpose", "Reduced-motion is respected", "No interaction blocks content", "AI copy was edited and fact-checked", "Metadata and canonical are correct", "LCP asset is prioritized and compressed", "No unnecessary third-party script loads", "Mobile interaction remains stable"],
        template: "Interaction → user purpose → trigger → duration/easing → no-motion state → performance cost → accessibility check → measurement before/after.",
        resources: ["web.dev Core Web Vitals — https://web.dev/articles/vitals", "MDN prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion", ...sharedResources],
        skills: ["Accessible Web Experience Design", "Prompt Engineering"],
      },
      {
        title: "Production → Domain → Client Delivery",
        objective: "Deploy, verify, monitor, document, and hand off the website as a professional client deliverable, then turn real evidence into a portfolio case study.",
        topics: ["Production build and Vercel preview", "Custom domain approval and DNS", "Metadata, robots, sitemap, and canonical verification", "Analytics and consent planning", "Form delivery verification", "Performance and accessibility audit", "Client handoff and portfolio presentation"],
        build: "A live website with verification checklist, domain plan, analytics/form documentation, accessibility/performance evidence, maintenance handoff, repository, screenshots, and case study.",
        outcome: "A client-presentable delivery package and course-linked portfolio artifact ready for capstone defence.",
        mental: ["A handoff transfers operational understanding, not just files", "DNS changes require explicit ownership approval", "Analytics must answer a business question", "Performance scores are evidence from a run, not eternal claims"],
        decisions: ["Platform URL versus approved domain", "Analytics need versus privacy cost", "Form email service versus database storage", "Maintenance scope and change ownership"],
        workflow: ["Run production build and preview", "Verify content, forms, metadata, keyboard path, and mobile", "Record lab performance and known field-data limitation", "Connect a domain only after approval", "Document analytics, form routing, access, and rollback", "Prepare client handoff and maintenance boundary", "Create course-linked Portfolio item, attach skills, and submit capstone"],
        failures: ["Production form never tested", "Domain changed without access or rollback record", "Client cannot update or recover the site", "Portfolio presents stock concept as a real client result"],
        debug: ["Trace one real form submission end to end", "Verify redirects and DNS with read-only tools first", "Test from an unauthenticated browser and generic crawler", "Label concept, client, and measured results accurately"],
        checklist: ["Preview and production builds pass", "Form delivery is verified", "404, metadata, canonical, robots, and sitemap work", "Keyboard and mobile checks pass", "Performance evidence names date and method", "Domain had owner approval", "Handoff lists access, ownership, maintenance, and rollback", "Portfolio item uses only project facts"],
        template: "Live URL → repository → domain/DNS owner → deploy process → environment names → analytics → forms → SEO verification → accessibility/performance → access handoff → maintenance scope → actual outcome.",
        resources: ["Google Search Essentials — https://developers.google.com/search/docs/essentials", "Vercel domains — https://vercel.com/docs/domains", ...sharedResources],
        skills: ["AI Service Deployment", "Freelance Positioning", "Proposal Writing"],
      },
    ],
  },
];

function moduleSections(course, module) {
  const numbered = (items) => items.map((item, i) => `${i + 1}. ${item}`).join("\n");
  const bullets = (items) => items.map((item) => `- ${item}`).join("\n");
  return [
    { type: "the_field", title: `Professional objective: ${module.title}`, content: `${module.objective}\n\nImplementation work: ${module.build}\n\nEvidence at the end of this stage: ${module.outcome}` },
    { type: "mental_models", title: "Mental models", content: module.mental.map((x, i) => `**${i + 1}. ${x}.** Use this model to challenge AI output and explain your own decision rather than accepting a plausible first answer.`).join("\n\n") },
    { type: "decision_framework", title: "Decision framework", content: `For each decision, record the user need, constraints, alternatives, evidence, chosen option, tradeoff, and reversal trigger.\n\n${numbered(module.decisions)}\n\nA defensible answer names why the alternative was rejected; “the AI suggested it” is not reasoning.` },
    { type: "workflow", title: "Practical implementation workflow", content: `${numbered(module.workflow)}\n\nStop after each step and produce inspectable evidence before asking AI to continue. Review the diff, output, or artifact against the specification.` },
    { type: "failure_modes", title: "Common failure modes", content: module.failures.map((x) => `**${x}.** Detect it by comparing the artifact against the module definition of done. Prevent it with a smaller verified change, an explicit acceptance check, and a written decision.`).join("\n\n") },
    { type: "debugging_playbook", title: "Debugging playbook", content: `${numbered(module.debug)}\n\nIf two attempts fail, stop changing code blindly. Capture the exact symptom, smallest reproduction, expected behavior, actual behavior, and last known-good state before the next change.` },
    { type: "checklist", title: "Definition of done", content: bullets(module.checklist.map((x) => `[ ] ${x}`)) },
    { type: "template", title: "Project artifact template", content: `${module.template}\n\nProject progress record: current stage → next task → completed evidence → open risk → deliverable link → decision logged.` },
    { type: "resources", title: "Curated resources", content: `${bullets(module.resources)}\n\nFree-tier terms can change. Verify limits on the provider's current official page before promising a client that a service is free or unlimited.` },
  ].map((s, order) => ({ ...s, order }));
}

function exercisesFor(course, module) {
  return [
    { level: "guided", title: `Guided build: ${module.workflow[0]}`, problem: `Complete the first two workflow steps for your own ${course.title} project. Attach or paste the artifact and explain one choice in your own words.`, context: `Use the module template. Ask AI for critique only after you have made the initial decision.`, hints: [module.mental[0], `Check the definition of done: ${module.checklist[0]}.`], notes: `Strong evidence is specific to the learner's project, shows the artifact, and distinguishes their decision from the AI's suggestion.` },
    { level: "semi_guided", title: `Review and repair: ${module.failures[0]}`, problem: `Inspect your current project for “${module.failures[0]}”. Reproduce or demonstrate the issue, make the smallest correction, and record the before/after evidence.`, context: `Do not rewrite the whole project. Use the debugging playbook and change one variable at a time.`, hints: [module.debug[0], module.decisions[0]], notes: `A strong submission includes the symptom, root cause, focused fix, verification, and remaining limitation.` },
    { level: module.title.includes("Deploy") || module.title.includes("Production") ? "capstone" : "independent", title: `Stage deliverable: ${module.title}`, problem: `Produce the full module deliverable: ${module.build}`, context: `This artifact becomes part of the final course-linked Portfolio item and capstone evidence. Never invent users, clients, traffic, revenue, or performance results.`, hints: [`Use this structure: ${module.template}`, `Verify every item in the module checklist before marking the module complete.`], notes: `A strong submission is inspectable, linked to the real project, complete against the checklist, and includes at least one logged decision with alternatives and tradeoff.` },
  ];
}

function interviewsFor(module) {
  return [
    ["fundamentals", `Explain why “${module.mental[0]}” matters in this project.`, "Understanding of the module's core professional mental model."],
    ["applied", `Walk me through how you made the decision: ${module.decisions[0]}.`, "Evidence-based decision making and tradeoff awareness."],
    ["scenario", `A stakeholder asks you to skip “${module.checklist[0]}” to ship faster. What do you do?`, "Ability to protect quality while negotiating scope."],
    ["debugging", `Your project shows this failure: ${module.failures[0]}. How do you isolate and fix it?`, "Systematic debugging instead of speculative changes."],
    ["project_defence", `Show the evidence for this stage and name one decision you would change with more time.`, "Honest project defence grounded in actual work."],
  ].map(([category, question, tested], order) => ({ category, question, tested, order }));
}

function validate() {
  const errors = [];
  for (const course of courses) {
    if (course.price !== 1 || course.modules.length !== 4) errors.push(`${course.slug}: price/modules`);
    course.modules.forEach((m, i) => {
      const sections = moduleSections(course, m);
      if (sections.length !== SECTION_TYPES.length || sections.some((s, j) => s.type !== SECTION_TYPES[j])) errors.push(`${course.slug} module ${i + 1}: sections`);
      if (exercisesFor(course, m).length < 3 || interviewsFor(m).length < 5) errors.push(`${course.slug} module ${i + 1}: practice/interview`);
      if (!m.skills.length || m.checklist.length < 8 || m.workflow.length < 7) errors.push(`${course.slug} module ${i + 1}: depth`);
    });
  }
  if (errors.length) throw new Error(`Content validation failed:\n${errors.join("\n")}`);
  return { courses: courses.length, modules: courses.reduce((n, c) => n + c.modules.length, 0), sections: courses.reduce((n, c) => n + c.modules.length * SECTION_TYPES.length, 0), exercises: courses.reduce((n, c) => n + c.modules.length * 3, 0), interviewQuestions: courses.reduce((n, c) => n + c.modules.length * 5, 0) };
}

async function apply() {
  const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase server environment variables");
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: categories, error: categoryError } = await db.from("skill_categories").select("id,name");
  if (categoryError) throw categoryError;
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  const requiredSkills = [
    { name: "Full-Stack Web App Development", category: "Dev Tooling", description: "Building a coherent web application across frontend, server, database, authentication, authorization, validation, and deployment." },
    { name: "Responsive Website Development", category: "Dev Tooling", description: "Building semantic, content-complete websites that adapt reliably from mobile to desktop." },
    { name: "Accessible Web Experience Design", category: "Dev Tooling", description: "Designing motion, interaction, performance, and accessibility as one production web experience." },
  ];
  for (const skill of requiredSkills) {
    const { error } = await db.from("skills").upsert({ id: stableUuid(`skill:${skill.name}`), category_id: categoryByName.get(skill.category), name: skill.name, description: skill.description }, { onConflict: "name" });
    if (error) throw error;
  }
  const { data: allSkills, error: skillsError } = await db.from("skills").select("id,name");
  if (skillsError) throw skillsError;
  const skillByName = new Map(allSkills.map((s) => [s.name, s.id]));

  const result = [];
  for (const course of courses) {
    const courseId = stableUuid(`course:${course.slug}`);
    const { error: courseError } = await db.from("courses").upsert({ id: courseId, slug: course.slug, title: course.title, track: course.track, price: course.price, description: course.description }, { onConflict: "slug" });
    if (courseError) throw courseError;
    const moduleIds = [];
    for (const [moduleIndex, module] of course.modules.entries()) {
      const moduleId = stableUuid(`module:${course.slug}:${moduleIndex}`);
      moduleIds.push(moduleId);
      const { error: moduleError } = await db.from("modules").upsert({ id: moduleId, course_id: courseId, order_index: moduleIndex, title: module.title, topics: module.topics, build_deliverable: module.build, outcome: module.outcome }, { onConflict: "id" });
      if (moduleError) throw moduleError;
      for (const section of moduleSections(course, module)) {
        const { error } = await db.from("module_playbook_sections").upsert({ id: stableUuid(`section:${course.slug}:${moduleIndex}:${section.type}`), module_id: moduleId, section_type: section.type, title: section.title, content: section.content, order_index: section.order }, { onConflict: "id" });
        if (error) throw error;
      }
      for (const [exerciseIndex, exercise] of exercisesFor(course, module).entries()) {
        const { error } = await db.from("exercises").upsert({ id: stableUuid(`exercise:${course.slug}:${moduleIndex}:${exerciseIndex}`), module_id: moduleId, level: exercise.level, title: exercise.title, problem_statement: exercise.problem, starter_context: exercise.context, hints: exercise.hints, solution_notes: exercise.notes, order_index: exerciseIndex }, { onConflict: "id" });
        if (error) throw error;
      }
      for (const question of interviewsFor(module)) {
        const { error } = await db.from("interview_questions").upsert({ id: stableUuid(`interview:${course.slug}:${moduleIndex}:${question.order}`), module_id: moduleId, category: question.category, question: question.question, what_is_tested: question.tested, strong_answer_structure: "Ground the answer in this project's artifact, explain the decision and alternatives, name the tradeoff, and cite verification evidence.", weak_answer_example: "I used it because the AI generated it and it seemed to work.", follow_up_question: "What evidence would change your decision?", order_index: question.order }, { onConflict: "id" });
        if (error) throw error;
      }
      for (const skillName of module.skills) {
        const skillId = skillByName.get(skillName);
        if (!skillId) throw new Error(`Missing existing skill: ${skillName}`);
        const { error } = await db.from("module_skills").upsert({ module_id: moduleId, skill_id: skillId }, { onConflict: "module_id,skill_id", ignoreDuplicates: true });
        if (error) throw error;
      }
    }
    const { error: capstoneError } = await db.from("course_capstones").upsert({ id: stableUuid(`capstone:${course.slug}`), course_id: courseId, title: course.capstone.title, brief: course.capstone.brief, requirements: course.capstone.requirements, scoring_dimensions: course.capstone.scoring }, { onConflict: "course_id" });
    if (capstoneError) throw capstoneError;
    const chunks = course.modules.map((module, i) => ({ id: stableUuid(`chunk:${course.slug}:${i}`), course_id: courseId, module_id: moduleIds[i], source_type: "playbook", content: [`Course: ${course.title}. Module ${i + 1}: ${module.title}.`, `Objective: ${module.objective}`, `Topics: ${module.topics.join("; ")}.`, `Project deliverable: ${module.build}`, `Definition of done: ${module.checklist.join("; ")}.`, `Possible professional applications, not guaranteed outcomes: ${course.servicePaths.join("; ")}.`].join(" ") }));
    const { error: chunkError } = await db.from("content_chunks").upsert(chunks, { onConflict: "id" });
    if (chunkError) throw chunkError;
    result.push({ courseId, slug: course.slug, moduleIds, capstoneId: stableUuid(`capstone:${course.slug}`) });
  }
  return result;
}

const summary = validate();
if (!APPLY) {
  console.log(`Validated only (no database writes): ${JSON.stringify(summary)}`);
  console.log("Run with --apply after deployment approval.");
} else {
  const result = await apply();
  console.log(JSON.stringify({ ...summary, applied: result }, null, 2));
}
