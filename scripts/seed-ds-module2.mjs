import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "f394f4ee-7c5d-4f57-9555-d95280c4a4a4"; // Core ML

const sections = [
  {
    section_type: "the_field",
    title: "What core ML work actually looks like",
    order_index: 0,
    content: `Most of what happens in "model building" isn't algorithm selection — it's problem framing and validation design. A working data scientist spends the majority of their time on things that never appear in a scikit-learn tutorial: agreeing with stakeholders on what "good" means before writing any model code, building a baseline that's embarrassingly simple on purpose, and spending far more time on error analysis than on trying new algorithms.

The actual sequence in a competent team looks like this: someone states the business question ("will this customer churn in the next 30 days?"), it gets translated into a prediction target with a precise definition (what exactly counts as churn — cancelled subscription? 30 days of no login? both?), a metric is chosen that reflects the actual cost of being wrong (a false negative on churn is usually far more expensive than a false positive), and only *then* does modeling start — with the dumbest possible baseline first.

Junior data scientists tend to reach for the most sophisticated model they know first. Senior ones do the opposite: they build a majority-class predictor or a simple rule ("predict last month's average") in the first hour, because it tells them two things immediately — what performance actually looks like on this specific data, and whether the problem is even learnable with the features available. If a random forest beats the mean-predictor by 0.3%, that's a real finding, and it usually means the features don't contain the signal anyone assumed they did.

The skill being built in this module isn't "know many algorithms." It's: pick the right metric, build a real baseline, compare models honestly on identical data splits, and be able to explain — with evidence — why the chosen model is the right one for this specific constraint set (latency, interpretability, maintenance cost), not just the one with the best leaderboard score.`,
  },
  {
    section_type: "mental_models",
    title: "How professionals think about model building",
    order_index: 1,
    content: `**1. A model is a compressed argument, not a black box.** Every model is making a claim: "these inputs are sufficient to predict this outcome, weighted this way." Your job is to be able to state that argument in plain language, not just report a metric.

**2. The metric is a decision, not a default.** Accuracy, F1, AUC, RMSE, MAE — each optimizes for a different notion of "good," and each is wrong for some real business problems. Choosing the metric *is* modeling work, and it should happen before any model is trained, with a stakeholder in the room if the cost of false positives and false negatives is genuinely asymmetric.

**3. The baseline is a claim you must beat, not a formality.** "Beat the mean" or "beat last period's value" or "beat the majority class" sounds trivial, but it's the only thing standing between you and shipping a model that adds zero value while looking sophisticated. A model that can't clear this bar by a meaningful margin isn't ready, no matter how good the metric number looks in isolation.

**4. Overfitting is a signal, not a bug.** A large gap between training and validation performance is information — it tells you the model memorized noise instead of learning structure. The response isn't panic, it's diagnosis: too many features relative to data, leakage, insufficient regularization, or a model family that's simply too flexible for the amount of signal available.

**5. Feature engineering encodes what you know that the algorithm can't discover on its own.** A raw timestamp is nearly useless to most models; "days since last purchase" or "is this a weekend" often carries the actual signal. The algorithm finds patterns in what you give it — it doesn't invent domain knowledge you failed to encode.

**6. Bias-variance is a dial you set on purpose.** A simple model (high bias, low variance) is stable but may miss real structure. A complex model (low bias, high variance) can fit the training data closely but generalize poorly. Which side of that trade-off you want depends on how much data you have and how costly instability is — this is a decision, not something that happens to you.

**7. The best model is the simplest one that beats the baseline by enough to matter.** "Enough to matter" is a business judgment, not a statistics one — a 0.5% AUC improvement that costs 10x the inference latency and requires a GPU to serve is usually the wrong trade, even though it's technically "better."`,
  },
  {
    section_type: "decision_framework",
    title: "Choosing a learning paradigm and a first model family",
    order_index: 2,
    content: `**Step 1 — which paradigm?**

**IF** you have historical examples with known outcomes and want to predict that outcome for new cases **THEN** use supervised learning. **BECAUSE** the algorithm needs a target to learn against. **WATCH OUT FOR**: "we have data" is not the same as "we have labels" — check that the label is actually reliable and available at prediction time, not just in the historical dataset.

**IF** you want to find structure in data with no labeled outcome — segments, groupings, anomalies **THEN** use unsupervised learning (clustering, dimensionality reduction, anomaly detection). **BECAUSE** there's nothing to predict, only structure to discover. **WATCH OUT FOR**: unsupervised results have no ground truth to validate against — you need a domain expert to sanity-check whether the clusters actually mean something, not just that they're mathematically separable.

**IF** the problem involves a sequence of decisions with delayed reward and an environment you can interact with **THEN** consider reinforcement learning. **BECAUSE** RL is the right tool only when actions affect future state and reward isn't immediate. **WATCH OUT FOR**: this is rare in typical business data science. Most "should we use RL for this recommendation problem" questions are better solved with supervised learning plus a simple policy layer — RL adds enormous complexity (simulation environments, exploration/exploitation tuning, instability) that's rarely justified outside genuinely sequential problems (robotics, game-playing, some ad-bidding systems).

**Step 2 — which model family, for a supervised tabular problem (the most common case)?**

**IF** the data is small-to-medium tabular data with mixed numeric/categorical types **THEN** start with gradient-boosted trees (XGBoost/LightGBM/CatBoost) as your "real" first model, after a linear baseline. **BECAUSE** tree ensembles handle mixed types, non-linear interactions, and missing values with minimal preprocessing, and are the empirical default that wins most tabular competitions and production systems. **WATCH OUT FOR**: they overfit small datasets easily without regularization (max_depth, min_child_weight, learning rate) and are harder to explain to non-technical stakeholders than a linear model.

**IF** stakeholders need to see and challenge exactly why each prediction was made (credit decisions, medical triage, anything regulated) **THEN** start with logistic/linear regression with L1/L2 regularization, or a single shallow decision tree. **BECAUSE** the coefficients or the tree's splits are directly readable, and defensibility matters more than the last 2% of performance. **WATCH OUT FOR**: don't assume "interpretable" means "simple to build correctly" — regularization strength, feature scaling, and multicollinearity still need real attention.

**IF** you're working with images, audio, or raw text and have enough data **THEN** deep learning (CNNs, transformers) is usually necessary — traditional feature engineering can't compete. **WATCH OUT FOR**: on small datasets, deep learning usually underperforms a well-tuned tree ensemble on tabular features extracted from the same data; don't reach for a neural network just because it's the modern default.`,
  },
  {
    section_type: "workflow",
    title: "The real supervised-modeling workflow",
    order_index: 3,
    content: `**1. Restate the business question as a precise prediction target.** "Will this customer churn" becomes "will this customer have zero purchases in the 30 days following the observation date." Ambiguity here poisons everything downstream.

**2. Choose the evaluation metric with the actual cost of errors in mind.** For imbalanced classification, this is rarely accuracy — it's usually precision/recall/F1 at a specific decision threshold, or AUC-PR (not AUC-ROC, which is misleadingly optimistic under heavy imbalance).

**3. Split the data correctly before touching any features.** Random split for i.i.d. data; time-based split for anything with a temporal component (never let the model train on the future and test on the past — this is the single most common leakage source in real projects).

**4. Build the dumbest possible baseline and record its score.** Majority class, mean/median predictor, or "last known value." This number is the bar everything else must clear.

**5. Build a first real model with minimal feature engineering.** The point is to get an honest read on how much signal exists before investing in complexity.

**6. Do error analysis before adding complexity.** Look at the specific rows the model gets wrong. Is there a pattern — a segment, a data quality issue, a missing feature? This tells you what to build next far more reliably than trying more algorithms.

**7. Iterate features guided by the errors, not by intuition alone.** Add the feature that would have fixed the specific failure pattern you just found, then re-measure.

**8. Compare every model on the identical split and identical metric.** A model trained on a slightly different preprocessing pipeline or a different random split is not a fair comparison, even if the numbers look close.

**9. Pick the model based on evidence plus real constraints — not the leaderboard.** Latency budget, explainability requirement, retraining cost, and team's ability to maintain it all matter as much as the metric. Document the decision and the trade-off you accepted, in writing, so the next person (or your future self) doesn't have to reverse-engineer it.`,
  },
  {
    section_type: "failure_modes",
    title: "How core ML work actually breaks",
    order_index: 4,
    content: `**Failure 1 — Data leakage through feature engineering.**
*What*: a feature is built using information that wouldn't actually be available at prediction time (e.g., "total lifetime purchases" computed using data that includes the period you're trying to predict).
*How it happens*: features are often engineered on the full dataset before the train/test split, or aggregate features accidentally include future rows.
*Why beginners miss it*: the model's validation score looks great — leakage almost always makes performance look better, not worse, so there's no obvious signal something is wrong.
*Detect*: suspiciously high performance for the problem's apparent difficulty; a single feature with implausibly high importance; performance that collapses when the model is deployed on genuinely new data.
*Prevent*: compute every feature using only information available strictly before the prediction timestamp; do all feature engineering after the train/test split, or with split-aware code (fit on train, transform on test).
*Interview question*: "Your model gets 0.98 AUC on a churn problem where the base rate is 5%. What's your first hypothesis?"
*Real-world consequence*: a model that looks excellent in validation and performs at-or-below baseline the moment it's deployed — a classic, expensive, and embarrassing production failure.

**Failure 2 — Overfitting to the validation set through repeated tuning.**
*What*: after enough rounds of trying hyperparameters against the same validation set, the model (and the human) starts fitting noise in that specific validation split, not the true underlying pattern.
*How it happens*: hyperparameter search loops running dozens or hundreds of configurations, all scored against one static validation set.
*Why beginners miss it*: each individual tuning step looks reasonable; the problem only appears in aggregate, and only shows up on a genuinely held-out test set.
*Detect*: performance on a final, never-touched test set is meaningfully worse than the best validation score achieved during tuning.
*Prevent*: keep a true three-way split (train/validation/test) and only evaluate on test once, at the very end; use cross-validation during tuning instead of a single static validation split.
*Interview question*: "You tuned for two weeks and validation AUC went from 0.81 to 0.89. Test set AUC is 0.82. What happened?"
*Real-world consequence*: shipped model underperforms its reported metric in production, undermining trust in the whole modeling process.

**Failure 3 — Ignoring class imbalance and reporting a meaningless accuracy number.**
*What*: on a dataset where 95% of examples are the negative class, a model that always predicts "negative" scores 95% accuracy while being completely useless.
*How it happens*: accuracy is the default metric in most tutorials and libraries, so it's what gets reported without question.
*Why beginners miss it*: 95% *sounds* good, and nothing about the number itself signals the problem.
*Detect*: check the base rate of the target class first, always; compare the model's recall on the minority class specifically.
*Prevent*: for imbalanced problems, lead with precision/recall/F1 or AUC-PR, and always report the trivial baseline's score for context.
*Interview question*: "Your fraud model has 99.5% accuracy. The fraud rate is 0.3%. Should I be impressed?"
*Real-world consequence*: a "high-performing" model that never actually catches the cases the business cares about, discovered only after deployment.

**Failure 4 — Comparing models trained on inconsistent data splits or preprocessing.**
*What*: two candidate models are compared, but one was trained with a slightly different feature set, a different random seed for the split, or scaling applied before vs. after the split.
*How it happens*: iterative experimentation without a fixed, versioned evaluation harness — each experiment quietly diverges a little from the last.
*Why beginners miss it*: the difference between two model scores can look meaningful when it's actually just split variance, not a real capability difference.
*Detect*: re-run both models on the exact same fixed split with a fixed seed; if the "winner" changes, the original comparison was noise.
*Prevent*: build one evaluation harness (fixed split, fixed seed, fixed metric function) and run every candidate model through the identical harness.
*Interview question*: "How do you know Model B is actually better than Model A, and not just luckier on this split?"
*Real-world consequence*: the "better" model shipped to production isn't actually better, and no one can explain why performance doesn't match expectations.`,
  },
  {
    section_type: "debugging_playbook",
    title: "Your model's numbers look wrong — a troubleshooting guide",
    order_index: 5,
    content: `**Symptom: "98% accuracy but the business says the model is useless."**
Diagnostic: check the class balance of the target. Compute the majority-class-baseline accuracy — if it's close to your model's accuracy, the model has learned little or nothing beyond "always predict the common class."
Fix: switch to precision/recall/F1/AUC-PR as the reporting metric; re-tune against that metric, not accuracy.

**Symptom: "Great cross-validation score, terrible holdout test score."**
Diagnostic: check whether the data has any temporal or grouped structure (repeated customers, sequential events) that a random split ignores. Also check for leakage — features computed using post-outcome information.
Fix: switch to a time-based or group-based split that matches how the model will actually be used in production; re-derive any suspicious features to guarantee they only use pre-prediction-time information.

**Symptom: "One feature has implausibly high importance."**
Diagnostic: inspect that feature directly — trace exactly how and when it's computed relative to the prediction timestamp.
Fix: if it encodes any information from after the prediction point (even indirectly, like a running total that includes the target period), remove or recompute it correctly, then retrain and re-evaluate.

**Symptom: "Two team members trained 'the same model' and got meaningfully different numbers."**
Diagnostic: this is almost never randomness alone — diff the preprocessing pipelines, feature lists, and split code line by line before suspecting the random seed.
Fix: version-control the entire evaluation harness (data version, split logic, feature code, metric function) so "the same model" actually means the same experiment.

**Symptom: "The model's performance degrades a few weeks after deployment, even though nothing changed in the code."**
Diagnostic: this is very likely data drift — the distribution of incoming data has shifted from what the model was trained on (seasonality, a product change, a shift in the customer base).
Fix: monitor input feature distributions and prediction distributions over time; set a retraining cadence or trigger based on measured drift, not a fixed calendar guess.`,
  },
  {
    section_type: "checklist",
    title: "Before You Trust a Model — pre-ship checklist",
    order_index: 6,
    content: `- [ ] The prediction target has a precise, unambiguous definition everyone agrees on
- [ ] The evaluation metric was chosen based on the actual cost of false positives vs. false negatives, before modeling started
- [ ] A trivial baseline (majority class / mean / last-known-value) was computed and recorded
- [ ] The train/validation/test split respects the real-world prediction scenario (time-based if the problem has a temporal component)
- [ ] Every feature was checked for leakage — could this value actually exist at prediction time in production?
- [ ] The final test set was touched exactly once, after all tuning was complete
- [ ] Class balance was checked, and the reported metric is appropriate for that balance
- [ ] All compared models were evaluated on the identical split, seed, and metric function
- [ ] Error analysis was performed on a sample of wrong predictions, not just the aggregate metric
- [ ] The chosen model's trade-offs (latency, interpretability, retraining cost) were matched against real production constraints
- [ ] The reasoning for the final model choice is written down somewhere a teammate can find it
- [ ] There is a plan for monitoring the model's performance and input distribution after deployment`,
  },
  {
    section_type: "template",
    title: "Model Comparison Log",
    order_index: 7,
    content: `Use one row per model attempt. Keep it in version control alongside the code, not in a separate untracked spreadsheet.

**Experiment ID:** ___
**Date:** ___
**Model family:** ___ (e.g. logistic regression, LightGBM, ...)
**Feature set version:** ___ (link to the exact feature-engineering commit/version)
**Split strategy:** ___ (random / time-based / grouped — and the seed used)
**Metric:** ___ (name the exact metric and threshold if applicable)
**Baseline score (this split):** ___
**This model's score:** ___
**Training time / inference latency:** ___
**Key hyperparameters:** ___
**What changed from the previous experiment:** ___
**Hypothesis being tested:** ___
**Result vs. hypothesis:** ___
**Next step:** ___`,
  },
  {
    section_type: "template",
    title: "Error Analysis Worksheet",
    order_index: 8,
    content: `Pull a sample of the model's wrong predictions (aim for 20-30, stratified across error types if possible) and work through this for the sample as a whole, not row by row.

**1. What does the model get wrong most often?** (false positives, false negatives, or a specific segment)

**2. Is there a pattern in the wrong predictions?** (a customer segment, a time period, a specific value range, missing data)

**3. Is any of this pattern caused by a data quality issue** (missing values, mislabeled examples, an upstream bug) **rather than a genuine modeling limitation?**

**4. Is there a feature that, if added or fixed, would plausibly correct this specific error pattern?**

**5. Is the error actually costly to the business, or is it a case where being wrong doesn't matter much?** (not all errors are equally expensive — prioritize accordingly)

**6. What's the single next experiment this analysis suggests**, and what result would confirm or refute the hypothesis behind it?`,
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 9,
    content: `**Essential**
- [scikit-learn: Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html) — the single best short document on leakage, split strategy, and metric selection, written by the people who built the library most of this module runs on.
- [scikit-learn: Choosing the right estimator](https://scikit-learn.org/stable/machine_learning_map.html) — a practical map from problem type to model family, useful as a first-pass decision aid.

**Recommended**
- *An Introduction to Statistical Learning* (James, Witten, Hastie, Tibshirani) — free official PDF at [statlearning.com](https://www.statlearning.com/) — the clearest rigorous treatment of bias-variance, regularization, and model selection available, and the standard reference most working data scientists learned from.
- [XGBoost documentation: Notes on parameter tuning](https://xgboost.readthedocs.io/en/stable/tutorials/param_tuning.html) — practical, not just a parameter list; explains what each regularization knob is actually for.

**Reference**
- [LightGBM documentation](https://lightgbm.readthedocs.io/) and [CatBoost documentation](https://catboost.ai/docs) — keep both open next to XGBoost's when picking a gradient-boosting library; they differ meaningfully in categorical handling and speed.

**Advanced**
- Google's [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) (also referenced in Module 1) — Rules 1-15 specifically address when *not* to build a model yet and how to think about a first launch; worth re-reading with a specific model in front of you this time.`,
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Baseline vs. real model — UCI Wine Quality",
    problem_statement: `Using the [UCI Wine Quality dataset](https://archive.ics.uci.edu/dataset/186/wine+quality) (red wine subset, ~1,600 rows, physicochemical properties predicting a 0-10 quality score), build and compare exactly two models:

1. A trivial baseline that always predicts the mean quality score.
2. A linear regression using all available features.

Report RMSE and MAE for both on a held-out 20% test split (random split is fine here — there's no temporal or grouping structure in this dataset). State explicitly whether the linear regression beats the baseline by a meaningful margin, and what "meaningful" means in the context of a 0-10 quality scale.`,
    starter_context: `The dataset has 11 numeric physicochemical features (acidity, sugar, chlorides, sulfur dioxide, density, pH, sulphates, alcohol) and a quality score (integer, 0-10, though almost all real values fall between 3 and 8). This is a regression problem, not classification, even though the target looks like small integers.`,
    hints: [
      "Compute the baseline's RMSE by predicting the training set's mean quality for every test row — do not fit anything.",
      "Check whether features need scaling for linear regression to converge cleanly (they're on very different scales — free sulfur dioxide is in the tens, density is close to 1.0).",
      "Look at which coefficients are largest in magnitude after scaling — do they match your intuition about what should matter for wine quality (alcohol and volatile acidity are usually the strongest signals in this dataset)?",
    ],
    solution_notes: `A reasonable baseline RMSE on this dataset is close to 0.80 (quality scores have a standard deviation around that). A properly scaled linear regression typically lands around RMSE 0.65, roughly an 18-20% improvement over the baseline — real, but modest, which is expected: linear regression can't capture the non-linear interactions that a tree ensemble would pick up. The strongest coefficients are usually alcohol (positive) and volatile acidity (negative), which matches wine-tasting intuition and is a good sanity check that the model learned something sensible rather than noise.`,
    order_index: 0,
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Class imbalance and metric choice — UCI Credit Card Default",
    problem_statement: `Using the [UCI Default of Credit Card Clients dataset](https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients) (30,000 rows, Taiwanese credit card customers, binary target: default payment next month), build a classifier and evaluate it correctly given the class imbalance (roughly 22% default rate).

You decide: which metric(s) to lead with, what split strategy to use, and which model family to start with. Justify each choice in a short write-up (a few sentences each is enough) before showing results.`,
    starter_context: `The 22% default rate is imbalanced enough that accuracy will be misleading but not so extreme that specialized resampling techniques (SMOTE etc.) are strictly necessary for a first pass — a well-chosen metric and threshold are usually sufficient. Features include credit limit, payment history over 6 months, and demographic fields.`,
    hints: [
      "Report the majority-class-baseline accuracy first (roughly 78%) so anyone reading your results has an honest reference point.",
      "AUC-ROC will look better than the model deserves under this level of imbalance — consider reporting AUC-PR or precision/recall at a specific threshold alongside it.",
      "The payment-history features (PAY_0 through PAY_6) are the strongest signal in this dataset by a wide margin — check feature importance and see if that matches.",
    ],
    solution_notes: `A well-tuned gradient-boosted model on this dataset typically reaches AUC-ROC around 0.77-0.78 and AUC-PR around 0.5-0.55 — a real improvement over random guessing (AUC-PR at the base rate would be ~0.22), but nowhere near "solved." The payment-history features dominate feature importance, which is the expected and defensible result: recent repayment behavior is the strongest real-world predictor of future default, more so than credit limit or demographics. A defensible write-up explicitly states the metric choice was driven by the asymmetric cost of missing a real default (a false negative) versus flagging a customer who wasn't actually going to default (a false positive).`,
    order_index: 1,
  },
  {
    level: "independent",
    order_index: 2,
    title: "Time-based leakage trap — UCI Bike Sharing demand forecasting",
    problem_statement: `A business brief: a bike-sharing operator wants to predict daily rental demand so they can plan bike redistribution. You're given the [UCI Bike Sharing dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset) (daily aggregation, ~730 days, weather + calendar features, target: total daily rentals).

Build a model to predict daily demand. You decide the split strategy, features, and model. The business wants to know: how much better than a naive forecast (e.g., "same as last week") is your model, and can they trust it for the next quarter, not just the historical period you tested on?

Constraints: the operator will only ever have data up to "today" when making a prediction for tomorrow — your evaluation must reflect that.`,
    starter_context: `This dataset spans two years and includes a "yr" and "cnt" (rentals, split into casual and registered riders) among other features. There is an obvious trap here related to how the data is split.`,
    hints: [
      "A random 80/20 split lets the model 'see' days from throughout the two years during training, including days that come chronologically after some test days — this is a leakage trap disguised as a normal train/test split.",
      "Compare your model against a naive 'same as last week' or 'same as yesterday' baseline, not just a mean predictor — demand forecasting baselines are usually much stronger than a flat mean.",
      "Watch out for the 'casual' and 'registered' columns if they sum to your target 'cnt' — including them as features would be leakage (they're only knowable after the fact, same day as the outcome).",
    ],
    solution_notes: `The correct approach uses a chronological split (train on year 1 plus part of year 2, test on the final months) rather than a random split — a random split will report an overly optimistic score because the model gets to train on data from both before and after each test point, which is impossible in real deployment. The 'casual'/'registered' columns are a genuine leakage trap: they sum almost exactly to 'cnt' and must be excluded as features. A well-built model (gradient boosting on weather + calendar + a lagged demand feature) typically beats a 'same as last week' baseline noticeably, since weather has real explanatory power beyond simple seasonality — but the honest write-up should flag that two years of data is a thin basis for claiming the model generalizes reliably across an entire future quarter, and should recommend a monitoring plan rather than a blanket guarantee.`,
    order_index: 2,
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "Why would you choose AUC-PR over AUC-ROC for a highly imbalanced classification problem?", what_is_tested: "Whether the candidate understands that ROC curves can look deceptively good under class imbalance because the false positive rate is diluted by a large number of true negatives.", strong_answer_structure: "Explain that AUC-ROC's false-positive-rate axis is computed against the (large) negative class, so it stays low even with many false positives relative to the (small) positive class — making the curve look better than the model deserves. AUC-PR, by contrast, is sensitive to precision, which directly reflects how many of the model's positive predictions are actually correct, making it a more honest signal under imbalance.", weak_answer_example: "\"AUC-PR is just better for imbalanced data\" with no explanation of the actual mechanism.", follow_up_question: "If your AUC-ROC is 0.95 and your AUC-PR is 0.3, what does that combination tell you?" },
  { category: "applied", order_index: 1, question: "Walk me through how you'd choose a baseline for a regression problem forecasting next month's revenue.", what_is_tested: "Practical instinct for what a real baseline looks like, beyond 'predict the mean'.", strong_answer_structure: "Propose a naive forecast appropriate to the domain — e.g. 'same as last month' or 'same month last year adjusted for trend' — and explain why a domain-aware naive baseline is usually much harder to beat than a flat mean, especially for time series with seasonality.", weak_answer_example: "\"I'd predict the average revenue\" without considering trend or seasonality.", follow_up_question: "Your model beats the mean-predictor by 40% but only beats 'same as last month' by 2%. Which comparison matters more to the business, and why?" },
  { category: "scenario", order_index: 2, question: "Your team ships a churn model. Three weeks later, the model's precision has dropped noticeably even though no code changed. What's your investigation process?", what_is_tested: "Understanding of data/concept drift and a structured diagnostic approach rather than guessing.", strong_answer_structure: "Start by comparing the distribution of input features between training data and recent production data (data drift), then check if the relationship between features and the true outcome has changed (concept drift, e.g. a product change altered churn behavior). Propose monitoring feature distributions and periodic recalibration as the fix, not just retraining blindly.", weak_answer_example: "\"I'd just retrain the model\" without diagnosing why performance dropped first.", follow_up_question: "How would you distinguish data drift from concept drift in practice, given you can only observe predictions and features, not the true label in real time?" },
  { category: "debugging", order_index: 3, question: "A colleague shows you a model with 0.99 AUC on a fraud detection problem with a 0.4% fraud rate. What do you check first?", what_is_tested: "Instinct for leakage as the default hypothesis when performance looks implausibly good.", strong_answer_structure: "State that a score this high on such a rare event is a strong prior for leakage, then describe a concrete check: trace every feature back to whether it could only be known after the fraud determination was made (e.g. a 'flagged_by_fraud_team' field, or an aggregate that includes the fraudulent transaction itself).", weak_answer_example: "\"That's a great score, nice work\" — accepting an implausible result without scrutiny.", follow_up_question: "You find no leakage. What's your next hypothesis for why the score is so high?" },
  { category: "fundamentals", order_index: 4, question: "Explain overfitting to someone who understands basic statistics but not machine learning.", what_is_tested: "Ability to explain a core concept without jargon — a genuine test of understanding, not memorization.", strong_answer_structure: "Use a concrete analogy: a student who memorizes the exact answers to last year's practice exam will ace that specific exam but fail a new one testing the same concepts differently, because they learned the specific questions, not the underlying material. Connect this back to training vs. validation performance gaps.", weak_answer_example: "\"Overfitting is when training accuracy is high and test accuracy is low\" — a correct but circular definition that doesn't actually explain the mechanism to a non-technical listener.", follow_up_question: "What are two concrete things you'd do differently if you saw this happening?" },
  { category: "applied", order_index: 5, question: "When would you choose a single decision tree over a random forest or gradient-boosted ensemble, even though the ensemble almost always scores higher?", what_is_tested: "Whether the candidate can articulate real trade-offs beyond raw performance.", strong_answer_structure: "Explain that a single tree is fully interpretable — every prediction can be traced through a small number of readable splits — which matters when a human (a loan officer, a doctor, a regulator) needs to see and challenge the exact reasoning, not just an aggregate feature-importance chart.", weak_answer_example: "\"Ensembles are always better so I'd never use a single tree\" — misses that interpretability is sometimes a hard requirement, not a nice-to-have.", follow_up_question: "How would you improve a single tree's performance without giving up interpretability?" },
  { category: "scenario", order_index: 6, question: "Two data scientists on your team each built a model for the same problem and got very different validation scores. How do you figure out whose result to trust?", what_is_tested: "Understanding that most 'my model is better' disputes are actually methodology differences, not modeling skill differences.", strong_answer_structure: "Propose re-running both models through one shared, fixed evaluation harness — same split, same seed, same metric function, same feature set — before concluding anything about which model or which person did better work.", weak_answer_example: "\"Whoever has the higher number is right\" — ignores that the comparison itself might be invalid.", follow_up_question: "After fixing the harness, the scores converge and both models perform similarly. What does that tell you about the original difference?" },
  { category: "debugging", order_index: 7, question: "Your regression model's residuals show a clear pattern when plotted against the predicted value — not random noise. What does that tell you, and what would you do?", what_is_tested: "Understanding that residual analysis is a core diagnostic, not an academic exercise.", strong_answer_structure: "Explain that patterned residuals mean the model is systematically missing some structure in the data — it might be missing a non-linear relationship, an important interaction term, or a feature entirely. Propose plotting residuals against individual features to localize where the pattern comes from, rather than guessing.", weak_answer_example: "\"I'd just try a more complex model\" without first diagnosing what specific structure is being missed.", follow_up_question: "The pattern only appears for a specific customer segment. What does that suggest, and how would you address it?" },
  { category: "fundamentals", order_index: 8, question: "What's the difference between regularization reducing variance and simply using a simpler model?", what_is_tested: "Depth of understanding of the bias-variance framework beyond the standard soundbite.", strong_answer_structure: "Explain that regularization (L1/L2) keeps the full model complexity (all features available) but constrains the coefficients toward zero, which can be a more nuanced trade-off than removing features outright — L1 specifically can perform feature selection by driving some coefficients exactly to zero, while L2 shrinks all coefficients without eliminating any.", weak_answer_example: "\"They're basically the same thing\" — misses the meaningful mechanistic difference and the L1-vs-L2 distinction.", follow_up_question: "When would you choose L1 over L2, or a combination (elastic net)?" },
  { category: "behavioural", order_index: 9, question: "Describe a time a model you built didn't perform as well as expected in production. What did you do?", what_is_tested: "Honesty, diagnostic process, and whether the candidate treats production gaps as a normal part of the job rather than a personal failure to hide.", strong_answer_structure: "A strong answer describes a specific, real gap between validation and production performance, the concrete diagnostic steps taken (checking for drift, leakage, or a split methodology mismatch), what was found, and what changed afterward — in the model, the monitoring, or the process.", weak_answer_example: "A vague answer with no specific diagnostic process, or one that blames the data/business without describing what was actually investigated.", follow_up_question: "What would you build differently from day one, knowing what you know now, to catch this kind of gap earlier?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s) => ({ ...s, module_id: MODULE_ID })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e) => ({ ...e, module_id: MODULE_ID })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: featureEngSkill } = await supabase.from("skills").select("id").eq("name", "Feature Engineering").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: featureEngSkill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Module 2 (Core ML) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
