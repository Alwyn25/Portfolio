/* Default homepage content. Live content comes from /api/content (Supabase) and falls back to this.
   Text fields support **bold** only; no raw HTML is ever rendered from content. */
window.DEFAULT_SITE = {
  site: {
    name: "Alwyn Sebastian",
    role: "AI Engineer",
    location: "Bangalore, IN",
    photos: {
      avatar:    { src: "/assets/img/avatar.webp",   alt: "Alwyn Sebastian" },
      portrait:  { src: "/assets/img/portrait.webp", alt: "Portrait of Alwyn Sebastian by a window", caption: "at work · bangalore" },
      secondary: { src: "/assets/img/field.webp",    alt: "Alwyn Sebastian sitting on a bamboo bench beside green paddy fields", caption: "off the clock · kerala" },
      contact:   { src: "/assets/img/contact.webp",  alt: "Alwyn Sebastian smiling, seated on a sofa" }
    },
    typedRoles: ["multi-agent voice AI", "forensic document intelligence", "agentic LLM systems", "production RAG", "audit-ready ML"],
    lede: "I build production AI for regulated environments: voice agents, multi-agent LLM systems, and forensic document intelligence, where models produce signals and deterministic engines own the decisions.",
    ctaPrimary: { label: "See the systems ↓", href: "#systems" },
    ctaSecondary: { label: "Get in touch", href: "mailto:alwyn.ds.engineer@gmail.com" },
    legend: ["signals → layers → fusion → decision", "move your cursor to perturb the stream"],
    stats: [
      { value: 2, decimals: 0, suffix: "+", label: "years in production AI" },
      { value: 0.97, decimals: 2, suffix: "", label: "AUC, tamper localization" },
      { value: 8, decimals: 0, suffix: "", label: "forensic models in retraining loop" },
      { value: 7, decimals: 0, suffix: "", label: "agents in voice platform" },
      { value: 12, decimals: 0, suffix: "+", label: "enterprise GenAI use cases" }
    ],
    about: {
      quote: [
        { text: "Models produce ", accent: "signals", tone: "cyan", end: "." },
        { text: "Rules own ", accent: "decisions", tone: "amber", end: "." },
        { text: "Everything leaves an ", accent: "audit trail", tone: "amber", end: "." }
      ],
      paragraphs: [
        "I'm an AI/ML engineer with 2+ years shipping GenAI, LLM, and document-intelligence systems for financial and enterprise clients. At Advora.ai I lead architecture across forensic KYC validation, a multi-tenant voice AI platform, and analytics for lending and real estate.",
        "My background in physics shows up in how I build: explicit contracts between pipeline stages, reproducible models, and systems a regulator can interrogate."
      ],
      principles: [
        "Deterministic over black-box where decisions carry risk",
        "Strict separation of inference, policy, evidence, and audit",
        "Cheapest capable layer first: rules → small model → frontier",
        "Explainability and reproducibility as architecture, not afterthought"
      ]
    },
    writing: [
      { tag: "Medium ↗", title: "Technical writing on production AI", text: "Engineering deep dives on AI systems: the bottleneck each technique solves and where it actually helps in production.", href: "https://alwyns2508.medium.com" },
      { tag: "Series · in progress ↗", title: "RAG in Production, stage by stage", text: "A biweekly series from basic retrieval to production-grade systems, with a companion repo for every post.", href: "https://github.com/Alwyn25/Production-RAG-Architecture--Stage-by-Stage-Contracts-Failures-Fixes" }
    ],
    contact: {
      heading: "Let's build it.",
      text: "Open to AI engineering roles and collaborations on voice AI, agentic systems, and audit-ready ML.",
      email: "alwyn.ds.engineer@gmail.com",
      links: [
        { label: "LinkedIn ↗", href: "https://www.linkedin.com/in/alwynsebastian/" },
        { label: "GitHub ↗", href: "https://github.com/Alwyn25" },
        { label: "Medium ↗", href: "https://alwyns2508.medium.com" }
      ]
    },
    footer: { left: "© 2026 Alwyn Sebastian", right: "signals → decisions" }
  },

  systems: [
    {
      slug: "document-integrity", tag: "Document forensics · KYC", title: "AI Document Integrity Framework",
      text: "An OCR-free forensic platform that detects tampered KYC documents from pixels, metadata, and rendering artifacts, then hands a deterministic risk engine an evidence package a regulator can review.",
      chips: ["ViT", "U-Net", "Autoencoders", "ELA", "Noiseprint", "FastAPI", "Azure Service Bus", "SHAP/LIME"],
      metrics: [["0.97", "AUC localization"], ["0.91", "AUC resampling"], ["5", "forensic layers"]],
      cta: "Explore the forensic walkthrough",
      stages: [
        { i: "L1", title: "Metadata forensics", sub: "creation history · software fingerprints" },
        { i: "L2", title: "Global image forensics", sub: "ELA · Noiseprint · compression" },
        { i: "L3", title: "Patch forensics", sub: "Patch CNNs · autoencoders · U-Net heatmaps" },
        { i: "L4", title: "Cross-patch consistency", sub: "DCT/DWT · embedding similarity" },
        { i: "L5", title: "Fusion & risk engine", sub: "rules · thresholds · audit trail", decide: true }
      ]
    },
    {
      slug: "voice-ai-platform", tag: "Voice AI · Real-estate presales", title: "Multi-Agent Voice AI Platform",
      text: "A config-driven, multi-tenant voice platform where seven agents run lead qualification through post-booking collections. New verticals ship as declarative Industry Packs, not code.",
      chips: ["Streaming STT/TTS", "Sarvam", "Gnani", "pgvector", "RRF hybrid search", "YAML rule engine", "Outbox pattern"],
      metrics: [["7", "agents"], ["3-tier", "turn router"], ["Hinglish", "code-switching"]],
      cta: "Follow a live call turn",
      stages: [
        { i: "01", title: "Streaming speech in", sub: "turn detection · barge-in" },
        { i: "02", title: "Turn router", sub: "state machine → small model → frontier" },
        { i: "03", title: "Planner / executor", sub: "tool registry · pre/postconditions" },
        { i: "04", title: "Hybrid retrieval", sub: "pgvector HNSW + tsvector · RRF" },
        { i: "05", title: "CRM write-back", sub: "transactional outbox · decision traces", decide: true }
      ]
    },
    {
      slug: "ai-insights-kyc", tag: "Analytics · Lending & real estate", title: "AI Insights & KYC STP Engines",
      text: "A funnel intelligence platform built on an append-only event spine, with Bayesian anomaly detection and an LLM limited to narration behind a numeric validator. Plus a KYC straight-through-processing framework for NBFC lending.",
      chips: ["Beta-binomial", "Identity resolution", "Metric contracts", "V-CIP", "CKYC", "Account Aggregator"],
      metrics: [["24", "KYC failure modes"], ["3-tier", "resolution model"]],
      cta: "See the insight pipeline",
      stages: [
        { i: "01", title: "Unified capture", sub: "portals · ads · IVR · CRM" },
        { i: "02", title: "Identity resolution", sub: "phone-hash dedupe" },
        { i: "03", title: "Stage-transition events", sub: "append-only · versioned metrics" },
        { i: "04", title: "Anomaly engine", sub: "beta-binomial posteriors" },
        { i: "05", title: "Validated narrative", sub: "LLM prose · numeric validator", decide: true }
      ]
    }
  ],

  experience: [
    {
      role: "Senior AI/ML Engineer", company: "Advora.ai", when: "Jan 2025 — Present · Remote",
      bullets: [
        "Architected an **enterprise-grade AI Document Integrity Framework** for financial KYC using non-textual forensic ML, delivering regulator-defensible fraud detection with full audit traceability.",
        "Designed a **5-layer forensics system** (metadata, autoencoder anomaly detection, patch CNNs, U-Net localization, late fusion), reaching **AUC 0.97** on localization.",
        "Architected a **config-driven, multi-tenant Voice AI platform** with a 7-agent planner/executor layer, declarative tool registry, and YAML rule engine.",
        "Delivered an **end-to-end GenAI platform** on A2A and MCP with LangGraph multi-agent orchestration for **12+ enterprise use cases**."
      ],
      more: [
        "Built async API-first orchestration: FastAPI → Azure Service Bus → forensic workers → Blob Storage and PostgreSQL, governed by a versioned Preprocess Bundle Contract.",
        "Engineered a continuous retraining loop for 8 forensic models with HITL flags, AUC-gated validation, and registry promotion.",
        "Deployed ML inference on AWS ECS Fargate with CI/CD (GitHub Actions), ECR lifecycle, and Secrets Manager; ran cross-cloud MLOps on AWS and Azure.",
        "Built hybrid retrieval (pgvector HNSW + tsvector, RRF) and streaming STT/TTS with Hinglish code-switching; enforced DPDP Act and TRAI TCCCPR compliance in the architecture.",
        "Architected an AI Insights & Tracking platform and a KYC STP framework (24 failure modes, 3-tier resolution) for lending.",
        "Deployed 6+ production conversational AI systems on GraphRAG/LightRAG; led and mentored a 5-member AI engineering team."
      ]
    },
    {
      role: "Data Scientist Consultant", company: "Teqin Valley", when: "Freelance",
      bullets: [
        "Built a **multimodal sentiment analysis system** for a CXM platform across speech-to-text, OCR, and NLP pipelines.",
        "Shipped an **AI content enhancement suite** on BERT, T5, and GPT for summarization, translation, and grammar correction.",
        "Designed a content discovery module with web search APIs and automated image captioning."
      ], more: []
    },
    {
      role: "Associate Engineer", company: "Lanware Solutions", when: "Jan 2023 — Oct 2023 · Ernakulam",
      bullets: [
        "Improved sales forecast accuracy by **30%**, contributing to a **15% sales increase**.",
        "Vending demand forecasting at **92% accuracy** (XGBoost, Prophet); replenishment model cut stockouts **20%** and spoilage **12%**.",
        "PDF-to-Excel automation at **95%+ accuracy**, saving **25+ hours/week**."
      ], more: []
    },
    { role: "Python SDE Intern", company: "Inmakes Infotech", when: "Jun 2022 — Dec 2022", bullets: ["Django web applications with MS SQL backends and HTML/CSS/JS frontends."], more: [] },
    { role: "Visiting Faculty", company: "Amarjyothi Academy", when: "Jan 2019 — Dec 2021", bullets: ["Taught **200+ students** for IIT-JAM and CSIR-NET; **75%** achieved top-tier ranks."], more: [] }
  ],

  /* Generic sections you can add from /admin without code changes.
     Shape: { id, title, subtitle, layout: "cards" | "list", items: [{ tag, title, text, href }] } */
  customSections: [],

  skills: [
    { id: "llm", label: "LLM & agents", items: ["LangGraph","LangChain","Agentic Systems","A2A Protocol","Model Context Protocol","GraphRAG","LightRAG","Hybrid Search (RRF)","Prompt Engineering","Guardrails","Ragas","DeepEval","OpenAI API","Groq","Hugging Face"] },
    { id: "voice", label: "voice AI", items: ["Streaming STT/TTS","Turn Detection","Barge-in","Speaker Diarization","Hinglish Code-Switching","Sarvam","Gnani","Deepgram","ElevenLabs"] },
    { id: "ml", label: "ML & forensics", items: ["PyTorch","Scikit-learn","ViT","U-Net","Autoencoders","Computer Vision","OCR","ELA","Noiseprint","Anomaly Detection","SHAP / LIME","Time Series (Prophet, ARIMA)","XGBoost"] },
    { id: "backend", label: "backend & data", items: ["FastAPI","Async Processing","Event-Driven Architecture","Transactional Outbox","State Machines","Rule Engines","WebSockets","PostgreSQL","pgvector","Pinecone","Weaviate","Neo4j","MongoDB"] },
    { id: "cloud", label: "cloud & MLOps", items: ["Azure Service Bus","Azure Blob Storage","Azure Container Apps","Key Vault","AWS ECS Fargate","ECR","Docker","Kubernetes","GitHub Actions","Cross-cloud MLOps"] }
  ]
};
