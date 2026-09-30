# Lovable → GitHub → Vercel: Portfolio Build Kit

Use this if you want the portfolio as an editable React project in Lovable instead of (or alongside) the live static version at https://alwyn-sebastian.vercel.app.

---

## 1. Master prompt (paste into Lovable as the first message)

```
Build a single-page, dark, highly animated developer portfolio for Alwyn Sebastian, AI Engineer (Bangalore, IN). Stack: React + Vite + TypeScript + Tailwind + Framer Motion. No backend, no auth, no database.

## Design direction
- Concept: "signals → layers → fusion → decision". His engineering philosophy is that ML models produce signals and deterministic rule engines own decisions. The visual language should feel like an instrumented signal pipeline, not a generic dev template.
- Palette (define as Tailwind theme tokens): ink #0a0c0f (bg), ink-2 #11151a (cards), line #232a33 (borders), text #e8ecf1, muted #8b95a3, dim #5c6673, amber #ffb547 (primary accent), cyan #5ce1e6 (secondary accent). Amber = decisions/CTAs, cyan = signals/labels.
- Fonts (Google Fonts): "Bricolage Grotesque" 800 for display headings, "Inter Tight" for body, "IBM Plex Mono" for labels, tags, dates, and numbers.
- Subtle 64px grid backdrop faded with a radial mask from the top. No stock photos, no emoji, no gradients-on-everything, no glassmorphism overload.
- Must honor prefers-reduced-motion (disable canvas animation loop, typing, and tilt). Mobile-first; no horizontal scroll at 360px.

## Global interactions
- 2px scroll-progress bar at top (cyan→amber gradient).
- Fixed nav: logo "● alwyn.sebastian" (pulsing amber dot, mono font) + links About, Systems, Experience, Projects, Stack, Contact. Transparent at top, blurred ink background with bottom border after 20px scroll. Hamburger menu under 640px.
- Soft cyan radial cursor glow following the pointer (desktop only).
- Section reveal: fade + 32px rise on enter viewport (once).
- Magnetic effect on primary buttons (desktop only).

## Sections

### Hero (full viewport)
- Background: full-bleed <canvas> particle animation. ~200 cyan particles (18% amber) stream left→right with short motion trails through 5 faint vertical "layer" lines, brighten as they cross each line, then converge into a pulsing amber "decision node" at 90% width / 50% height and respawn on the left. Pointer repels particles within ~120px. DPR-aware, resizes correctly.
- Content (left aligned, max 820px): mono eyebrow "AI ENGINEER · BANGALORE, IN" with a cyan leading rule; H1 on two lines: "Alwyn" solid, "Sebastian" outlined (text-stroke) with a staggered slide-up reveal; mono line "> building " + typewriter cycling amber phrases: "multi-agent voice AI", "forensic document intelligence", "agentic LLM systems", "production RAG", "audit-ready ML" with a blinking block caret.
- Lede: "I build production AI for regulated environments: voice agents, multi-agent LLM systems, and forensic document intelligence, where models produce signals and deterministic engines own the decisions."
- CTAs: amber pill "See the systems ↓" (scrolls to Systems), ghost pill "Get in touch" (mailto:alwyn.ds.engineer@gmail.com).
- Bottom-right mono legend: "signals → layers → fusion → decision / move your cursor to perturb the stream". Bottom-center animated "SCROLL" drip line.

### Stats strip (5 columns, bordered cells; 2 columns on mobile)
Count-up on view: "2+" years in production AI · "0.97" AUC, tamper localization · "8" forensic models in retraining loop · "7" agents in voice platform · "12+" enterprise GenAI use cases.

### 01 About (two columns)
- Left, large display quote: "Models produce **signals**. Rules own **decisions**. Everything leaves an **audit trail**." (signals in cyan, decisions and audit trail in amber)
- Right: "I'm an AI/ML engineer with 2+ years shipping GenAI, LLM, and document-intelligence systems for financial and enterprise clients. At Advora.ai I lead architecture across forensic KYC validation, a multi-tenant voice AI platform, and analytics for lending and real estate." / "My background in physics shows up in how I build: explicit contracts between pipeline stages, reproducible models, and systems a regulator can interrogate."
- Numbered principle list (hairline dividers): 01 Deterministic over black-box where decisions carry risk · 02 Strict separation of inference, policy, evidence, and audit · 03 Cheapest capable layer first: rules → small model → frontier · 04 Explainability and reproducibility as architecture, not afterthought.

### 02 Flagship systems (3 large cards, each two columns)
Left: cyan mono tag, title, description, tech chips, big metrics. Right: a vertical 5-stage pipeline whose stages light up one at a time in a loop while the card is in view (amber highlight; the final "decision" stage glows cyan). Pointer-following amber spotlight on card hover.

1. Tag "DOCUMENT FORENSICS · KYC" — "AI Document Integrity Framework". "An OCR-free forensic platform that detects tampered KYC documents from pixels, metadata, and rendering artifacts, then hands a deterministic risk engine an evidence package a regulator can review." Chips: ViT, U-Net, Autoencoders, ELA, Noiseprint, FastAPI, Azure Service Bus, SHAP/LIME. Metrics: 0.97 AUC localization · 0.91 AUC resampling · 5 forensic layers. Stages: L1 Metadata forensics (creation history · software fingerprints) → L2 Global image forensics (ELA · Noiseprint · compression) → L3 Patch forensics (Patch CNNs · autoencoders · U-Net heatmaps) → L4 Cross-patch consistency (DCT/DWT · embedding similarity) → L5 Fusion & risk engine (rules · thresholds · audit trail).

2. Tag "VOICE AI · REAL-ESTATE PRESALES" — "Multi-Agent Voice AI Platform". "A config-driven, multi-tenant voice platform where seven agents run lead qualification through post-booking collections. New verticals ship as declarative Industry Packs, not code." Chips: Streaming STT/TTS, Sarvam, Gnani, pgvector, RRF hybrid search, YAML rule engine, Outbox pattern. Metrics: 7 agents · 3-tier turn router · Hinglish code-switching. Stages: Streaming speech in (turn detection · barge-in) → Turn router (state machine → small model → frontier) → Planner / executor (tool registry · pre/postconditions) → Hybrid retrieval (pgvector HNSW + tsvector · RRF) → CRM write-back (transactional outbox · decision traces).

3. Tag "ANALYTICS · LENDING & REAL ESTATE" — "AI Insights & KYC STP Engines". "A funnel intelligence platform built on an append-only event spine, with Bayesian anomaly detection and an LLM limited to narration behind a numeric validator. Plus a KYC straight-through-processing framework for NBFC lending." Chips: Beta-binomial, Identity resolution, Metric contracts, V-CIP, CKYC, Account Aggregator. Metrics: 24 KYC failure modes · 3-tier resolution model. Stages: Unified capture (portals · ads · IVR · CRM) → Identity resolution (phone-hash dedupe) → Stage-transition events (append-only · versioned metrics) → Anomaly engine (beta-binomial posteriors) → Validated narrative (LLM prose · numeric validator).

### 03 Experience (vertical timeline)
Timeline rail fills with a cyan→amber gradient as you scroll; each node lights amber when its entry enters view. Arrow-prefixed bullets, key phrases bolded.

- Senior AI/ML Engineer @ Advora.ai — Jan 2025 – Present · Remote. Show 4 bullets, with "+ show more" expanding the rest:
  - Architected an enterprise-grade AI Document Integrity Framework for financial KYC using non-textual forensic ML, delivering regulator-defensible fraud detection with full audit traceability.
  - Designed a 5-layer forensics system (metadata, autoencoder anomaly detection, patch CNNs, U-Net localization, late fusion), reaching AUC 0.97 on localization.
  - Architected a config-driven, multi-tenant Voice AI platform with a 7-agent planner/executor layer, declarative tool registry, and YAML rule engine.
  - Delivered an end-to-end GenAI platform on A2A and MCP with LangGraph multi-agent orchestration for 12+ enterprise use cases.
  - (more) Built async API-first orchestration: FastAPI → Azure Service Bus → forensic workers → Blob Storage and PostgreSQL, governed by a versioned Preprocess Bundle Contract.
  - (more) Engineered a continuous retraining loop for 8 forensic models with HITL flags, AUC-gated validation, and registry promotion.
  - (more) Deployed ML inference on AWS ECS Fargate with CI/CD (GitHub Actions), ECR lifecycle, and Secrets Manager; ran cross-cloud MLOps on AWS and Azure.
  - (more) Built hybrid retrieval (pgvector HNSW + tsvector, RRF) and streaming STT/TTS with Hinglish code-switching; enforced DPDP Act and TRAI TCCCPR compliance in the architecture.
  - (more) Architected an AI Insights & Tracking platform and a KYC STP framework (24 failure modes, 3-tier resolution) for lending.
  - (more) Deployed 6+ production conversational AI systems on GraphRAG/LightRAG; led and mentored a 5-member AI engineering team.
- Data Scientist Consultant @ Teqin Valley — Feb 2025 – Oct 2025 · Freelance: multimodal sentiment analysis (speech-to-text, OCR, NLP) for a CXM platform; AI content enhancement suite on BERT, T5, GPT; content discovery with web search APIs and image captioning.
- Associate Engineer @ Lanware Solutions — Jan 2023 – Oct 2023 · Ernakulam: sales forecasting +30% accuracy (15% sales increase); vending demand forecasting at 92% accuracy (XGBoost, Prophet), stockouts −20%, spoilage −12%; PDF-to-Excel automation at 95%+ accuracy saving 25+ hrs/week.
- Python SDE Intern @ Inmakes Infotech — Jun 2022 – Dec 2022: Django apps with MS SQL backends.
- Visiting Faculty @ Amarjyothi Academy — Jan 2019 – Dec 2021: taught 200+ students for IIT-JAM and CSIR-NET; 75% achieved top-tier ranks.

### 04 Projects (3-column grid, 1 column on mobile; 3D tilt on hover, desktop only)
- (spans 2 columns) Production RAG Architecture — "open source · series / in progress". "A reference implementation and 20–25 part technical series taking RAG from baseline to production. Every stage ships with explicit contracts, documented failure modes, and evaluation gates." Chips: Python, FastAPI, Azure, pgvector. Link: https://github.com/Alwyn25/Production-RAG-Architecture--Stage-by-Stage-Contracts-Failures-Fixes
- AI Engineering Skill Suite — "Reusable Claude skills that encode engineering standards: an enterprise AI platform architect and a research-to-publication pipeline." Chips: MLOps patterns, Governance.
- Conversational PDF Intelligence — LangChain RAG with semantic chunking and context-preserving memory. Link: https://github.com/Alwyn25/Chat-with-PDFs
- Real-Time Number Plate Detection — YOLOv9 + OpenCV + OCR with SQLite logging. Link: https://github.com/Alwyn25/number-plate-detection-real-time
- Demand Forecasting & Replenishment — 92% accuracy forecasts; dynamic safety stock cut stockouts 20%. Chips: XGBoost, Prophet.

### 05 Stack (filterable skill cloud)
Filter pills: all · LLM & agents · voice AI · ML & forensics · backend & data · cloud & MLOps. Non-matching chips fade to 12% opacity with a slight scale-down.
- LLM & agents: LangGraph, LangChain, Agentic Systems, A2A Protocol, Model Context Protocol, GraphRAG, LightRAG, Hybrid Search (RRF), Prompt Engineering, Guardrails, Ragas, DeepEval, OpenAI API, Groq, Hugging Face
- Voice AI: Streaming STT/TTS, Turn Detection, Barge-in, Speaker Diarization, Hinglish Code-Switching, Sarvam, Gnani, Deepgram, ElevenLabs
- ML & forensics: PyTorch, Scikit-learn, ViT, U-Net, Autoencoders, Computer Vision, OCR, ELA, Noiseprint, Anomaly Detection, SHAP / LIME, Time Series (Prophet, ARIMA), XGBoost
- Backend & data: FastAPI, Async Processing, Event-Driven Architecture, Transactional Outbox, State Machines, Rule Engines, WebSockets, PostgreSQL, pgvector, Pinecone, Weaviate, Neo4j, MongoDB
- Cloud & MLOps: Azure Service Bus, Azure Blob Storage, Azure Container Apps, Key Vault, AWS ECS Fargate, ECR, Docker, Kubernetes, GitHub Actions, Cross-cloud MLOps

### 06 Writing (2 cards)
- Medium ↗ (https://alwyns2508.medium.com): "Technical writing on production AI" — engineering deep dives on the bottleneck each technique solves and where it helps in production.
- Series · in progress ↗ (RAG repo link above): "RAG in Production, stage by stage" — a biweekly series from basic retrieval to production-grade systems with a companion repo per post.

### 07 Contact (centered)
Huge display heading "Let's build it." that wipes from white to amber on hover (mailto link). Sub-line: "Open to AI engineering roles and collaborations on voice AI, agentic systems, and audit-ready ML." Buttons: amber pill with email alwyn.ds.engineer@gmail.com; ghost pills LinkedIn ↗ (https://www.linkedin.com/in/alwynsebastian/), GitHub ↗ (https://github.com/Alwyn25), Medium ↗.
Do NOT show a phone number anywhere.

### Footer
Mono, dim: "© 2026 Alwyn Sebastian" left, "signals → decisions" right.

## Engineering requirements
- Put all content in a single typed `src/data/portfolio.ts` (profile, stats, systems, experience, projects, skills, links) so text edits never touch components.
- One component per section in `src/components/sections/`. Canvas logic in its own hook (`usePipelineCanvas`) that cancels its animation frame on unmount.
- SEO: title "Alwyn Sebastian — AI Engineer", meta description, Open Graph tags, SVG favicon (dark rounded square, white "A" chevron, amber dot).
- Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95. Semantic landmarks, visible focus rings, aria-label on the menu button, external links with rel="noopener".
```

---

## 2. Follow-up prompts (use one at a time after the first build)

1. **Polish pass:** "Audit every section at 360px, 768px and 1440px. Fix overflow, cramped spacing, and any animation that stutters. Make sure reduced-motion users see all content without animation."
2. **Resume download (optional):** "Add a 'Download résumé' ghost button in the hero and nav that links to /Alwyn_Sebastian_Resume.pdf." Then upload a résumé PDF without your phone number to `public/`.
3. **Custom domain meta:** "Add canonical URL and og:url for https://<your-domain>."

---

## 3. Deploy the Lovable project to Vercel

1. In Lovable: **GitHub → Connect to GitHub → Create repository** (e.g. `alwyn-portfolio`). Lovable then pushes every edit to that repo automatically.
2. In Vercel: **Add New → Project → Import** that repo. Vercel detects Vite; keep the defaults (build `npm run build`, output `dist`) and click **Deploy**.
3. Every later Lovable change → GitHub commit → automatic Vercel redeploy.
4. Optional: **Project → Settings → Domains** to attach a custom domain.

Note: the static version is already live at https://alwyn-sebastian.vercel.app (project `alwyn-sebastian`). If you deploy the Lovable build into a new Vercel project it gets a different URL. To make the Lovable build take over that same URL, connect the Git repo to the existing `alwyn-sebastian` project instead (**Settings → Git**).
