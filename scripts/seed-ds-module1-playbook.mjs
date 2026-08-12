// One-off content seed: writes deep "Ropes Professional Playbook" content
// for Data Science (AI & ML) — Module 1: Data Foundations only, per the
// explicit "stop after module 1" instruction. Run with:
//   node scripts/seed-ds-module1-playbook.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

const { data: course } = await supabase.from("courses").select("id").eq("slug", "data-science-ai-ml").single();
const { data: module1 } = await supabase
  .from("modules")
  .select("id, title")
  .eq("course_id", course.id)
  .eq("order_index", 0)
  .single();

console.log("Seeding into module:", module1.title, module1.id);

// ─── Playbook sections ──────────────────────────────────────────────────

const SECTIONS = [
  {
    section_type: "the_field",
    title: "What data foundations work actually looks like",
    order_index: 0,
    content: `Before anyone touches a model, someone has to answer a much less glamorous question: **can this data be trusted to answer the business question at all?** That work — auditing, cleaning, and narrating a dataset before modeling — is what this module teaches, and it's the single most underrated skill in data science.

**Who does this work.** In a small team, it's whoever's building the model — there's no separation. In a larger org, it's often split between a data analyst or data engineer (who owns the pipeline and initial quality checks) and the data scientist (who does the EDA that directly informs modeling choices). Titles vary; the work doesn't.

**Where it's used.** Every serious data project — forecasting, classification, recommendation, causal analysis, dashboards, A/B test readouts. Anywhere a decision will be made from data, someone did (or should have done) this work first.

**Where it's NOT the point.** If you're prototyping a throwaway analysis for your own curiosity, exhaustive data auditing is overkill — match the rigor to the stakes. The skill isn't "always be thorough," it's "know how much rigor this decision deserves."

**Typical deliverable.** An EDA report or data quality memo — usually a notebook or short document with: what's in the data, what's wrong with it, what you did about it, and what you'd still worry about. Not a slide deck of pretty charts with no conclusions.

**Typical stakeholders.** Whoever asked for the model or analysis (often not technical), the engineer who owns the data pipeline (who needs to know if their pipeline has a bug), and future-you (six months from now, wondering why a column looks weird).

**Typical problems you'll actually hit.** Data that was collected for one purpose (billing) being reused for another (churn prediction) without anyone checking whether it still means what you think it means. Columns with silent encoding conventions nobody documented (a "-1" that means "unknown," not "negative one"). A "clean-looking" dataset that's clean because someone already filtered out the messy rows — which might be exactly the rows you care about.`,
  },
  {
    section_type: "mental_models",
    title: "How professionals actually think about a new dataset",
    order_index: 1,
    content: `These aren't definitions. They're the internal rules working data scientists apply automatically, that beginners have to learn deliberately first.

**1. A dataset is a claim, not a fact.**
Someone collected this data, under some process, for some reason, at some point in time. Every one of those is a place the data can be wrong or misleading. Your job in EDA isn't to describe the data — it's to interrogate the claim it's making.

**2. Every column has a human story.**
Someone (or some system) decided what to record, how to record it, and what to do when a value was missing or invalid. A column called \`last_login\` might mean "last time they opened the app," or it might mean "last time our buggy tracker fired" — and those are very different columns wearing the same name.

**3. Missingness is information, not noise.**
Data isn't missing at random nearly as often as people assume. If income is missing more often for unemployed respondents, that's not a gap to fill in — it's a pattern to understand, because filling it wrong can quietly bias everything downstream.

**4. Your first histogram is a hypothesis, not a conclusion.**
A distribution that looks "normal" tells you what the data does, not why. Two datasets can have identical summary statistics and completely different stories (this is literally the point of Anscombe's Quartet — four datasets, identical mean/variance/correlation, four completely different shapes when plotted).

**5. "Clean" and "trustworthy" are different properties.**
A dataset with zero nulls and no obvious outliers can still be lying to you — if it was pre-filtered, biased in collection, or measuring the wrong thing entirely. Beginners optimize for "no errors show up." Professionals optimize for "I understand what this data can and can't tell me."

**6. The target variable deserves as much scrutiny as the features.**
New data scientists spend 90% of their EDA time on features and 10% on the label — often backwards. If your target is mislabeled, poorly defined, or leaks information from the future, no amount of feature engineering saves you.

**7. You're building a mental map, not a checklist to clear.**
The goal of this phase isn't "I ran EDA" — it's "I could now explain this dataset's strengths, weaknesses, and traps to someone else, from memory." If you can't do that yet, you're not done.`,
  },
  {
    section_type: "decision_framework",
    title: "The Data Trust Decision Tree",
    order_index: 2,
    content: `Use this before you trust any summary statistic, chart, or "the data looks fine" conclusion.

**IF you don't know how the data was collected**
→ THEN treat every summary statistic as provisional, not settled
→ BECAUSE collection bias (who/what got included) silently distorts every downstream number, and you can't detect distortion you don't know to look for
→ WATCH OUT FOR self-selected samples that look clean precisely because the messy cases were excluded before you ever saw the data (e.g. "customers who completed checkout" silently excludes everyone who abandoned it — which might be your most important segment)

**IF a column has an unusually clean, round, or suspicious value (0, -1, 9999, "N/A" as a string in a numeric column)**
→ THEN treat it as a probable placeholder for missing/invalid, not a real measurement, until proven otherwise
→ BECAUSE systems almost always encode "we don't know" as *some* value rather than a true null, and that value quietly poisons any statistic computed over the column
→ WATCH OUT FOR the placeholder being inside the plausible range (an age of "0" is obvious; an income of "0" might not be)

**IF two features are highly correlated with each other**
→ THEN ask *why* before deciding what to do about it — don't just drop one on reflex
→ BECAUSE the reason matters: true redundancy (drop one), a shared upstream cause (keep both, understand the relationship), or a case where one is actually a reformulation of the target (leakage — drop it entirely, urgently)
→ WATCH OUT FOR correlation that's high specifically *because* one feature was derived from the other after the target was known (classic leakage pattern)

**IF the class balance or distribution doesn't match what the business told you to expect**
→ THEN stop and reconcile it before proceeding — don't assume the business is wrong
→ BECAUSE this is one of the highest-value moments in the whole project: either you've found a real, important surprise, or you've found a bug in the pipeline, and both are worth knowing before you build anything on top of it
→ WATCH OUT FOR quietly "fixing" the mismatch by resampling without understanding why it existed first

**IF you're tempted to drop rows/columns to make the data look cleaner**
→ THEN document exactly what you dropped and why, in a decisions log, before doing it
→ BECAUSE every drop is a modeling decision in disguise, and "I cleaned the data" is not an audit trail — "I dropped 340 rows with impossible ages (>120) because they're almost certainly data entry errors" is
→ WATCH OUT FOR dropping being a way to avoid understanding a problem rather than actually solving it`,
  },
  {
    section_type: "workflow",
    title: "The real EDA-to-report workflow",
    order_index: 3,
    content: `Not "load data, make some charts." A defensible sequence, with a reason for each step and what it produces.

**1. Business question → data question.**
Write down, in one sentence, what decision this data needs to support. Everything after this is judged against that sentence, not against "is this interesting."

**2. Schema and type audit.**
Before any charts: what columns exist, what type is each (really — not what the loader guessed), what's the grain of one row (one customer? one transaction? one day?). *Produces:* a data dictionary, even a rough one.

**3. Missingness audit.**
For every column: how much is missing, and is it missing at random or in a pattern (missing more for a specific segment, time period, or in correlation with another column)? *Produces:* a missingness map, and a first list of columns that need a decision (impute, drop, or flag).

**4. Univariate pass.**
One variable at a time: distribution shape, range, obvious placeholders (see Decision Tree), plausibility against domain knowledge. *Produces:* a list of suspicious values per column, not just pretty histograms.

**5. Bivariate / target-relationship pass.**
How does each feature relate to the target, and to other features? This is where you look for both useful signal *and* leakage. *Produces:* a ranked sense of which features look informative, and a leakage watch-list.

**6. Outlier and anomaly review.**
For flagged values: data error, rare-but-real event, or a different population entirely (e.g. B2B accounts mixed into B2C data)? Each needs a different response. *Produces:* a decision (keep/cap/drop/investigate-further) per flagged group, not a blanket outlier-removal rule.

**7. Leakage scan.**
Deliberately ask: could any feature only exist *because* the target already happened? Could any feature be unavailable at real prediction time (future information)? *Produces:* a list of features to exclude or re-derive.

**8. Cleaning decisions log.**
Every transformation you're about to apply, written down with a reason, *before* you apply it. *Produces:* the actual audit trail — this is what makes your work defensible to someone else (or to future-you).

**9. Data narrative report.**
Synthesize all of the above into something a stakeholder (technical or not) can read: what's in the data, what you fixed and why, what you're still unsure about, and what it means for the question from step 1. *Produces:* the artifact this module's build deliverable asks for.`,
  },
  {
    section_type: "failure_modes",
    title: "How data foundations work actually breaks",
    order_index: 4,
    content: `**Target leakage via time.**
*What it is:* A feature contains information that literally wouldn't exist yet at the moment you'd need to make the prediction in real life.
*How it happens:* A column like \`total_support_tickets\` looks predictive of churn — until you realize it counts tickets filed *up to and including* the cancellation call.
*Why beginners miss it:* The feature genuinely correlates strongly with the target in historical data — it looks like a great signal, because it partly *is* the target in disguise.
*How to detect it:* For every strong feature, ask explicitly: "at the moment I'd need this prediction in production, would this value already be known?" If the answer is "only after the fact," it's leakage.
*How to prevent it:* Build a timestamp discipline — know when every feature's value becomes available relative to the prediction point, not just what its value is.
*Interview question:* "How would you check a dataset for target leakage before modeling?"
*Real-world consequence:* A model with suspiciously great offline accuracy that performs at-or-below baseline the moment it's deployed, because the leaking feature isn't available at prediction time in production.

**Silent placeholder values.**
*What it is:* Missing or invalid data encoded as a real-looking value (0, -1, 9999, "unknown" as a category) instead of a true null.
*How it happens:* Upstream systems (forms, legacy databases) often can't represent "no value" cleanly, so they use a sentinel value instead, and that convention rarely gets documented anywhere a data scientist will see it.
*Why beginners miss it:* The column is numeric and "has no nulls" by the naive check (\`.isnull().sum()\`), so it looks clean.
*How to detect it:* Look at the actual distribution, not just the null count — an unnatural spike at 0, -1, or the max int value is the tell.
*How to prevent it:* Always plot (don't just summarize) every numeric column before trusting it; ask the data owner directly what "no data" looks like in their system.
*Interview question:* "A numeric column has zero missing values by \`.isnull()\` — does that mean it's clean? Why or why not?"
*Real-world consequence:* A "-1" treated as a real numeric value silently drags down every mean, correlation, and model coefficient that touches the column.

**Survivorship bias in the collection process itself.**
*What it is:* The dataset only contains cases that "survived" some earlier filter, and that filter correlates with the thing you're trying to predict.
*How it happens:* "Customers who completed onboarding" excludes everyone who churned *during* onboarding — which is often the group with the most to learn from.
*Why beginners miss it:* There's nothing wrong with any individual row; the bias is in what's absent, which is much harder to notice than what's present.
*How to detect it:* Explicitly ask, and verify against the source system if possible: "what population could theoretically have been in this dataset, and is any of it systematically missing?"
*How to prevent it:* Get the data dictionary and collection logic from whoever owns the source system, not just the extracted table.
*Interview question:* "How would you know if a dataset was silently pre-filtered before it reached you?"
*Real-world consequence:* A model that performs well on the population it was trained on and badly in production, because production sees the full population, not the survivor-biased slice.

**Two columns that are the same information wearing different names.**
*What it is:* Near-duplicate features (e.g. \`signup_date\` and \`account_age_days\`, or a raw score and its rounded version) that inflate a model's apparent explanatory power without adding real signal.
*How it happens:* Different upstream systems export overlapping fields, and nobody reconciles them before the merge.
*Why beginners miss it:* Each column individually looks reasonable; the redundancy only shows up in a correlation matrix or feature-importance analysis.
*How to detect it:* Run a full pairwise correlation check as a standard step, not an optional extra, and investigate anything above ~0.9 (or ~0.7 for less noisy domains).
*How to prevent it:* Reconcile the data dictionary across source systems before merging, not after.
*Interview question:* "You find two features correlated at 0.97. Walk me through how you'd decide what to do."
*Real-world consequence:* Unstable model coefficients, wasted training compute, and misleading feature-importance rankings that send the team investigating the wrong signal.`,
  },
  {
    section_type: "debugging_playbook",
    title: "Your EDA looks fine but something's off — a troubleshooting guide",
    order_index: 5,
    content: `**Symptom: Summary statistics look "too good" — suspiciously tight distributions, no real outliers, clean round numbers everywhere.**
*Diagnostic:* Check whether the dataset was pre-aggregated or pre-filtered upstream (ask the data owner directly). Plot raw distributions, not just describe() output.
*Fix:* Get the un-aggregated source if it exists. If it doesn't, explicitly document that this is aggregated data and adjust what conclusions you're willing to draw from it.
*Prevention:* Ask "is this raw or has it been processed already?" as your first question with any new data source, every time.

**Symptom: A feature correlates suspiciously well with the target — better than domain knowledge says it should.**
*Diagnostic:* Check the timestamp availability of that feature relative to the prediction point (see the Decision Tree and the leakage failure mode above).
*Fix:* Either exclude the feature, or re-derive a version of it that only uses information genuinely available before the target is known.
*Prevention:* Build "time of availability" into your data dictionary for every feature, not just its meaning.

**Symptom: Your class balance or distribution doesn't match the number the business/stakeholder quoted you.**
*Diagnostic:* Check the date range, filters, and definition of the target in your extract against what the stakeholder actually meant — "churn" can mean five different things to five different teams.
*Fix:* Reconcile definitions explicitly with the stakeholder before proceeding; don't guess which definition is "right."
*Prevention:* Get the target definition in writing (even a Slack message) before you start pulling data.

**Symptom: Two columns that should be "independent" (e.g. two different survey questions) move together almost perfectly.**
*Diagnostic:* Check whether one was derived from the other somewhere upstream, or whether both were derived from a shared third source.
*Fix:* Keep one, or keep both but treat them as one signal in modeling — don't let a model implicitly double-weight the same information.
*Prevention:* Run a correlation matrix as a mandatory early step, not something you do only if you "have time."

**Symptom: A column's meaning seems to shift partway through the dataset (e.g. earlier rows and later rows behave completely differently).**
*Diagnostic:* Plot the feature (and the target) against time. Look for a system change, a schema migration, or a business process change at the inflection point.
*Fix:* Segment your analysis by the regime change, or restrict to the regime that matches current/future conditions — don't blend two eras of data as if they're one population.
*Prevention:* Always plot at least your key variables against time before trusting cross-sectional summary statistics.`,
  },
  {
    section_type: "checklist",
    title: "Dataset Trust & EDA Pre-Flight Checklist",
    order_index: 6,
    content: `Run through this before you consider EDA "done" on any dataset you're about to model from.

- [ ] I know exactly what one row represents (the grain), not just what the columns are named
- [ ] I know how this data was collected, and by what process/system
- [ ] I have a data dictionary — even a rough one I wrote myself — covering every column I'm using
- [ ] I've checked every numeric column's actual distribution, not just its null count, for placeholder values (0, -1, 9999)
- [ ] I've plotted (not just summarized) the target variable's distribution
- [ ] I know whether the target definition matches what the stakeholder actually meant
- [ ] I've run a pairwise correlation check and investigated anything unusually high
- [ ] I've explicitly asked, for every strong feature: "would this value be known at real prediction time?"
- [ ] I've checked for a population that could be systematically missing (survivorship bias)
- [ ] I've plotted key variables against time and checked for regime changes
- [ ] Every row/column I've dropped is written down with a specific reason, not just "removed outliers"
- [ ] I could explain this dataset's three biggest weaknesses to a stakeholder from memory, right now
- [ ] I have a written data narrative, not just a notebook of unlabeled charts`,
  },
  {
    section_type: "template",
    title: "Dataset Assessment Template",
    order_index: 7,
    content: `Copy this structure at the start of any new dataset. Fill in every section — an empty section is itself a finding ("collection process: unknown — need to ask data owner").

**Dataset name / source:**
**Date pulled:**
**Grain (what one row represents):**

**Collection process**
How was this data actually generated/collected? By what system or process?

**Data dictionary (per column)**
| Column | Type | Meaning | Known placeholder values | Available at prediction time? |
|---|---|---|---|---|

**Target variable**
- Definition (in the stakeholder's own words):
- Class balance / distribution:
- Does this match stakeholder expectations? If not, reconciled how?

**Missingness summary**
- Columns with notable missingness:
- Pattern (random, or correlated with something)?

**Leakage watch-list**
- Features that are suspiciously predictive:
- Features whose availability-at-prediction-time is unclear:

**Known data quality issues**
- (List each with: what it is, how many rows/values affected, decision made)

**Open questions for the data owner / stakeholder**
- (Anything you couldn't resolve yourself)`,
  },
  {
    section_type: "template",
    title: "EDA Report / Data Narrative Template",
    order_index: 8,
    content: `This is the deliverable — what you hand to a stakeholder or teammate, not the notebook itself.

**1. The question this data needs to answer**
One sentence. What decision depends on this?

**2. What's in the data**
Plain-language summary: size, time range, grain, what it covers.

**3. What I found and fixed**
For each significant issue: what it was, how you found it, what you did about it, and why. This is your decisions log, written for a reader.

**4. What I'm still not sure about**
Be explicit. "I'm not confident the pre-2023 data uses the same collection process" is more valuable than pretending certainty you don't have.

**5. What this means for the original question**
Connect back to section 1. Can this data actually answer the question? With what caveats?

**6. Recommendation**
Proceed to modeling as-is / proceed with specific caveats / need more data or a different data source first — and why.`,
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 9,
    content: `**Essential — do these**
- [Kaggle Learn: Data Cleaning](https://www.kaggle.com/learn/data-cleaning) — free, hands-on, exactly the practical skill this module builds. Do this alongside the exercises below, not instead of them.
- [pandas User Guide — Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html) — the actual mechanics you'll use constantly; reference this while doing the exercises, don't try to memorize it first.

**Recommended — for real understanding, not just mechanics**
- [Google — Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) — written by Google's own ML engineers; the early rules are specifically about data and are more honest about real-world messiness than most course material.
- Anscombe's Quartet (search it, look at the four charts) — a real, classic example of why you must plot data, not just summarize it. Four datasets, identical statistics, completely different shapes.

**Reference — come back to these when you need them**
- [pandas User Guide — full index](https://pandas.pydata.org/docs/user_guide/index.html) — the complete reference for everything you'll do hands-on in this module.
- [UCI Machine Learning Repository](https://archive.ics.uci.edu/) — real, well-documented datasets (including the ones used in this module's exercises) with genuine data dictionaries, useful to practice on beyond the assigned exercises.

**Advanced — once the fundamentals are solid**
- John Tukey, *Exploratory Data Analysis* (1977) — the book that named the discipline. Dense and old-fashioned, but the underlying philosophy ("let the data reveal its structure") still shapes how the field thinks.
- [Google — Rules of Machine Learning, rules 20+](https://developers.google.com/machine-learning/guides/rules-of-ml) — the later rules (feature engineering and monitoring) preview what Modules 2–3 of this course cover.`,
  },
];

const { error: delErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", module1.id);
if (delErr) throw delErr;
const { error: secErr } = await supabase
  .from("module_playbook_sections")
  .insert(SECTIONS.map((s) => ({ ...s, module_id: module1.id })));
if (secErr) throw secErr;
console.log(`OK  ${SECTIONS.length} playbook sections`);

// ─── Exercises ───────────────────────────────────────────────────────────

const EXERCISES = [
  {
    level: "guided",
    order_index: 0,
    title: "Guided: Data Trust Audit on the UCI Adult (Census Income) dataset",
    problem_statement: `Use the real, public [UCI Adult / Census Income dataset](https://archive.ics.uci.edu/dataset/2/adult) (also mirrored on Kaggle as "Adult Census Income"). The task: predict whether an individual's income exceeds $50K/year based on census attributes.

Follow the workflow from this module's playbook, step by step, in order:
1. Load the data and identify the grain (one row = one individual's census record).
2. Build a data dictionary — the UCI page includes attribute descriptions; use them, but verify against the actual data.
3. Run the missingness audit. Note: this dataset famously encodes missing values as "?" — a textbook example of the silent-placeholder failure mode from this module. Find it before reading this sentence again.
4. Run a univariate pass on at least 5 columns.
5. Check the target ("income" — a binary >50K/<=50K) balance.
6. Write a short data narrative (use the template) covering what you found.`,
    starter_context: `This is a "guided" exercise — every step is specified above. Your job is to execute it faithfully and produce a real artifact, not to improvise the process yet. The point is to internalize the workflow mechanics before you're asked to choose the steps yourself in the next exercise.`,
    hints: [
      "The \"?\" placeholder appears in the workclass, occupation, and native-country columns specifically — check those first if you're stuck finding it.",
      "The dataset is already fairly clean by design (it's a well-known teaching dataset) — your job is still to prove that to yourself, not assume it.",
      "Check the class balance on income — it's meaningfully imbalanced, which matters for every module after this one.",
    ],
    solution_notes: `A complete pass should surface: the "?" placeholders in 3 columns (~5-6% of rows affected), a meaningfully imbalanced target (~24% earn >50K), and at least one plausible leakage risk to flag for later modules (e.g. "education-num" and "education" are the same information twice — a redundancy, not leakage, but worth noting in your narrative under "known issues").`,
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Semi-guided: Telco Customer Churn — you choose the checks",
    problem_statement: `Use the real, public [Telco Customer Churn dataset](https://www.kaggle.com/datasets/blastchar/telco-customer-churn) (originally an IBM sample dataset). Business context: a telecom company wants to predict which customers will churn, so retention offers can be targeted.

This time, you're given the workflow stages (from the playbook), but not told exactly what to check within each one. Decide for yourself:
- What counts as a placeholder value worth investigating in this dataset (it won't be as obvious as the "?" from the guided exercise).
- Which columns deserve the deepest scrutiny given the actual business question (churn prediction) — not every column deserves equal attention.
- Whether any column looks like it could be leakage, and how you'd verify your suspicion.

Deliverable: a data narrative (using the template) that includes your reasoning for *why* you focused where you did, not just what you found.`,
    starter_context: `Business framing: "We're losing customers and don't know why in time to act. We want to identify who's likely to leave next month so retention can reach out first." Keep that sentence in front of you — it should shape which columns you spend time on.`,
    hints: [
      "There's a numeric-looking column stored as text with a small number of blank entries hiding in it — the kind of thing `.isnull()` alone won't catch. Check dtypes carefully, not just null counts.",
      "Think about which columns could only be known *after* a customer has already churned (or is in the process of churning) — that's this exercise's version of the leakage check.",
      "The target class balance here is a real, common pattern in churn problems — worth explicitly stating in your narrative, since it affects every later module.",
    ],
    solution_notes: `TotalCharges is stored as an object/string dtype with a small number of blank-string entries (not NaN) for customers with zero tenure — a genuine "silent missingness" case that a naive \`.isnull()\` check misses entirely. Tenure-adjacent columns and contract-type fields are usually where the strongest (legitimate) churn signal lives; anything describing a cancellation or support ticket that could only exist post-churn-decision is worth flagging as a leakage risk to verify with a (hypothetical) data owner.`,
  },
  {
    level: "independent",
    order_index: 2,
    title: "Independent: Bank Marketing dataset — full business brief, no process given",
    problem_statement: `**Business brief:** A bank ran a series of telemarketing campaigns to sell term deposits. Marketing wants a model that predicts which contacted customers are likely to subscribe, so future campaigns can prioritize the highest-likelihood contacts and reduce wasted calls.

**Data:** [UCI Bank Marketing dataset](https://archive.ics.uci.edu/dataset/222/bank+marketing) — real, public, from an actual Portuguese bank's direct marketing campaigns.

**Constraints:**
- The model needs to predict *before* a call is made — so anything that only exists because a call happened or succeeded cannot be used as a feature.
- Marketing needs to understand *why* the model prioritizes who it prioritizes — a completely opaque process won't get adopted.

**Your deliverable:** a complete data narrative (using this module's template) that a marketing stakeholder and a future modeling teammate could both act on. No process is specified — decide your own sequence, using this module's playbook as your reference, not a script to follow line by line.`,
    starter_context: `You are given only: the business brief above, the dataset, and the two constraints. Everything else — what to check, in what order, what counts as a problem worth flagging — is your judgment call. This is the level meant to simulate real early-stage data science work.`,
    hints: [
      "Re-read the constraints closely — one of them is explicitly pointing you at this module's #1 failure mode. Which column(s) in this dataset most obviously violate it?",
      "\"duration\" (call length) is the single most commonly-cited leakage trap in this exact public dataset — if you already know that, use it as a check on your own reasoning, not a shortcut past doing the check yourself.",
      "The target class balance in real marketing conversion data is rarely close to 50/50 — confirm what it actually is here and state the implication in your narrative.",
    ],
    solution_notes: `The "duration" column (length of the last contact call, in seconds) is a well-documented leakage trap in this exact dataset: a call that lasts 0 seconds essentially guarantees no subscription, and duration is entirely unknown before the call happens — it directly violates the "available at prediction time" constraint and should be excluded or heavily caveated. Class balance is meaningfully skewed toward "no" (real telemarketing conversion rates are low), which should be stated explicitly since it affects every downstream modeling decision in Module 2.`,
  },
];

const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", module1.id);
if (delExErr) throw delExErr;
const { error: exErr } = await supabase.from("exercises").insert(EXERCISES.map((e) => ({ ...e, module_id: module1.id })));
if (exErr) throw exErr;
console.log(`OK  ${EXERCISES.length} exercises`);

// ─── Interview questions ────────────────────────────────────────────────

const INTERVIEW_QUESTIONS = [
  {
    category: "fundamentals",
    order_index: 0,
    question: "What's the difference between exploratory data analysis and just reading summary statistics?",
    what_is_tested: "Whether the candidate understands EDA as an investigative process, not a reporting step.",
    strong_answer_structure:
      "Summary statistics describe the data; EDA interrogates it. A strong answer references specific failure modes summary stats miss on their own — e.g. Anscombe's Quartet (identical stats, different shapes) — and connects this to why you must plot, not just describe.",
    weak_answer_example:
      "\"EDA is when you look at the data before modeling, like checking for nulls and making some charts.\" — technically true but shows no understanding of *why* it matters or what it's actually protecting against.",
    follow_up_question: "Can you give an example where two datasets would have identical summary statistics but very different real shapes?",
  },
  {
    category: "fundamentals",
    order_index: 1,
    question: "Why would you check for data leakage before you've even built a model?",
    what_is_tested: "Whether the candidate treats leakage as a data-stage concern, not a modeling-stage afterthought.",
    strong_answer_structure:
      "Leakage is fundamentally about what information would be available at real prediction time — that's a property of the data and the business process, not the model. A strong answer explains that catching it early avoids wasted modeling effort on a feature that will have to be thrown away anyway, and avoids the trap of a model that looks great offline and fails in production.",
    weak_answer_example:
      "\"You check for leakage after training if the accuracy looks too high.\" — this catches obvious cases but misses leakage subtle enough not to be suspicious, and wastes a full training cycle finding it.",
    follow_up_question: "What's a leakage check you could run before writing a single line of model training code?",
  },
  {
    category: "applied",
    order_index: 2,
    question: "Walk me through how you'd decide whether a column has too many missing values to use.",
    what_is_tested: "Whether the candidate has a real decision process, not a fixed threshold rule memorized from a tutorial.",
    strong_answer_structure:
      "There's no universal percentage cutoff. A strong answer checks whether the missingness is random or patterned (correlated with the target or another feature), considers whether the column is important enough to be worth imputing carefully vs. dropping, and considers whether the *fact* that it's missing might itself be informative (a feature in its own right).",
    weak_answer_example:
      "\"If it's more than 30% missing, I drop it.\" — a fixed rule with no reasoning behind it; doesn't distinguish a low-value column from a critical one, or random missingness from a meaningful pattern.",
    follow_up_question: "What would make you keep a column that's 60% missing?",
  },
  {
    category: "applied",
    order_index: 3,
    question: "How do you decide whether an outlier is a data error or a real, important data point?",
    what_is_tested: "Domain-reasoning ability, not just a mechanical outlier-detection technique.",
    strong_answer_structure:
      "A strong answer starts with plausibility against domain knowledge (is this value physically/logically possible?), then checks whether similar values cluster (suggesting a real subpopulation) or are isolated (suggesting entry error), and explicitly avoids blanket statistical outlier removal (like a fixed z-score cutoff) without this reasoning first.",
    weak_answer_example:
      "\"I remove anything more than 3 standard deviations from the mean.\" — a mechanical rule that would delete real, important rare events (e.g. legitimate high-value transactions) exactly as readily as genuine data errors.",
    follow_up_question: "Give an example of an outlier you'd keep, and one you'd investigate as a likely error.",
  },
  {
    category: "scenario",
    order_index: 4,
    question: "You're given a dataset where the target class you're predicting is 98% one value. What do you check first?",
    what_is_tested: "Whether the candidate reacts to severe imbalance with investigation, not immediate resampling.",
    strong_answer_structure:
      "First: is this imbalance real and expected for the domain (e.g. fraud, rare disease), or a sign the data pull is wrong (wrong date range, wrong filter, wrong target definition)? Only after confirming it's a real, expected pattern would a strong answer move to how to handle it in modeling.",
    weak_answer_example:
      "\"I'd apply SMOTE to balance the classes.\" — jumps straight to a modeling technique without first checking whether the imbalance itself is even correct.",
    follow_up_question: "How would you verify the imbalance is real and not a data pull error?",
  },
  {
    category: "scenario",
    order_index: 5,
    question: "A colleague says a dataset 'looks clean' after a two-minute glance. What's your response?",
    what_is_tested: "Whether the candidate can push back constructively and explain *why* a quick glance isn't sufficient, without being dismissive.",
    strong_answer_structure:
      "A strong answer acknowledges the colleague isn't necessarily wrong, but explains specifically what a quick glance typically misses (placeholder values, patterned missingness, leakage, collection bias) and proposes a fast, concrete next step (e.g. 'let's at least check the null patterns and plot the target') rather than a vague 'we should be more careful.'",
    weak_answer_example:
      "\"I'd tell them to always do full EDA no matter what.\" — not wrong, but doesn't demonstrate specific reasoning about what's actually being missed.",
    follow_up_question: "What's the fastest check you'd run to sanity-check 'looks clean' in under five minutes?",
  },
  {
    category: "debugging",
    order_index: 6,
    question: "Your summary statistics show a column with impossible values (e.g., age = 150). What do you do?",
    what_is_tested: "Practical triage skill — not just noticing the problem, but handling it methodically.",
    strong_answer_structure:
      "A strong answer separates detection (how many rows, is it isolated or widespread) from decision (cap it, drop those rows, or flag and investigate with the data owner) and explicitly logs the decision with a reason, per this module's checklist — rather than silently 'fixing' it.",
    weak_answer_example:
      "\"I'd just cap it at some reasonable max.\" — a plausible action, but skipping the investigation and documentation steps that make the decision defensible later.",
    follow_up_question: "What would make you drop those rows entirely instead of capping the value?",
  },
  {
    category: "debugging",
    order_index: 7,
    question: "Two features in your dataset are correlated at 0.97. How do you decide what to do?",
    what_is_tested: "Whether the candidate distinguishes redundancy from leakage from shared-cause relationships.",
    strong_answer_structure:
      "A strong answer investigates *why* before acting: true duplication (drop one), a derived/reformulated version of the target (leakage — drop, and investigate how it entered the dataset), or two measures of a shared real-world cause (keep both, understood as related, not identical).",
    weak_answer_example:
      "\"I'd drop one of them since they're basically the same.\" — a reasonable default for true redundancy, but risky if the real cause is leakage (which needs a different, more urgent response) or a shared cause (where dropping either loses information).",
    follow_up_question: "How would you distinguish 'these are the same information twice' from 'one of these is leaking the target'?",
  },
  {
    category: "behavioural",
    order_index: 8,
    question: "Tell me about a time you found a problem in a dataset that wasn't obvious at first glance.",
    what_is_tested: "Real, specific experience with the mindset this module teaches — not a hypothetical.",
    strong_answer_structure:
      "A strong answer (even from this module's own exercises, honestly described) names the specific dataset, what looked fine initially, what made them look closer, what they found, and what they did about it — concrete details, not a generic story.",
    weak_answer_example:
      "\"I always check for missing values and outliers carefully.\" — a general statement of practice, not an actual story with a specific finding.",
    follow_up_question: "What would have happened if you hadn't caught it?",
  },
  {
    category: "behavioural",
    order_index: 9,
    question: "How do you communicate a data quality concern to a non-technical stakeholder who wants results fast?",
    what_is_tested: "Communication skill specifically about uncertainty and risk, not just technical correctness.",
    strong_answer_structure:
      "A strong answer translates the technical issue into business impact ('this could mean we're systematically missing X kind of customer, which could bias who the model recommends we target') rather than jargon, and proposes a concrete path forward (proceed with a stated caveat, or a fast fix) rather than just raising an alarm.",
    weak_answer_example:
      "\"I'd explain that the data has missing values and outliers that need to be cleaned.\" — technically accurate but doesn't connect to business impact or offer a path forward, which is what a stakeholder under time pressure actually needs.",
    follow_up_question: "What would you do if the stakeholder said 'just ship it, we don't have time'?",
  },
];

const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", module1.id);
if (delIqErr) throw delIqErr;
const { error: iqErr } = await supabase
  .from("interview_questions")
  .insert(INTERVIEW_QUESTIONS.map((q) => ({ ...q, module_id: module1.id })));
if (iqErr) throw iqErr;
console.log(`OK  ${INTERVIEW_QUESTIONS.length} interview questions`);

// ─── Skill mapping ───────────────────────────────────────────────────────

const { data: edaSkill } = await supabase.from("skills").select("id").eq("name", "Exploratory Data Analysis").single();
await supabase.from("module_skills").delete().eq("module_id", module1.id);
const { error: skillErr } = await supabase
  .from("module_skills")
  .insert([{ module_id: module1.id, skill_id: edaSkill.id }]);
if (skillErr) throw skillErr;
console.log("OK  1 skill mapped (Exploratory Data Analysis — already covers EDA + data cleaning + narrative-building; no new skill needed, avoids taxonomy bloat)");

console.log("\nDone.");
process.exit(0);
