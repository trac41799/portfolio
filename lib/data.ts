export const profile = {
  name: "Nguyen Dang Trac",
  role: "AI Automation Engineer",
  tagline:
    "I build AI-native products end to end — multi-agent systems, RAG pipelines, and multi-tenant platforms that ship to production.",
  location: "Vietnam",
  availability: "Open to senior AI / full-stack engineering roles",
  email: "tracng417@gmail.com",
  phone: "0384-170-128",
  links: {
    github: "https://github.com/trac41799",
    githubLabel: "github.com/trac41799",
    linkedin: "https://www.linkedin.com/in/trac-nguyen-14a58b313",
    linkedinLabel: "linkedin.com/in/trac-nguyen",
    cv: "/NgDangTrac_CV_2026.pdf",
  },
} as const;

export const metrics = [
  { value: "3+", label: "Years shipping production software" },
  { value: "~40", label: "Production repositories, 18 months" },
  { value: "3", label: "IEEE publications (1 first-author)" },
  { value: "1", label: "Best Paper Award — ICGHIT 2024" },
] as const;

export const intro = {
  summary:
    "M.S. in Electrical Engineering with three years spanning AI research, automotive embedded software at Bosch, and production-grade AI-native product engineering at Edge8 AI. I build from-scratch multi-agent systems, retrieval pipelines, streaming AI UX, and clinical risk engines — the whole delivery lifecycle, from architecture to test coverage.",
  focus: [
    {
      title: "AI & Agentic Systems",
      body: "From-scratch multi-agent orchestration (router → planner → executor), custom multi-model LLM clients, streaming reasoning, and MCP tool layers — no framework crutches when they get in the way.",
    },
    {
      title: "Retrieval & Search",
      body: "End-to-end RAG: multi-strategy chunking, pgvector + FAISS + BM25 hybrid retrieval, and benchmark-driven routing decisions measured on production corpora.",
    },
    {
      title: "Full-Stack Product",
      body: "Next.js App Router frontends and FastAPI backends on Supabase and Vercel, with multi-tenant isolation, real-time streaming UX, i18n, billing, and E2E test suites.",
    },
  ],
} as const;

export type Project = {
  slug: string;
  title: string;
  category: string;
  period: string;
  role: string;
  summary: string;
  highlights: string[];
  stack: string[];
  signal?: string;
};

export const projects: Project[] = [
  {
    slug: "ai-lms",
    title: "AI Learning-Management Platform",
    category: "Multi-Agent SaaS",
    period: "Late 2025 — Present",
    role: "Lead backend / platform engineer",
    summary:
      "A multi-tenant SaaS platform automating structured learning programs and their member community — course management, progress tracking, AI-assisted grading, and conversational student support.",
    highlights: [
      "Built a from-scratch multi-agent AI engine (router → planner → executor) on a hand-rolled multi-model LLM client — streaming, multimodal input, prompt caching, model fallback, and cost-optimized routing via OpenRouter (Anthropic, Gemini, OpenAI).",
      "Shipped AI grading with a human-in-the-loop review gate: rubric-based scoring (0–100), score-gated final assignments, and professor review states auto-posted back to the community layer.",
      "Engineered a custom RAG pipeline (multi-strategy chunking over pgvector, hybrid search) and data synchronization keeping three integrated systems consistent via 20+ sync tools.",
      "Delivered a hardened white-label variant with JWKS auth and organization-level data isolation as an independently deployable mirror.",
    ],
    stack: ["FastAPI", "OpenRouter", "pgvector", "Supabase", "Redis", "SSE", "Stripe", "Vercel"],
    signal: "1,300+ authored commits on the core backend",
  },
  {
    slug: "travel-assistant",
    title: "Multi-Tenant Travelling Assistant",
    category: "Full-Stack + Agentic",
    period: "Late 2024 — Present",
    role: "Full-stack engineer (front-end lead)",
    summary:
      "A two-sided consumer + business platform where organizations publish rich experiences and users discover them, chat with an AI companion, and generate personal stories — with a full CMS and analytics dashboard.",
    highlights: [
      "Built the Next.js App Router front-end with organization-scoped routing, role-based auth, and streaming AI UX — live reasoning trails, TTS playback, and voice-to-text capture.",
      "Delivered a LlamaIndex agentic backend with a hybrid routing layer: rule-based multilingual fast-path plus an LLM router deciding web search vs. knowledge lookup vs. weather.",
      "Built hybrid retrieval — FAISS + BM25, ~1K-token chunks, Gemini + VoyageAI embeddings — inside a RAG enrichment workspace with live research-progress streaming.",
      "Shipped 7-locale i18n (EN, FR, JA, KO, RU, VI, ZH) on a Redux Toolkit / RTK Query data layer with a broad Playwright + Vitest suite focused on tenant isolation.",
    ],
    stack: ["Next.js", "FastAPI", "LlamaIndex", "FAISS", "Supabase", "Redux Toolkit"],
    signal:
      "1,500+ commits · single-pass hybrid retrieval hits 0.97 facet recall, 3.8–4.0× faster than agentic alternatives",
  },
  {
    slug: "longevity-analytics",
    title: "Occupational Health & Longevity Analytics",
    category: "Regulated Health-Tech",
    period: "Q2 2026 — Present",
    role: "Senior full-stack / AI engineer",
    summary:
      "A family of regulated health-tech products: a personalized longevity coaching app with multi-domain risk scoring, and a workplace musculoskeletal-risk intelligence platform.",
    highlights: [
      "Built a multi-domain clinical risk engine (TypeScript) scoring six domains — cardiovascular, metabolic, musculoskeletal, neurodegenerative, oncological, and biological age — with per-domain regression tests and snapshot suites for numerical stability.",
      "Designed the AI assistant layer with DB-stored persona agents (clinician, nutrition, PT, supplement-advisor) exposed via Vercel AI SDK + MCP tool-calling.",
      "Shipped the Atlas MSK chatbot end-to-end: intent classifier (Gemini Flash) + Claude synthesis, cache-first + MSSQL fan-out query layer, and pgvector RAG running in parallel.",
      "Owned security & compliance hardening: PII redaction at the data-view layer, Postgres RLS, an LLM-as-judge evaluation harness with per-persona suites, and medical-device risk documentation.",
    ],
    stack: ["Next.js 16", "TypeScript", "Vercel AI SDK", "MCP", "Supabase", "MSSQL"],
    signal: "200+ authored commits · aggregate-only privacy model (N ≥ 30)",
  },
  {
    slug: "agent-orchestration",
    title: "Claude Code Agent Orchestration Plugin",
    category: "Developer Tooling / MCP",
    period: "Q1 2026 — Present",
    role: "Creator / primary author",
    summary:
      "A distributable plugin and agent-template system for Claude Code / Claude Desktop that standardizes AI-assisted software delivery for a whole team — an 8-role agent org, a skill library, and session lifecycle hooks.",
    highlights: [
      "Designed an 8-role agent template library (PM, Developer, QA, DevOps, Designer, Writer, Publisher, Marketer) backed by rich, standalone skill files.",
      "Authored a universal orchestrator (assess → plan → distribute → collect → validate → report) that spawns waves of parallel sub-agents with handoff-document contracts.",
      "Packaged it as a real plugin with auto-install & sync on session start, version tracking via the GitHub Releases API, and consent-first update notifications.",
      "Built a delivery-telemetry subsystem capturing LLM token usage and human-hour records, plus MCP gateways exposing curated CRUD/agent tools. Adopted by clients across the US, Australia, and Vietnam.",
    ],
    stack: ["Python", "TypeScript", "MCP", "FastMCP", "Claude Code"],
    signal: "130+ authored commits across template + plugins",
  },
];

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  points: string[];
};

export const experience: Experience[] = [
  {
    company: "Edge8 AI",
    role: "AI Automation Engineer",
    period: "Jan 2025 — Present",
    location: "Remote",
    points: [
      "Architected and built multiple multi-tenant SaaS products and internal platforms across AI-native, content, analytics, and regulated health-tech domains — all on Supabase (PostgreSQL) and Vercel.",
      "Designed production multi-agent AI systems with custom multi-model LLM clients, model fallback, cost-optimized routing, and streaming SSE.",
      "Delivered real-time AI UX (streaming reasoning, TTS/STT), 7-locale i18n, Stripe billing, and RAG pipelines with hybrid search (pgvector, FAISS, BM25).",
      "Enforced engineering quality: unit/integration/E2E tests (Vitest, Pytest, Playwright), CI/CD, tenant-isolation suites, and LLM evaluation harnesses.",
    ],
  },
  {
    company: "University of Ulsan, South Korea",
    role: "Research Assistant",
    period: "Sep 2022 — Aug 2024",
    location: "Ulsan, KR",
    points: [
      "Led deep learning research on error correction coding (ECC); published first-author in IEEE Trans. Cogn. Commun. Netw. and won Best Paper Award at ICGHIT 2024.",
      "Designed Transformer, CNN, and RNN architectures in PyTorch, TensorFlow, and Keras for wireless communication systems.",
    ],
  },
  {
    company: "Bosch Global Software Vietnam",
    role: "Embedded Software Engineer",
    period: "Jun 2021 — Aug 2022",
    location: "Ho Chi Minh City, VN",
    points: [
      "Developed and validated automotive embedded software for Engine Control Units (ECU) across the full SDLC; programmed in C, Python, and XML with CAN/FlexRay protocols.",
      "Delivered features under Agile Scrum and V-Model; maintained CI/CD pipelines on a Jenkins-based platform.",
    ],
  },
];

export type Publication = {
  citation: string;
  venue: string;
  year: string;
  note: string;
  href?: string;
};

export const publications: Publication[] = [
  {
    citation: "D.-T. Nguyen & S. Kim, “U-shaped Error Correction Code Transformers”",
    venue: "IEEE Trans. Cogn. Commun. Netw.",
    year: "2024",
    note: "First Author",
    href: "https://github.com/trac41799/UECCT",
  },
  {
    citation:
      "T. A. Khoa et al., “Safety Is Our Friend: A Federated Learning Framework Toward Driver's State and Behavior Detection”",
    venue: "IEEE Trans. Comput. Social Syst.",
    year: "2024",
    note: "Second Author",
  },
  {
    citation:
      "N. D. Trac & K. Sunghwan, “DRF-ECCT: Dynamic Reliability Filter for Error Correction Code Transformer”",
    venue: "Proc. ICGHIT",
    year: "2024",
    note: "Best Paper Award",
    href: "https://github.com/trac41799/DRF-ECCT",
  },
];

export const skills = [
  {
    group: "Languages",
    items: ["Python", "TypeScript", "C", "SQL (PostgreSQL / PLpgSQL)", "XML"],
  },
  {
    group: "AI & ML",
    items: [
      "PyTorch",
      "TensorFlow",
      "Keras",
      "LlamaIndex",
      "Vercel AI SDK",
      "MCP (FastMCP)",
      "pgvector",
      "FAISS",
      "BM25",
      "RAG / Hybrid Search",
      "Multi-Agent Orchestration",
      "LLM Evaluation",
    ],
  },
  {
    group: "Frameworks & Platforms",
    items: [
      "Next.js",
      "React",
      "FastAPI",
      "Redux Toolkit",
      "TanStack Query",
      "Tailwind",
      "Supabase",
      "Redis",
      "Stripe",
      "Sentry",
      "OpenRouter",
      "Google Cloud (STT/TTS)",
    ],
  },
  {
    group: "Testing & DevOps",
    items: [
      "Playwright",
      "Vitest",
      "Pytest",
      "CI/CD (Jenkins, GitHub Actions)",
      "Git",
      "Agile / Scrum",
      "V-Model",
    ],
  },
] as const;

export const education = [
  {
    school: "University of Ulsan, South Korea",
    degree: "M.S. in Electrical Engineering",
    period: "Sep 2022 — Aug 2024",
    detail: "GPA 4.21 / 4.5 · Thesis: Enhanced Syndrome-based Reliability Decoding for ECC Transformer",
  },
  {
    school: "Ton Duc Thang University, Vietnam",
    degree: "B.S. in Electrical, Electronics & Telecommunication Engineering",
    period: "Sep 2017 — May 2022",
    detail: "Thesis: Application of MLP Model in Federated Learning",
  },
] as const;

export const awards = [
  { label: "Best Paper Award", detail: "ICGHIT 2024" },
  { label: "AF-1 Full Scholarship", detail: "University of Ulsan" },
  { label: "IELTS 7.0", detail: "English — Fluent" },
] as const;
