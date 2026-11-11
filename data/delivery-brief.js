// Agent-Driven Delivery — weekly brief. Update this file each week.
// Rules: facts (dates, prices, scores, sources) are pulled live from data/ai-data.js by lab + model name;
// text here is editorial interpretation. Never type a figure here that is not in the dataset.
window.DELIVERY_BRIEF = {
  week: "2026-11-10",
  weekLabel: "Week of Nov 10, 2026",
  asOf: "Nov 10, 2026",

  headline: "Two frontier agentic-coding models reached general availability within two days — Claude Fable 5.2 (Nov 9) and Gemini 4 Carbon (Nov 10, with /swarm multi-agent orchestration in Antigravity) — so model and agent version pinning plus re-validation is this week's main delivery task.",
  headlineSources: [
    {lab: "anthropic", model: "Claude Fable 5.2"},
    {lab: "google_deepmind", model: "Gemini 4 Carbon"}
  ],

  // 2. Model updates. Release date + source come from the dataset (model.release_date) unless `src` points at a news item.
  modelUpdates: [
    {lab: "anthropic", model: "Claude Fable 5.2",
     shipped: "Generally available frontier model for hard, open-ended work; effort settings (Medium default, High, Xhigh, Max) trade intelligence against cost.",
     effect: "New top tier for long-horizon agent tasks. Effort settings make per-task cost/quality a configuration decision, so pin both model id and effort level, and re-run your own acceptance suite before switching from Opus 5.5.",
     confidence: "High", why: "Official release post; benchmarks are company-reported."},
    {lab: "anthropic", model: "Claude Mythos 5.2",
     shipped: "Same underlying model as Fable 5.2 with reduced cyber and biology safeguards, restricted to vetted organizations via Cyber and Life Sciences Verification Programs.",
     effect: "Relevant to security and life-sciences teams only through program enrolment. Reduced safeguards raise the bar for access control, usage logging and approval gates.",
     confidence: "High", why: "Official release post; access terms beyond the post are unknown."},
    {lab: "google_deepmind", model: "Gemini 4 Carbon",
     shipped: "Generally available to developers and enterprises; /swarm in Google Antigravity turns one prompt into a coordinated team of agents. Introductory pricing until Nov 30, 2026.",
     effect: "Multi-agent orchestration inside the IDE shifts review load from single diffs to agent-team output. Budget pilots for the post–Nov 30 price.",
     confidence: "High", why: "Official Google post; price schedule is in the dataset."},
    {lab: "mistral", model: "Mistral Large 4",
     shipped: "Open weights released Oct 29 (preview Oct 6) under the Mistral Ecosystem Open-Weight license; self-hosting via vLLM, SGLang, NVIDIA NIM. Terminal-Bench 4.0 moved from 28.3% (preview) to 41% (open weights), +12.7 pts, company-reported.",
     effect: "Self-hostable frontier-class option for data-residency or validation-constrained teams: weights can be frozen, hashed and re-run reproducibly. Check the license (commercial license needed for model-as-a-service).",
     confidence: "Medium", why: "Release is official; scores are company-reported and still trail closed models on Terminal-Bench in this dataset."},
    {lab: "openai", model: "GPT-6.1 Sol",
     shipped: "Recent context (Sep 29): near-Astra positioning for coding and computer use at one-fifth of Astra's standard prices.",
     effect: "Cost lever for high-volume coding agents; keep Astra for the hardest tasks and route the rest.",
     confidence: "Medium", why: "Company-positioned; no Sol-specific benchmark in the dataset."},
    {lab: "deepseek", model: "DeepSeek-V4.1-Flash",
     shipped: "Recent context: 1M-token context, thinking/non-thinking modes, OpenAI- and Anthropic-compatible APIs, peak/off-peak pricing.",
     effect: "Drop-in for tooling that already speaks those APIs. Treat as a new vendor: qualification and data-handling review before any sensitive or regulated data.",
     confidence: "Medium", why: "Official docs; company-summary benchmarks only (no numeric scores in the dataset)."},
    {lab: "alibaba_qwen", model: "Qwen4", src: {kind: "news", match: "Qwen4"},
     shipped: "Previewed in four tiers per coverage (reported); no public release date, API name or pricing.",
     effect: "Nothing to adopt yet. Keep on the watch list.",
     confidence: "Low", why: "Single press report; release date, API and pricing unknown."}
  ],

  // 3. Benchmarks to watch (rendered from the dataset; only numeric % scores are compared).
  capabilityWatch: ["Terminal-Bench 4.0", "DeepSWE v1.1", "CursorBench 4.0", "AutomationBench"],
  capabilityNotes: {
    "AutomationBench": "Gemini 4 Carbon has 53.9% under a separately labelled entry, 'AutomationBench (Anthropic comparison table)'. It is not merged here because the dataset labels it differently."
  },
  capabilityCaveat: "Benchmarks are mostly company-reported, run with different harnesses and effort settings, and measure isolated tasks. They do not measure delivery outcomes such as defect escape rate, review effort or cycle time in your codebase; validate on your own task suite before changing tools.",

  // 4. Delivery lifecycle (qualitative; no numbers).
  lifecycle: [
    {stage: "Planning", note: "Plan around specific model versions, not vendors. Two GA releases this week mean any in-flight evaluation needs a re-baseline. Factor the Nov 30 Gemini price change into pilot budgets."},
    {stage: "Build", note: "Agent-team features (/swarm) and long-horizon agents produce larger change sets. Keep tasks small and well-specified; Anthropic says over 90% of changes merged into its own core codebase are written by Claude with human guidance (company-reported)."},
    {stage: "Review", note: "Review load moves from line edits to whole features. Require agent-authored changes to be labelled and reviewed by a human who did not prompt them; reject unexplained diffs."},
    {stage: "Test", note: "Benchmark gains are not test evidence. Re-run your regression and acceptance suites on every model or effort-setting change; pin seeds/configs where the API allows."},
    {stage: "Release", note: "Record model id, version and agent configuration in release notes. Treat a model swap as a change that needs approval and a rollback path."}
  ],

  // 5. SDLC & governance (guidance; not sourced data).
  governance: [
    {area: "Requirements & design", items: [
      "State which tasks agents may perform, with acceptance criteria written before agent use.",
      "Record data classification for every input an agent can read (code, tickets, logs, documents).",
      "Design for model substitution: keep prompts, tools and evaluation sets in version control."]},
    {area: "Development", items: [
      "Coding standards apply equally to agent-written code; linters and static analysis stay mandatory.",
      "Pin model and agent versions (model id, effort/reasoning setting, tool versions) per repository or pipeline.",
      "Label agent-authored code (commit trailer or PR label) so it can be traced and audited."]},
    {area: "Verification", items: [
      "Coverage thresholds unchanged for agent code; no merging on agent-generated tests alone.",
      "Human review gate on every agent change, by someone other than the prompter.",
      "Reproducibility: store prompts, configuration and model version with test results; prefer pinned or self-hosted weights where re-runs must match."]},
    {area: "Release & change control", items: [
      "Model or agent version changes go through change requests like any dependency upgrade.",
      "Release documentation lists models, versions and agent roles used to produce the release.",
      "Keep an audit trail of agent actions (commands run, files touched, approvals) retained with the release record."]},
    {area: "Compliance", items: [
      "Validation evidence: treat agent tooling as computerised systems; document intended use, risk assessment and test evidence, and re-assess on model version change.",
      "Vendor qualification: assess each model provider (security, data processing terms, change-notification practice, licence terms such as Mistral's open-weight licence).",
      "Data handling: no regulated or personal data to external endpoints without approved agreements; consider self-hosted open weights for restricted data.",
      "Regulated vs non-regulated environments: pilot new models in non-regulated environments first; promote to regulated environments only with validation evidence and pinned versions."]},
    {area: "Operate & monitor", items: [
      "Monitor drift: re-run a fixed evaluation set on a schedule and on every provider model update.",
      "Incident process covers agent-caused defects and unexpected agent actions.",
      "Rollback plan: keep the previous pinned model version available; watch provider deprecations (e.g. OpenAI retired Sora's API and the standalone Atlas browser this year)."]}
  ],

  // 6. Cost & economics: prices rendered from the dataset; unknowns stay unknown.
  costModels: [
    {lab: "anthropic", model: "Claude Fable 5.2"},
    {lab: "anthropic", model: "Claude Mythos 5.2"},
    {lab: "anthropic", model: "Claude Opus 5.5"},
    {lab: "anthropic", model: "Claude Sonnet 5.5"},
    {lab: "openai", model: "GPT-6 Astra"},
    {lab: "openai", model: "GPT-6.1 Sol"},
    {lab: "openai", model: "GPT-6 Luna"},
    {lab: "google_deepmind", model: "Gemini 4 Carbon"},
    {lab: "google_deepmind", model: "Gemini 3.8 Flash"},
    {lab: "xai", model: "Grok 4.7"},
    {lab: "mistral", model: "Mistral Large 4"},
    {lab: "deepseek", model: "DeepSeek-V4.1-Flash"},
    {lab: "meta", model: "Muse Wonder"},
    {lab: "alibaba_qwen", model: "Qwen3.8-Max"}
  ],
  costNotes: [
    "Per-token list prices are not delivery cost: total cost depends on tokens per task, retries, review time and infrastructure, none of which are in the dataset (unknown).",
    "Self-hosting cost for Mistral Large 4 open weights (hardware, operations) is unknown in the dataset."
  ],

  extraUnknowns: [
    "Total delivery cost per task, retries, review time and ROI (not in dataset)",
    "Self-hosting cost for Mistral Large 4 open weights (not in dataset)",
    "Claude Mythos 5.2 access terms beyond the release post",
    "Measured effect of agents on cycle time or defect rates (not in dataset)"
  ],

  // 7. Try / Watch / Ignore
  tryList: [
    "Run Claude Fable 5.2 against Opus 5.5 on your own agent task suite, comparing effort settings (non-regulated sandbox).",
    "Pilot Gemini 4 Carbon /swarm on a contained feature during introductory pricing (to Nov 30), with human review of the combined output.",
    "Stand up Mistral Large 4 open weights in a sandbox to test the self-hosted path for data-residency or validation-constrained work."
  ],
  watchList: [
    "Gemini 4 Argon/Carbon price step-up after Nov 30, 2026.",
    "Qwen4: previewed, release date / API / pricing unknown.",
    "Grok 5: in training, release date unknown.",
    "DeepSeek-V4.1-Pro: announced, not confirmed shipped.",
    "Claude Sonnet 5.5 / Haiku 5.5: launch dates and pricing not confirmed in the dataset.",
    "Mistral specialised models built on Large 4 (company signalled)."
  ],
  ignoreList: [
    "Leaderboard claims without numbers (e.g. 'says #1 on all three'): not usable for tool selection until reproduced.",
    "Funding and valuation headlines (OpenAI's reported $1.25T round, Anthropic's IPO range): no direct delivery effect this week.",
    "Discontinued surfaces (Sora, standalone ChatGPT Atlas): do not build on them."
  ],

  // 8. 3-month outlook: dataset forecast items (ESTIMATE) + delivery implication (also estimate).
  outlook: [
    {lab: "google_deepmind", title: "Argon and Carbon introductory prices end on November 30", implication: "Re-check pilot budgets in December."},
    {lab: "anthropic", title: "Post-IPO cadence stays on 5.x / Fable-Mythos increments", implication: "Expect point releases; keep re-validation lightweight and repeatable."},
    {lab: "openai", title: "Another GPT-6.x efficiency model, not a full GPT-7, is the more likely near-term ship", implication: "Cost per task may fall further; routing rules may need updating."},
    {lab: "google_deepmind", title: "Antigravity /swarm becomes a main enterprise hook", implication: "Governance for multi-agent output becomes a near-term need."},
    {lab: "mistral", title: "Specialized models built on Large 4 start to appear", implication: "More self-hostable options for constrained environments."},
    {lab: "deepseek", title: "V4.1-Pro is the most clearly signaled model drop", implication: "Another low-cost option to qualify, if it ships."},
    {lab: "xai", title: "Grok 5 may still miss this 3-month window", implication: "No planning dependency on Grok 5."}
  ]
};
