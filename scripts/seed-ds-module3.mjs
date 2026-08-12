import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "5c83c885-2206-4623-8281-713b6524ee56"; // Evaluation & Iteration

const sections = [
  {
    section_type: "the_field",
    title: "What evaluation and iteration work actually looks like",
    order_index: 0,
    content: `Building the first working model is the easy part. The work that separates a demo from a system a business can actually rely on is what happens next: deciding when a model is genuinely "good enough" to ship, being able to explain exactly where it fails and why, and running iteration cycles that are guided by evidence rather than hope.

In practice this looks like: presenting a model's performance to a stakeholder and being asked "so is 82% good?" — a question that has no answer without context (good compared to what? what does the business lose on the 18% you get wrong? is the cost of errors symmetric?). It looks like discovering the model performs beautifully overall but is quietly useless for a specific customer segment that happens to matter most. It looks like running a fourth iteration of feature engineering and having to admit the model genuinely isn't improving, and that's real information, not a personal failure.

The core discipline here is treating "is this model good enough" as an answerable question with a specific, pre-agreed threshold — not a vibe. And treating "why is the model wrong here" as a specific, investigable question with an actual answer in the data — not a mystery to shrug at. Teams that skip this step ship models that look fine in a slide deck and fail quietly in production, discovered only when someone downstream notices the business impact never materialized.`,
  },
  {
    section_type: "mental_models",
    title: "How professionals think about evaluation and iteration",
    order_index: 1,
    content: `**1. "Good enough" is a pre-committed threshold, not a post-hoc judgment.** Decide what score clears the bar for shipping *before* you see the final number — otherwise you'll unconsciously rationalize whatever number you got as acceptable.

**2. A single aggregate metric always hides a distribution of failures.** 85% accuracy overall can mean uniformly mediocre performance, or excellent performance on 90% of cases and near-zero on a critical 10% — these require completely different responses, and the aggregate number can't tell you which one you have.

**3. Error analysis is detective work, not a formality.** The goal isn't to note that errors exist — it's to find the specific, actionable pattern behind them: a segment, a data quality issue, a missing feature, an inherently ambiguous label.

**4. Diminishing returns are real and expected.** The first iteration typically buys the most improvement; each subsequent one usually buys less. Recognizing when you've hit the flat part of the curve — and stopping — is as much a skill as the iteration itself.

**5. A confidence interval is more honest than a point estimate.** "82% accuracy" from a 200-row test set carries real uncertainty; "82% ± 4%" tells the truth about how much that number should be trusted, and whether a competing model's "84%" is actually distinguishable from it.

**6. Iteration should be driven by a specific hypothesis, not "let's try things."** Each round should state, in advance, what change is being made and what result would confirm or refute the reasoning behind it — otherwise you can't tell genuine improvement from noise.

**7. Model comparison and model improvement are different skills.** Comparing two finished models (which is better?) is a measurement problem. Improving a model (why is it wrong, and what fixes that) is a diagnostic problem. Conflating them leads to a lot of retrained models that aren't actually better, just different.`,
  },
  {
    section_type: "decision_framework",
    title: "Is this model good enough to ship?",
    order_index: 2,
    content: `**IF** the model beats the pre-agreed baseline by a margin the business explicitly said would matter **THEN** it clears the first bar — but this alone is not sufficient to ship. **BECAUSE** "better than baseline" answers whether the model has any value, not whether it's safe or reliable enough to deploy. **WATCH OUT FOR**: a margin nobody explicitly signed off on before modeling started is not a real threshold — it's a number chosen to justify shipping, decided after the fact.

**IF** performance is uneven across segments that matter to the business (a demographic group, a customer tier, a product line) **THEN** do not ship until you've decided — explicitly, with stakeholders — whether that unevenness is acceptable. **BECAUSE** an aggregate metric can hide a segment where the model performs at or below baseline, which may be a fairness issue, a business-risk issue, or both. **WATCH OUT FOR**: "the aggregate number looks fine" is not evidence the segment-level numbers are fine; always check both.

**IF** the confidence interval around your metric is wide relative to the margin over baseline **THEN** treat "beats baseline" as unproven, not confirmed. **BECAUSE** with a small test set, an apparent 3-point improvement can easily be noise. **WATCH OUT FOR**: teams under deadline pressure tend to skip this check entirely because a wide confidence interval is an inconvenient answer.

**IF** the model's error pattern includes failures that are unusually costly (not just frequent) **THEN** the decision to ship depends on the cost of those specific failures, not the overall error rate. **BECAUSE** a model that's right 95% of the time but catastrophically wrong on the remaining 5% in an expensive way can be worse than a model that's right 85% of the time with uniformly cheap mistakes. **WATCH OUT FOR**: this requires actually looking at what the wrong predictions cost, not assuming all errors are interchangeable.

**IF** none of the above raise a flag **THEN** ship, but ship with a monitoring plan already defined — a metric, a check frequency, and a specific action if performance drops below a stated threshold. **BECAUSE** "good enough today" doesn't mean "good enough indefinitely" — data drifts, and the shipping decision should include how you'll know if it stops being true.`,
  },
  {
    section_type: "workflow",
    title: "The real evaluation-and-iteration cycle",
    order_index: 3,
    content: `**1. Agree on the "good enough" threshold before seeing the final result.** Write it down: what metric, what value, measured how.

**2. Compute the aggregate metric with a confidence interval, not just a point estimate.** Bootstrap resampling on the test set is usually enough for a rough interval if the sample size is small.

**3. Break the metric down by every segment that plausibly matters.** Customer tier, geography, time period, product line — whatever the business would ask about if they knew to ask.

**4. Pull a sample of wrong predictions and look at them directly, not just the summary statistics.** Aim for enough examples to spot a pattern, not so many that you're just skimming.

**5. Form a specific hypothesis about the biggest fixable error pattern.** "The model is bad on customers with less than 3 months of history because the engagement features need at least a month of data to be meaningful" is a testable hypothesis. "The model needs to be more complex" is not.

**6. Make exactly one meaningful change per iteration and re-measure on the identical evaluation harness.** Changing multiple things at once makes it impossible to attribute the result to a cause.

**7. Compare the new result against both the baseline and the previous iteration, with the confidence interval in view.** Only claim improvement if it's outside the noise band.

**8. Recognize diminishing returns and stop when the cost of another iteration exceeds its expected value.** Not every model needs to be squeezed to its theoretical maximum — a model that's genuinely good enough, shipped this week, usually beats a marginally better model shipped next month.

**9. Document the final decision: what threshold was met, what trade-offs were accepted, what wasn't fixed and why, and what the monitoring plan is going forward.**`,
  },
  {
    section_type: "failure_modes",
    title: "How evaluation and iteration actually breaks",
    order_index: 4,
    content: `**Failure 1 — Treating a single aggregate metric as the whole story.**
*What*: shipping decisions made on one overall number, with no segment-level breakdown.
*How it happens*: the aggregate is the easiest number to compute and report, and there's organizational pressure to give a single clean answer.
*Why beginners miss it*: the aggregate genuinely can look good even when a specific important segment is performing badly — there's no visual or numeric cue in the aggregate alone that a problem is hiding.
*Detect*: deliberately slice the metric by every segment dimension the business cares about, every time, as a standing step — not only when something seems off.
*Prevent*: build segment breakdowns into the standard evaluation report template so skipping them requires actively removing a step, not adding one.
*Interview question*: "Your model has 88% overall accuracy. What's the first follow-up question you'd ask before calling that acceptable?"
*Real-world consequence*: a model that silently underperforms for a customer segment the business specifically cares about (often the most valuable or most vulnerable one), discovered only after complaints or a fairness audit.

**Failure 2 — Confusing a noisy fluctuation with a real improvement.**
*What*: an iteration that changed the metric by a small amount is declared a win, when the change is within the test set's natural sampling variance.
*How it happens*: point estimates are compared directly with no confidence interval, especially under time pressure to show progress.
*Why beginners miss it*: "0.83 is bigger than 0.81" feels self-evidently true, even when both numbers are statistically indistinguishable given the sample size.
*Detect*: compute a confidence interval (bootstrap is simplest) around every reported metric and check whether intervals overlap before claiming a difference is real.
*Prevent*: standardize on reporting metric ± interval, not a bare number, in every experiment log.
*Interview question*: "Your new model scores 0.02 higher AUC than the old one on a 500-row test set. How would you determine whether that's a real improvement?"
*Real-world consequence*: teams chase phantom improvements, burning iteration cycles on changes that did nothing, while the model's actual capability plateaus unnoticed.

**Failure 3 — Iterating without a specific hypothesis.**
*What*: trying new features, new models, or new hyperparameters somewhat randomly, hoping something improves the number.
*How it happens*: pressure to show progress quickly, combined with a lack of a clear error-analysis process to generate real hypotheses.
*Why beginners miss it*: it feels like productive work — code is being written, experiments are running — even though nothing is being learned about *why* the model fails.
*Detect*: ask, before each iteration starts, "what specific failure are we trying to fix, and why do we think this change will fix it?" If there's no answer, it's not a hypothesis-driven iteration.
*Prevent*: require every experiment log entry to state the hypothesis and the expected mechanism before results are recorded.
*Interview question*: "Talk me through your last three modeling iterations. What did you learn from each one, independent of whether the metric went up?"
*Real-world consequence*: weeks of iteration produce a barely-different model and no accumulated understanding of the problem, so the next person starts from zero.

**Failure 4 — Never defining what "good enough" means until after seeing the result.**
*What*: the shipping threshold is decided retroactively, shaped to justify whatever number the model actually achieved.
*How it happens*: no one wants to commit to a number in advance, especially if the true difficulty of the problem is unknown at the start.
*Why beginners miss it*: it feels reasonable to "see what's achievable first" — but this removes the only real check against motivated reasoning.
*Detect*: ask whether the threshold was written down anywhere before the final evaluation ran. If not, treat the current "good enough" claim with real skepticism.
*Prevent*: require a written threshold, agreed with a stakeholder, before the modeling phase starts — treat changing it afterward as a real decision that needs its own justification, not a formality.
*Interview question*: "Who decided your model was 'good enough,' and when — before or after you saw the final score?"
*Real-world consequence*: models get shipped that don't actually meet the business's real bar, because the bar was quietly redefined to match whatever was delivered.`,
  },
  {
    section_type: "debugging_playbook",
    title: "The model isn't improving — a troubleshooting guide",
    order_index: 5,
    content: `**Symptom: "Every iteration for the last two weeks has moved the metric by less than the noise band."**
Diagnostic: you've likely hit the ceiling of what the current features and model family can extract from this data — this is a real, common state, not a sign you're doing something wrong.
Fix: stop iterating on hyperparameters and small feature tweaks; instead ask whether a fundamentally different feature (new data source) or a different problem framing is needed, or whether the current performance is simply the ceiling and it's time to ship.

**Symptom: "The model performs well overall but is close to baseline for one specific segment."**
Diagnostic: check whether that segment has meaningfully less training data, different feature distributions, or a different (possibly mislabeled) outcome definition than the rest of the dataset.
Fix: consider a segment-specific model, segment-specific features, or explicitly documenting the limitation and excluding that segment from the model's scope rather than serving it a prediction you know is unreliable.

**Symptom: "Test set performance varies a lot depending on the random seed used for the split."**
Diagnostic: this is a sign the test set is too small, or the data has more variance than the sample size can reliably characterize.
Fix: use k-fold cross-validation and report the mean and spread across folds, rather than trusting a single split; if possible, get more data before drawing firm conclusions.

**Symptom: "The error-analysis sample doesn't show any obvious pattern — the wrong predictions look scattered and unrelated."**
Diagnostic: this can genuinely happen — some of the error may be irreducible noise in the labels or the problem itself, not a fixable modeling gap.
Fix: check label quality directly (are some of the "wrong" predictions actually mislabeled ground truth?) before concluding the model needs more work; if labels are clean and errors are truly scattered, this may be close to the practical ceiling for this feature set.

**Symptom: "A stakeholder asks 'why did the model predict this for this specific customer' and you can't give a real answer."**
Diagnostic: you likely haven't built any per-prediction explainability (feature contribution) alongside the aggregate metric.
Fix: use a tool like SHAP or the model's native feature-importance-per-prediction capability (tree-based models support this directly) to answer specific "why this prediction" questions, not just "what matters on average."`,
  },
  {
    section_type: "checklist",
    title: "Model Evaluation Pre-Ship Checklist",
    order_index: 6,
    content: `- [ ] The "good enough" threshold was written down and agreed with a stakeholder before the final evaluation ran
- [ ] The reported metric includes a confidence interval, not just a point estimate
- [ ] Performance was broken down by every segment the business plausibly cares about, not just reported in aggregate
- [ ] A sample of wrong predictions was reviewed directly, not just summarized statistically
- [ ] Each iteration's change and hypothesis are recorded, along with whether the result confirmed or refuted it
- [ ] The final model was compared against both the trivial baseline and the previous best iteration, with confidence intervals in view
- [ ] Diminishing returns were recognized and iteration stopped for a stated reason, not an arbitrary deadline alone
- [ ] Per-prediction explainability exists for at least the highest-stakes decisions the model makes
- [ ] The decision to ship (or not) is documented along with the accepted trade-offs
- [ ] A monitoring plan exists: what metric, what cadence, and what triggers a retrain or rollback`,
  },
  {
    section_type: "template",
    title: "Evaluation Report Template",
    order_index: 7,
    content: `**Model / experiment ID:** ___
**Problem being solved:** ___
**Pre-agreed "good enough" threshold:** ___ (metric, value, decided by whom, when)

**Aggregate result:** metric ___ (value ± confidence interval)
**Baseline result (same split):** ___
**Meets threshold?** Yes / No — explain

**Segment breakdown:**
| Segment | N | Metric | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

**Top 3 error patterns found in error analysis:**
1. ___
2. ___
3. ___

**Known limitations and where the model should NOT be trusted:** ___

**Monitoring plan:** metric to track ___, check frequency ___, retrain/rollback trigger ___

**Decision:** Ship / Ship with caveats / Do not ship — reasoning: ___`,
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 8,
    content: `**Essential**
- [scikit-learn: Model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html) — the canonical reference for every standard metric, including when each one is (and isn't) appropriate.
- [scikit-learn: Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html) — covers k-fold and its variants (stratified, grouped, time-series split), directly relevant to getting an honest confidence interval.

**Recommended**
- [SHAP documentation](https://shap.readthedocs.io/) — the standard tool for per-prediction explainability referenced in the debugging playbook above; the "Introduction" and "Tabular examples" sections are the practical starting point.
- Google's [Machine Learning Crash Course: Classification](https://developers.google.com/machine-learning/crash-course/classification) — a clear, free walkthrough of precision/recall/ROC trade-offs with interactive visualizations.

**Reference**
- [statsmodels: Confidence intervals](https://www.statsmodels.org/stable/index.html) — for teams wanting a more rigorous statistical treatment of interval estimation than a quick bootstrap.

**Advanced**
- Breck et al., ["The ML Test Score: A Rubric for ML Production Readiness"](https://research.google/pubs/pub46555/) (Google, 2017) — a widely cited practical rubric covering exactly the kind of evaluation rigor this module teaches, extended to full production systems.`,
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Confidence intervals on a small test set",
    problem_statement: `Reuse your best model from Module 2's Wine Quality exercise (or retrain it if needed). Using bootstrap resampling (resample the test set with replacement 1,000 times, recompute RMSE each time), compute a 95% confidence interval around your RMSE.

Then answer: if a colleague's competing model scores RMSE 0.02 lower than yours on the same test set, is that a real improvement, or is it within your confidence interval?`,
    starter_context: `The Wine Quality test set from Module 2 has roughly 320 rows (20% of ~1,600) — small enough that a naive point-estimate comparison is genuinely risky.`,
    hints: [
      "Bootstrap resampling means: draw a random sample of the same size as your test set, with replacement, recompute the metric, repeat many times, and look at the spread of results.",
      "A 95% confidence interval from bootstrap results is typically the 2.5th and 97.5th percentile of the resampled metric values.",
      "If the competing model's score falls inside your interval, you cannot claim a meaningful difference from this test set alone.",
    ],
    solution_notes: `On a ~320-row test set, RMSE confidence intervals for this dataset are typically fairly wide (often ±0.03-0.05 at 95% confidence) — meaning a 0.02 difference between two models is very likely within noise and should not be reported as a real improvement without a larger test set or repeated cross-validation. This is the expected, correct conclusion for this exercise, and matches a very common real-world situation where teams over-interpret small differences on small test sets.`,
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Segment-level evaluation on the Credit Default model",
    problem_statement: `Reuse your Module 2 Credit Card Default classifier. Break down its performance (recall and precision at your chosen threshold) by at least two segments: education level and age group (bucket age into your own reasonable ranges).

Identify whether performance is meaningfully uneven across any segment, and write a short recommendation on whether that unevenness should block shipping the model as-is.`,
    starter_context: `The dataset includes EDUCATION and AGE columns among the demographic fields. There is no single correct age-bucketing scheme — use your judgment and state your reasoning.`,
    hints: [
      "Compute recall separately within each segment, not just precision — for a credit-risk model, missing real defaulters (low recall) in a specific segment is usually the more consequential failure.",
      "Check the sample size within each segment before drawing conclusions — a segment with only 40 rows will have a very noisy metric estimate.",
      "Consider whether any observed unevenness is explainable by a legitimate factor (e.g. younger customers having thinner credit history, which is a real feature-availability issue) versus something that would raise a fairness concern.",
    ],
    solution_notes: `A well-executed analysis on this dataset typically finds some genuine variation in recall across age groups, often correlated with how much payment history is available (younger/newer customers have less history, which weakens the model's strongest features). The correct recommendation distinguishes between "explainable by data availability" and "not explainable, and therefore worth escalating" — and explicitly checks segment sample sizes before treating small differences as meaningful, applying the same confidence-interval reasoning as the guided exercise.`,
  },
  {
    level: "independent",
    order_index: 2,
    title: "Design a full evaluation report and shipping recommendation",
    problem_statement: `Take any model you've built in this course so far (Wine Quality, Credit Default, or Bike Sharing) and produce a complete Evaluation Report using this module's template. You decide the "good enough" threshold retroactively is not allowed — state clearly in your report what threshold you would have set in advance and why, based on the nature of the problem, then honestly evaluate whether your actual model meets it.

Your report must include a segment breakdown, at least one documented error-analysis finding, a stated limitation, and a monitoring plan — and must end with an explicit ship / ship-with-caveats / do-not-ship recommendation, defended in 3-5 sentences.`,
    starter_context: `This exercise deliberately gives you the least amount of structure in the course so far — the goal is to simulate producing a real evaluation report for a stakeholder who wasn't in the room while you built the model.`,
    hints: [
      "Resist the temptation to set an easy threshold now that you already know your model's score — write the threshold reasoning as if you were setting it before ever training a model on this problem.",
      "A 'do not ship' or 'ship with caveats' conclusion is a completely legitimate and often more impressive answer than 'ship' — don't force a positive conclusion the evidence doesn't support.",
    ],
    solution_notes: `There's no single correct answer here — this is evaluated on rigor, not on which model or which conclusion was chosen. A strong submission sets a threshold with real reasoning tied to the business cost of errors (not an arbitrary round number), reports a genuine confidence interval, finds at least one real, specific, non-generic pattern in the error analysis, and reaches a conclusion that follows honestly from the evidence presented — including being willing to recommend against shipping if the evidence supports that.`,
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "Why is a confidence interval more useful than a single point-estimate metric when deciding whether a model is ready to ship?", what_is_tested: "Understanding of statistical uncertainty in small-sample evaluation, beyond just knowing the term 'confidence interval'.", strong_answer_structure: "Explain that a test set is itself a sample, so any metric computed on it has sampling variance; a point estimate hides that variance and invites false confidence, especially when comparing two close scores.", weak_answer_example: "\"Confidence intervals are more scientific\" without explaining the actual mechanism (sampling variance).", follow_up_question: "How would the width of that interval change if your test set were 10x larger?" },
  { category: "applied", order_index: 1, question: "A model has 90% overall accuracy but 60% accuracy on your most valuable customer segment. Walk me through how you'd handle this.", what_is_tested: "Whether the candidate treats segment-level failures as a real finding requiring a real decision, not a footnote.", strong_answer_structure: "Propose investigating why that segment underperforms (data availability, feature relevance, label quality), quantify the business cost of that segment's errors specifically, and bring a clear recommendation to stakeholders rather than silently shipping or silently blocking.", weak_answer_example: "\"90% is still a good number overall\" — dismisses the segment-level finding without investigation.", follow_up_question: "The segment turns out to have 5x less training data than average. What are your options?" },
  { category: "scenario", order_index: 2, question: "You've iterated on a model for three weeks and the metric has stopped improving. Your manager asks why you haven't made progress. How do you respond?", what_is_tested: "Ability to communicate a legitimate 'we've hit the ceiling' finding as real, valuable information rather than a personal failure to apologize for.", strong_answer_structure: "Present the iteration history with hypotheses tested and results, explain that a plateau after exhausting reasonable hypotheses is itself a real and useful finding (it tells you the current features/data may be at their limit), and propose the actual next options: new data sources, redefining the problem, or shipping the current best result.", weak_answer_example: "Apologizing repeatedly without presenting what was learned or what the actual options are now.", follow_up_question: "What's the difference between 'we've hit a ceiling' and 'we're doing something wrong'? How do you tell which one you're in?" },
  { category: "debugging", order_index: 3, question: "Your model's cross-validation folds show wildly different scores (e.g. 0.72, 0.81, 0.68, 0.85, 0.70). What does this tell you?", what_is_tested: "Understanding that high variance across folds is itself a diagnostic signal, not just noise to average away.", strong_answer_structure: "Explain that large fold-to-fold variance suggests the dataset may be too small, may contain a non-random structure the k-fold split doesn't respect (e.g. grouped or time-based data), or the model itself is unstable (high variance model family) for the amount of data available.", weak_answer_example: "\"I'd just report the average\" — ignoring that the spread itself is meaningful information.", follow_up_question: "How would you check whether the variance comes from the data or from the model?" },
  { category: "applied", order_index: 4, question: "Would you rather ship a model with 80% accuracy and a tight confidence interval, or 85% accuracy with a wide one?", what_is_tested: "Judgment about uncertainty versus raw performance, applied to a realistic trade-off rather than a textbook answer.", strong_answer_structure: "Explain that this depends on the cost of surprises — for a high-stakes or hard-to-monitor deployment, a lower but more certain number is often the safer choice, while for a low-stakes, easily-monitored deployment, the higher expected value may be worth the extra uncertainty; there's no universally correct answer.", weak_answer_example: "A flat \"always pick the higher accuracy\" answer with no consideration of context or risk.", follow_up_question: "How would your answer change if you could easily monitor and quickly roll back the model after shipping?" },
  { category: "scenario", order_index: 5, question: "A stakeholder tells you '85% just isn't good enough, get it to 95%.' How do you respond?", what_is_tested: "Ability to push back constructively on an arbitrary target and reground the conversation in the actual decision the model supports.", strong_answer_structure: "Ask what specific decision the model supports and what the actual cost of the remaining 15% of errors is; propose that the target should be derived from that cost analysis, and be willing to state honestly if 95% isn't achievable with the current data or features, along with what would be required to get closer.", weak_answer_example: "Silently agreeing to chase 95% without asking what's driving the target or whether it's realistic.", follow_up_question: "The stakeholder says 'competitors claim 95%.' How does that change your response, if at all?" },
  { category: "fundamentals", order_index: 6, question: "What's the difference between error analysis and hyperparameter tuning, and why does the order you do them in matter?", what_is_tested: "Understanding that error analysis should usually precede and guide tuning, not the other way around.", strong_answer_structure: "Explain that hyperparameter tuning optimizes an existing model/feature setup, while error analysis can reveal that the real problem is a missing feature or a data issue no amount of tuning would fix — doing tuning first risks polishing a fundamentally limited setup.", weak_answer_example: "Treating them as interchangeable steps with no particular order.", follow_up_question: "Give an example of an error pattern that tuning can't fix, only new features or new data can." },
  { category: "applied", order_index: 7, question: "How would you explain to a non-technical stakeholder why your model can't be 100% accurate?", what_is_tested: "Ability to communicate the concept of irreducible error / label noise / inherent problem difficulty in plain language.", strong_answer_structure: "Use a concrete example relevant to the problem: some outcomes genuinely depend on information not captured in the available data (e.g. a customer's private financial situation isn't visible in transaction history alone), so some errors are inherent to the problem, not a fixable modeling gap.", weak_answer_example: "\"No model is ever 100% accurate\" stated as a fact with no explanation of why, which doesn't actually build stakeholder understanding.", follow_up_question: "How would you estimate roughly how much of the remaining error is irreducible versus fixable?" },
  { category: "project_defence", order_index: 8, question: "Defend your decision to ship (or not ship) the model from your independent evaluation-report exercise.", what_is_tested: "Whether the candidate can defend a real decision under questioning, not just present a report.", strong_answer_structure: "Restate the pre-agreed threshold and why it was set that way, walk through how the actual result compares, name the specific limitation found in error analysis, and explain what would change the decision if new information arrived.", weak_answer_example: "Repeating the report's conclusion without being able to explain the reasoning behind the threshold or defend it against a challenge.", follow_up_question: "If I told you the business now needs this model in production tomorrow regardless of your recommendation, what would you insist on before agreeing?" },
  { category: "behavioural", order_index: 9, question: "Tell me about a time you had to tell a stakeholder a model wasn't ready, or wasn't going to hit a target they wanted.", what_is_tested: "Real experience (or realistic reasoning) navigating the tension between technical honesty and stakeholder expectations.", strong_answer_structure: "A strong answer describes the specific evidence used to make the case, how the conversation was framed (options and trade-offs, not just 'no'), and what happened as a result.", weak_answer_example: "A vague answer with no specifics about the evidence presented or how the disagreement was actually resolved.", follow_up_question: "What would you have done differently if the stakeholder had pushed back harder?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: modelEvalSkill } = await supabase.from("skills").select("id").eq("name", "Model Evaluation").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: modelEvalSkill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Module 3 (Evaluation & Iteration) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
