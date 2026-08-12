import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "1a8c31ad-2094-4e42-9dab-bb63c0d717cc"; // End-to-End Delivery

const sections = [
  {
    section_type: "the_field",
    title: "What 'end-to-end delivery' actually means",
    order_index: 0,
    content: `Everything in Modules 1-3 happens inside a notebook. End-to-end delivery is what happens when the notebook has to become something a business can actually depend on: a script or service that runs on new data without a human babysitting it, produces predictions in a format someone downstream can use, and can be explained and defended to someone who wasn't in the room while it was built.

This is also where most portfolio projects — and most junior data scientists — fall short. A polished notebook that ends at "here's my model's accuracy" demonstrates you can follow a tutorial. A project that shows raw data going in one end and a served prediction coming out the other, with the reasoning at every step written down and defensible under questioning, demonstrates you can actually do the job. Interviewers and hiring managers know the difference immediately, because the difference is exactly what separates a class exercise from real work.

The capstone in this module is deliberately built to simulate that gap: a business brief instead of a clean pre-framed problem, a requirement to actually deploy (not just evaluate) a model, and a defense component where you have to explain and justify your decisions the way you would in a real technical interview or a client review.`,
  },
  {
    section_type: "mental_models",
    title: "How professionals think about shipping a model",
    order_index: 1,
    content: `**1. A model that only exists in a notebook doesn't exist for the business.** Value is created when a prediction reaches someone who acts on it — not when a metric appears in a cell output.

**2. The deployment target should shape the model, not be an afterthought.** A model that needs to score one customer in real time behind an API has different constraints (latency, single-row inference) than one that scores a million rows in a nightly batch job — decide this before finalizing the model, not after.

**3. "It works on my machine" is not deployment.** Reproducibility — the same code, same dependencies, same result on a different machine — is a hard requirement, not a nice-to-have, the moment more than one person touches the system.

**4. A prediction without a confidence signal is a a liability, not a convenience.** Downstream consumers need to know not just what the model predicts, but how much to trust that specific prediction — especially for edge cases where the model is likely to be wrong.

**5. The handover document is part of the deliverable, not paperwork after the real work is done.** If the next person (or your future self in six months) can't understand what was built, why, and how to maintain it, the project isn't actually finished.

**6. Being able to defend a decision is different from being able to make it.** Making a modeling choice under no scrutiny and defending that same choice under real questioning ("why not X instead?", "what if the data changes?", "what happens when this breaks?") are different skills, and the second one is what interviews and client conversations actually test.`,
  },
  {
    section_type: "decision_framework",
    title: "How should this model actually be served?",
    order_index: 2,
    content: `**IF** predictions are needed the moment new data arrives, for one entity at a time (e.g. a single loan application) **THEN** build a real-time API (a lightweight FastAPI/Flask endpoint that loads the model and returns a prediction on request). **BECAUSE** the consumer needs the answer immediately, not on the next scheduled run. **WATCH OUT FOR**: real-time serving requires the exact same preprocessing pipeline used in training to be applied at inference time — a common and costly bug is training/serving skew, where the two paths quietly diverge.

**IF** predictions are needed for a large set of entities on a regular schedule (e.g. scoring all customers nightly for a churn dashboard) **THEN** build a batch job that reads the current data, scores it, and writes results somewhere downstream systems can read. **BECAUSE** batch is simpler to build, test, and debug than real-time serving, and most business use cases don't actually need sub-second latency. **WATCH OUT FOR**: don't over-engineer real-time serving for a use case that only ever needed a nightly batch — this is one of the most common wastes of engineering effort in applied ML.

**IF** the model needs to be explainable per-prediction for a stakeholder or regulator **THEN** the serving layer must return not just a prediction but the top contributing features for that specific prediction (via SHAP values or the model's native feature contributions). **BECAUSE** "the model said so" is not an acceptable answer in regulated or high-stakes contexts. **WATCH OUT FOR**: computing SHAP values can be significantly slower than the raw prediction — budget for that if it's on the real-time path.

**IF** you're building a portfolio/capstone project rather than a production system for a real employer **THEN** a well-documented, reproducible script plus a clear README demonstrating the same reasoning (preprocessing consistency, a way to serve a prediction, monitoring awareness) is sufficient — a full production Kubernetes deployment is not the bar. **BECAUSE** what's being evaluated is your judgment and rigor, not your DevOps infrastructure. **WATCH OUT FOR**: don't confuse "simple deployment" with "sloppy deployment" — the reproducibility and correctness bar stays the same even if the infrastructure is minimal.`,
  },
  {
    section_type: "workflow",
    title: "The real end-to-end delivery workflow",
    order_index: 3,
    content: `**1. Freeze the feature engineering and preprocessing pipeline as reusable, versioned code — not notebook cells.** Anything computed differently at training time versus serving time is a bug waiting to happen (training/serving skew).

**2. Save the trained model in a portable format** (e.g. a pickle/joblib file for scikit-learn, or the library's native serialization) **alongside its exact dependency versions.** "It worked when I trained it" is not the same as "it will work when it's loaded six months from now on a different machine."

**3. Write a thin, testable inference function** that takes raw input, applies the exact same preprocessing used in training, and returns a prediction plus a confidence/contribution signal.

**4. Wrap that function in whatever serving mechanism fits the use case** (a CLI script for a portfolio project, a FastAPI endpoint for real-time, a scheduled script for batch).

**5. Test the full pipeline on genuinely new data it has never seen — not the original test set.** This catches integration bugs (a column renamed, a type mismatch, a missing default for a new category) that pure model evaluation never would.

**6. Write the handover document:** what the model does, what it doesn't do, its known limitations, how to retrain it, and what to monitor.

**7. Prepare the defense: be ready to explain every major decision** (why this model family, why this metric, why this feature set, what you'd do with more time or data) **out loud, to someone who wasn't there when you made it.**`,
  },
  {
    section_type: "failure_modes",
    title: "How end-to-end delivery actually breaks",
    order_index: 4,
    content: `**Failure 1 — Training/serving skew.**
*What*: the preprocessing applied when the model was trained doesn't exactly match what's applied when the model serves a real prediction.
*How it happens*: preprocessing logic lives in ad-hoc notebook cells during training and gets rewritten (slightly differently) when someone builds the serving code later.
*Why beginners miss it*: the model still "runs" and returns a number — there's no error, just silently wrong predictions.
*Detect*: run the exact same raw input through both the training pipeline and the serving pipeline and confirm the resulting feature vectors are identical, not just similar.
*Prevent*: write the preprocessing as one shared function/module used by both training and serving code — never duplicate the logic.
*Interview question*: "Your model performs great in evaluation but poorly once deployed, even with no data drift. What's your first hypothesis?"
*Real-world consequence*: a model that quietly serves degraded predictions from day one of deployment, often undetected for weeks because nothing crashes.

**Failure 2 — No reproducibility: "it works on my machine."**
*What*: the model or pipeline depends on an unpinned library version, a local file path, or an environment detail that isn't captured anywhere.
*How it happens*: notebooks are developed in one specific environment without ever being tested from a clean install.
*Why beginners miss it*: the project "worked" throughout development, so there's no natural moment that surfaces the missing dependency information.
*Detect*: try to run the full pipeline from a fresh environment (a new virtual environment, or literally a different machine) before calling the project finished.
*Prevent*: pin dependency versions in a requirements file, avoid absolute local paths, and document the exact steps to reproduce a working environment.
*Interview question*: "Someone else on your team needs to retrain your model next month. What do they need, and how do you know?"
*Real-world consequence*: a project that can't actually be handed off, maintained, or verified by anyone other than its original author — a serious red flag in a technical interview or code review.

**Failure 3 — No plan for what happens when the model is wrong.**
*What*: the deployed system returns a prediction with no confidence signal and no fallback for genuinely out-of-distribution inputs.
*How it happens*: the evaluation phase focused entirely on aggregate accuracy, and the question "what does the consumer of this prediction do when it's likely wrong" was never asked.
*Why beginners miss it*: it's not something a metric surfaces — it only becomes visible when someone downstream asks "how much should I trust this specific number?"
*Detect*: check whether the serving output includes any confidence or contribution signal, and whether there's a defined behavior for inputs far outside the training distribution.
*Prevent*: add a confidence/contribution field to every served prediction, and define — even simply — what should happen for inputs the model is unlikely to handle well (e.g., a fallback to a human review queue).
*Interview question*: "What does your system do when it receives an input completely unlike anything in your training data?"
*Real-world consequence*: overconfident, silently-wrong predictions get acted on by downstream systems or people with no way to know they should be double-checked.

**Failure 4 — A capstone that ends at "here's my accuracy" with no defense of the decisions made.**
*What*: the project presents a final metric with no documented reasoning for the choices behind it — why this model, why this feature set, why this metric, what was tried and rejected.
*How it happens*: it's the natural stopping point after Modules 1-3's work is technically done, and writing up the reasoning feels like extra effort after the "real" work is finished.
*Why beginners miss it*: the model works and the metric looks reasonable, so it feels complete — but a metric with no defensible reasoning behind it can't survive real scrutiny.
*Detect*: try to answer, out loud, "why this and not the alternative?" for every major decision in the project. If you can't, the project isn't ready to present.
*Prevent*: write the reasoning down as you go (the Model Comparison Log and Evaluation Report templates from Modules 2-3 exist exactly for this), not reconstructed from memory afterward.
*Interview question*: (this is the defense section below, in full.)
*Real-world consequence*: a portfolio project or work deliverable that looks complete on the surface but falls apart under the first real follow-up question, which is exactly what happens in interviews and client reviews.`,
  },
  {
    section_type: "debugging_playbook",
    title: "It works locally but not when someone else runs it — a troubleshooting guide",
    order_index: 5,
    content: `**Symptom: "The model file loads but raises an error, or gives different predictions, on a different machine."**
Diagnostic: check library version mismatches first (scikit-learn model files are frequently not compatible across major version changes) before suspecting anything about the data.
Fix: pin exact dependency versions in a requirements file and test loading the model from a genuinely fresh environment before considering the project done.

**Symptom: "Predictions from the deployed pipeline don't match predictions computed in the original notebook for the same input."**
Diagnostic: this is training/serving skew — compare the actual feature vector produced by each pipeline for one identical input, field by field, rather than trusting that the code 'looks the same.'
Fix: consolidate preprocessing into one shared function used by both training and serving paths; delete the duplicated version.

**Symptom: "The pipeline crashes on a new data row with a value the training data never had (a new category, a missing field)."**
Diagnostic: this reveals the pipeline was only ever tested against the training distribution, not against realistic new input.
Fix: add explicit handling for unseen categories (e.g. an 'other' bucket) and missing fields (a documented default or a rejection path), and test against deliberately malformed input before calling the pipeline production-ready.

**Symptom: "I can't remember why I chose this model/feature/metric when asked in a review."**
Diagnostic: the reasoning was never written down at decision time.
Fix: go back through your Model Comparison Log and Evaluation Report entries from Modules 2-3 — if they're incomplete, that's the actual finding: build the habit of writing the reasoning down as you go, not after.`,
  },
  {
    section_type: "checklist",
    title: "End-to-End Delivery Checklist",
    order_index: 6,
    content: `- [ ] Preprocessing logic exists as one shared, reusable function used identically at training and serving time
- [ ] The trained model is saved in a portable format with exact dependency versions recorded
- [ ] The full pipeline has been run successfully from a genuinely fresh environment, not just the original development machine
- [ ] Served predictions include a confidence or contribution signal, not just a bare number
- [ ] There's a defined (even if simple) behavior for out-of-distribution or malformed input
- [ ] The pipeline was tested against new data it has never seen, not just the original test set
- [ ] A handover document exists: what the model does, its known limitations, how to retrain, what to monitor
- [ ] Every major decision (model family, metric, feature set, what was rejected) is written down somewhere, not just remembered
- [ ] You can explain, out loud, why this approach and not an alternative — for every major decision`,
  },
  {
    section_type: "template",
    title: "Model Handover Document",
    order_index: 7,
    content: `**What this model does:** ___ (one paragraph, plain language)

**What it does NOT do / known limitations:** ___

**Input format expected:** ___
**Output format returned:** ___ (including any confidence/contribution fields)

**How it was trained:** data source ___, date range ___, feature set version ___, model family ___

**Evaluation summary:** metric ___, score ___ (± confidence interval), baseline comparison ___

**Where it underperforms (from segment analysis):** ___

**How to retrain:** ___ (steps, or link to the training script/notebook)

**Monitoring plan:** what to watch ___, check frequency ___, retrain/rollback trigger ___

**Who to contact with questions:** ___
**Last updated:** ___ | **Version:** ___`,
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 8,
    content: `**Essential**
- [FastAPI documentation](https://fastapi.tiangolo.com/) — the most common lightweight way to wrap a Python model in a real-time serving endpoint; the tutorial section alone is enough to build the capstone's serving layer.
- [joblib documentation](https://joblib.readthedocs.io/) — the standard way to persist scikit-learn models and pipelines for reuse outside the training notebook.

**Recommended**
- Google's [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml), Rules 16-25 specifically — cover training/serving consistency and the realities of maintaining a model after launch, directly relevant to this module.
- [The ML Test Score paper](https://research.google/pubs/pub46555/) (referenced in Module 3) — its production-readiness sections (serving, monitoring, reproducibility) apply directly here.

**Reference**
- [scikit-learn: Model persistence](https://scikit-learn.org/stable/model_persistence.html) — official guidance on saving/loading models safely, including version-compatibility caveats.

**Advanced**
- Sculley et al., ["Hidden Technical Debt in Machine Learning Systems"](https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) (NeurIPS 2015) — the foundational paper on why ML systems accumulate debt beyond the model code itself (pipelines, monitoring, configuration) — essential reading once you've felt the pain points this module describes firsthand.`,
  },
];

const exercises = [
  {
    level: "capstone",
    order_index: 0,
    title: "Capstone: end-to-end credit-risk delivery, presented like a real interview case",
    problem_statement: `**Business context:** A mid-sized online lender wants a model to flag applications likely to default, using the [UCI Default of Credit Card Clients dataset](https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients) as a stand-in for their real (confidential) data. Product wants a real-time risk score returned the moment an application is submitted.

**Stakeholders:** Risk team (wants high recall on defaults — missing a real default is expensive), Product team (wants low latency and a small number of false declines, since each one is a lost customer), Compliance (wants to know why any specific application was flagged).

**Requirements:**
1. A trained model that beats a documented baseline by a margin you justify.
2. A working inference function that takes a raw application (matching the dataset's original feature format) and returns a risk score plus the top 3 contributing factors for that specific prediction.
3. A written Evaluation Report (using Module 3's template) with a segment breakdown by age group and education level.
4. A written Model Handover Document (using this module's template).
5. A short written "Defend Your Work" section (see below) answering the defense questions honestly, including anything you'd do differently with more time.

**Success criteria:** the risk team can act on your score, product can see the false-decline rate, compliance can see why any individual application was flagged, and someone who never met you could retrain or hand off this system from your documentation alone.

**Constraints:** real-time scoring (single application, not batch), no access to any data beyond what's in the dataset.`,
    starter_context: `You've already built and evaluated a Credit Default classifier in Modules 2-3 — this capstone extends that work into a deliverable, it doesn't require starting from scratch. Reuse your best model and evaluation results where they're still valid, and fill the actual gaps: the inference function, the handover doc, and the defense.`,
    hints: [
      "The 'top 3 contributing factors per prediction' requirement is what compliance actually needs — use SHAP values or the tree model's native per-prediction feature contributions, not just global feature importance.",
      "Test your inference function against at least one deliberately malformed or edge-case input (a missing field, an unusual value) before considering it done — this is exactly the kind of gap the Failure Modes section above describes.",
      "The Defend Your Work section is not optional polish — treat it as the part that's actually being evaluated most closely.",
    ],
    solution_notes: `A strong capstone submission makes the baseline-beating margin explicit and ties it to the risk team's stated priority (recall on defaults), returns real per-prediction SHAP-based explanations rather than only global feature importance, includes a segment breakdown that honestly reports any unevenness found (rather than omitting an inconvenient result), and — most importantly — the Defend Your Work section demonstrates the candidate can articulate trade-offs under scrutiny: why this model family over alternatives, what the false-decline rate costs the business, what would be done differently with more time or a larger/more representative dataset, and what happens if the input distribution shifts after deployment. Submissions that skip the defense section or give generic, non-specific answers to it are not meeting the bar this capstone is designed to test — the technical model quality is necessary but not sufficient.`,
  },
];

const interviewQuestions = [
  { category: "project_defence", order_index: 0, question: "Why did you choose this model family for the capstone over the alternatives you considered in Module 2?", what_is_tested: "Whether the model choice was a real, evidence-based decision or just 'the one that scored highest.'", strong_answer_structure: "Reference the actual comparison from the Model Comparison Log: the metric difference, the confidence interval, and the non-performance factors (interpretability for compliance, latency for real-time serving) that influenced the final choice.", weak_answer_example: "\"It had the best accuracy\" with no mention of the compliance/latency constraints that were explicitly part of the brief.", follow_up_question: "If compliance's need for explainability were removed from the requirements, would you have chosen differently?" },
  { category: "project_defence", order_index: 1, question: "What would you do differently if you had another two weeks on this project?", what_is_tested: "Self-awareness about the actual limitations of the delivered work, not just a generic 'add more features' answer.", strong_answer_structure: "Name something specific and evidence-based: a segment that showed weaker performance and would benefit from targeted feature engineering, a confidence interval that's wider than desired and would benefit from more data, or a monitoring capability that wasn't built due to time.", weak_answer_example: "\"I'd try a neural network\" with no connection to an actual limitation found during the project.", follow_up_question: "Of those options, which would you prioritize first, and why?" },
  { category: "system_design", order_index: 2, question: "Walk me through what happens, end to end, from an application being submitted to a risk score being returned to the product team.", what_is_tested: "Whether the candidate actually understands the full pipeline they built, not just the modeling step.", strong_answer_structure: "Trace the path concretely: raw application data arrives, the shared preprocessing function transforms it identically to how training data was processed, the model produces a prediction, SHAP values are computed for the top contributing factors, and the response (score + factors) is returned to the caller.", weak_answer_example: "Describing only the model training process and skipping the serving path entirely.", follow_up_question: "What happens if the preprocessing function encounters a field value it's never seen before?" },
  { category: "debugging", order_index: 3, question: "Three months after deployment, product reports the false-decline rate has crept up. Walk me through your investigation.", what_is_tested: "Application of Module 3's evaluation/monitoring thinking to a realistic post-deployment scenario.", strong_answer_structure: "Propose checking for data drift in the input distribution first (has the applicant population changed?), then checking whether the decision threshold still matches the original cost trade-off, before assuming the model itself needs retraining.", weak_answer_example: "\"I'd retrain the model\" as the first and only step, without diagnosing the actual cause.", follow_up_question: "The input distribution hasn't changed, but the false-decline rate is still up. What's your next hypothesis?" },
  { category: "scenario", order_index: 4, question: "Compliance asks why a specific application was declined. Show me how your system answers that question.", what_is_tested: "Whether the explainability requirement was actually built, not just mentioned as a design intention.", strong_answer_structure: "Describe the actual mechanism: the top 3 SHAP-based contributing factors returned alongside the score for that specific application, translated into plain language a compliance reviewer (not a data scientist) can act on.", weak_answer_example: "\"The model's feature importance shows payment history matters most\" — describing global importance instead of the specific per-prediction explanation compliance actually needs.", follow_up_question: "What would you tell compliance if the top contributing factor for a decline was a feature they consider legally sensitive to base a decision on?" },
  { category: "fundamentals", order_index: 5, question: "What's the difference between global feature importance and a per-prediction explanation, and why does this capstone need the latter?", what_is_tested: "Understanding of the explainability distinction that the capstone's compliance requirement specifically depends on.", strong_answer_structure: "Explain that global importance describes what matters on average across all predictions, while a per-prediction explanation (like SHAP values for one specific row) describes what drove that one specific decision — compliance needs the latter because they're being asked to justify individual decisions, not the model's overall behavior.", weak_answer_example: "Treating the two as interchangeable.", follow_up_question: "Could a feature have high global importance but low importance for one specific prediction? Give an example." },
  { category: "behavioural", order_index: 6, question: "Describe the hardest technical decision you had to defend in this capstone, and how you made the call.", what_is_tested: "Whether the candidate genuinely wrestled with a real trade-off, versus treating every decision as obvious in hindsight.", strong_answer_structure: "Name a specific tension (e.g. the more interpretable model that compliance wanted versus the higher-recall model that risk wanted), describe how the decision was actually made (weighing the stated priorities in the brief), and be honest about the remaining discomfort with the trade-off, if any.", weak_answer_example: "Claiming every decision was straightforward with no real tension, which is rarely true of a well-scoped capstone.", follow_up_question: "If risk and compliance's priorities directly conflicted and you had to pick one, how would you decide, and who would you loop in?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: deploySkill } = await supabase.from("skills").select("id").eq("name", "AI Service Deployment").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: deploySkill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Module 4 (End-to-End Delivery) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
