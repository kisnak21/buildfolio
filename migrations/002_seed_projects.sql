-- Seed Users (Demo Developers)
INSERT INTO users (id, name, username, email, password, image, bio, is_verified) VALUES
(
  '11111111-1111-4111-a111-111111111111',
  'John Doe',
  'johndoe',
  'john@buildfolio.dev',
  '$2b$10$EPfCqH245nL6R2FfA.B71.V3uRz/jL1Q7r6LqE1E6gE8yP5r6JvGq',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=johndoe',
  'Full-stack developer passionate about Next.js, distributed systems, and open source.',
  TRUE
),
(
  '22222222-2222-4222-a222-222222222222',
  'Sarah Lin',
  'sarahlin',
  'sarah@buildfolio.dev',
  '$2b$10$EPfCqH245nL6R2FfA.B71.V3uRz/jL1Q7r6LqE1E6gE8yP5r6JvGq',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=sarahlin',
  'AI engineer & Python enthusiast. Building smart developer tools and automated agents.',
  TRUE
),
(
  '33333333-3333-4333-a333-333333333333',
  'Alex Rivera',
  'alexrivera',
  'alex@buildfolio.dev',
  '$2b$10$EPfCqH245nL6R2FfA.B71.V3uRz/jL1Q7r6LqE1E6gE8yP5r6JvGq',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=alexrivera',
  'Mobile and game architect. Flutter, Go, and Rust speed freak.',
  TRUE
),
(
  '44444444-4444-4444-a444-444444444444',
  'Maya Patel',
  'mayapatel',
  'maya@buildfolio.dev',
  '$2b$10$EPfCqH245nL6R2FfA.B71.V3uRz/jL1Q7r6LqE1E6gE8yP5r6JvGq',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=mayapatel',
  'Frontend specialist & UI/UX wizard. Obsessed with Tailwind CSS, design systems, and animations.',
  TRUE
),
(
  '55555555-5555-4555-a555-555555555555',
  'Liam Chen',
  'liamchen',
  'liam@buildfolio.dev',
  '$2b$10$EPfCqH245nL6R2FfA.B71.V3uRz/jL1Q7r6LqE1E6gE8yP5r6JvGq',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=liamchen',
  'Backend guru and database administrator. Scaling PostgreSQL, Laravel, and Go microservices.',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Seed 50 Projects
INSERT INTO projects (id, title, slug, description, thumbnail, github_url, live_url, likes, user_id, category_id) VALUES
-- SaaS (10 projects)
(
  'a1000000-0000-4000-8000-000000000001',
  'DevFlow Dashboard',
  'devflow-dashboard',
  'A real-time developer metrics and project management SaaS designed specifically for agile engineering teams. Integrates directly with GitHub CI/CD pipelines.',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'https://github.com/johndoe/devflow',
  'https://devflow.demo.app',
  142,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000002',
  'CloudCost AI',
  'cloudcost-ai',
  'Automated AWS and GCP infrastructure cost analysis SaaS. Detects idle EC2 instances, oversized RDS clusters, and predicts monthly cloud bills.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://github.com/sarahlin/cloudcost',
  'https://cloudcost.demo.app',
  215,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000003',
  'StatusGuard Pro',
  'statusguard-pro',
  'Zero-config uptime monitoring and status page platform with instant multi-channel incident alerts via Slack, Discord, and PagerDuty.',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
  'https://github.com/liamchen/statusguard',
  'https://statusguard.demo.app',
  98,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000004',
  'FormPulse Analytics',
  'formpulse-analytics',
  'Headless form backend for static websites and Next.js applications with automated spam filtering, webhook triggers, and conversion tracking.',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
  'https://github.com/mayapatel/formpulse',
  'https://formpulse.demo.app',
  76,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000005',
  'DocuSync API',
  'docusync-api',
  'Developer-first PDF generation and document signing API service with custom template editing using Tailwind CSS and React.',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
  'https://github.com/johndoe/docusync',
  'https://docusync.demo.app',
  164,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000006',
  'FeedStack Feedback',
  'feedstack-feedback',
  'Embeddable user feedback widget and roadmap voting board for B2B SaaS companies. Built with React and Go.',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
  'https://github.com/alexrivera/feedstack',
  'https://feedstack.demo.app',
  88,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000007',
  'AuthShield OAuth',
  'authshield-oauth',
  'Lightweight, self-hostable customer identity and access management (CIAM) SaaS solution with passkey and social login support.',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
  'https://github.com/liamchen/authshield',
  'https://authshield.demo.app',
  134,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000008',
  'LocalizationHub',
  'localization-hub',
  'Collaborative i18n translation management SaaS that syncs string keys automatically between Git repositories and translators.',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  'https://github.com/mayapatel/localizationhub',
  'https://localizationhub.demo.app',
  67,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000009',
  'LogStreamer Cloud',
  'logstreamer-cloud',
  'Centralized log management and anomaly detection SaaS for microservices. Indexes millions of log events per minute with sub-second queries.',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  'https://github.com/liamchen/logstreamer',
  'https://logstreamer.demo.app',
  119,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'SaaS')
),
(
  'a1000000-0000-4000-8000-000000000010',
  'CronMaster SaaS',
  'cronmaster-saas',
  'Reliable cloud cron job scheduler with retry mechanisms, execution history logs, and HTTP webhook verification.',
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
  'https://github.com/johndoe/cronmaster',
  'https://cronmaster.demo.app',
  105,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'SaaS')
),

-- AI (10 projects)
(
  'b2000000-0000-4000-8000-000000000001',
  'CodeReview AI',
  'codereview-ai',
  'An AI-powered pull request assistant that automatically flags bugs, suggests refactors, and generates concise PR summaries using LLMs.',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  'https://github.com/sarahlin/codereview-ai',
  'https://codereview-ai.demo.app',
  289,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000002',
  'QueryGenius SQL',
  'querygenius-sql',
  'Natural language to optimized SQL query generator. Connects directly to PostgreSQL schema and explains complex JOINs in plain English.',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
  'https://github.com/sarahlin/querygenius',
  'https://querygenius.demo.app',
  312,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000003',
  'VoiceToCode Studio',
  'voicetocode-studio',
  'Real-time voice dictation for programmers using fine-tuned OpenAI Whisper models. Supports syntax-aware commands for TypeScript and Python.',
  'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&q=80',
  'https://github.com/alexrivera/voicetocode',
  'https://voicetocode.demo.app',
  178,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000004',
  'UIBio Wireframe AI',
  'uibio-wireframe-ai',
  'Transform rough whiteboard sketches and hand-drawn wireframes into production-ready React components and Tailwind CSS layout code.',
  'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80',
  'https://github.com/mayapatel/uibio',
  'https://uibio.demo.app',
  245,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000005',
  'AgentFlow Orchestrator',
  'agentflow-orchestrator',
  'Visual workflow builder for autonomous AI agents. Connect multiple LLMs, web scrapers, and REST APIs to accomplish complex tasks.',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
  'https://github.com/sarahlin/agentflow',
  'https://agentflow.demo.app',
  335,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000006',
  'BugPredictor ML',
  'bugpredictor-ml',
  'Machine learning pipeline trained on historical Git commits to predict which code files have the highest probability of containing defects.',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'https://github.com/johndoe/bugpredictor',
  'https://bugpredictor.demo.app',
  143,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000007',
  'DocChat RAG',
  'docchat-rag',
  'Turn your entire technical documentation folder into an interactive chatbot using Retrieval-Augmented Generation with pgvector and Next.js.',
  'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&q=80',
  'https://github.com/sarahlin/docchat',
  'https://docchat.demo.app',
  201,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000008',
  'RegexWizard AI',
  'regexwizard-ai',
  'Generate, test, and debug complex regular expressions using AI. Includes detailed breakdown charts and automated test case verification.',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'https://github.com/mayapatel/regexwizard',
  'https://regexwizard.demo.app',
  156,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000009',
  'TestPilot AI Generator',
  'testpilot-ai-generator',
  'Automatically generate comprehensive Jest and Playwright unit and end-to-end test suites directly from your React component source code.',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
  'https://github.com/johndoe/testpilot',
  'https://testpilot.demo.app',
  188,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'AI')
),
(
  'b2000000-0000-4000-8000-000000000010',
  'CommitCopilot AI',
  'commitcopilot-ai',
  'CLI tool that analyzes staged git changes and writes standardized, descriptive conventional commit messages in seconds.',
  'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=800&q=80',
  'https://github.com/alexrivera/commitcopilot',
  'https://commitcopilot.demo.app',
  223,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'AI')
),

-- Web App (10 projects)
(
  'c3000000-0000-4000-8000-000000000001',
  'SQL Buddy Explorer',
  'sql-buddy-explorer',
  'Interactive web-based database explorer and visual query builder for PostgreSQL and Neon databases with real-time chart generation.',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80',
  'https://github.com/johndoe/sql-buddy',
  'https://sql-buddy.demo.app',
  164,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000002',
  'PaletteCraft Studio',
  'palettecraft-studio',
  'Advanced color palette generator and contrast accessibility checker for UI designers and frontend developers using Tailwind CSS palettes.',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80',
  'https://github.com/mayapatel/palettecraft',
  'https://palettecraft.demo.app',
  194,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000003',
  'APIStudio Sandbox',
  'apistudio-sandbox',
  'In-browser REST and GraphQL API testing client with collaborative collections, mock server generation, and automated sequence testing.',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  'https://github.com/liamchen/apistudio',
  'https://apistudio.demo.app',
  152,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000004',
  'ExcaliDiagram Plus',
  'excalidiagram-plus',
  'Collaborative virtual whiteboard for software architecture diagrams, entity-relationship models, and cloud infrastructure mapping.',
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80',
  'https://github.com/mayapatel/excalidiagram',
  'https://excalidiagram.demo.app',
  231,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000005',
  'JsonNavigator Pro',
  'jsonnavigator-pro',
  'Blazingly fast JSON viewer, editor, and schema validator that handles multi-gigabyte payloads without freezing the browser.',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
  'https://github.com/johndoe/jsonnavigator',
  'https://jsonnavigator.demo.app',
  115,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000006',
  'DevBookmark Hub',
  'devbookmark-hub',
  'Curated bookmark manager for developer articles, code snippets, and cheat sheets with instant offline search and tags.',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  'https://github.com/mayapatel/devbookmark',
  'https://devbookmark.demo.app',
  87,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000007',
  'MarkdownMaster Live',
  'markdownmaster-live',
  'Distraction-free Markdown editor with live preview, mathematical LaTeX equations, Mermaid syntax diagrams, and direct GitHub export.',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  'https://github.com/johndoe/markdownmaster',
  'https://markdownmaster.demo.app',
  176,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000008',
  'RegexTester Web',
  'regextester-web',
  'Clean, instant regular expression tester supporting JavaScript, PCRE, and Python syntax with real-time matching highlights.',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80',
  'https://github.com/sarahlin/regextester',
  'https://regextester.demo.app',
  143,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000009',
  'CssGridBuilder',
  'cssgridbuilder',
  'Visual CSS Grid and Flexbox layout generator. Adjust columns, gaps, and breakpoints interactively and copy clean CSS code.',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80',
  'https://github.com/mayapatel/cssgridbuilder',
  'https://cssgridbuilder.demo.app',
  210,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Web App')
),
(
  'c3000000-0000-4000-8000-000000000010',
  'TimezoneSync Dev',
  'timezonesync-dev',
  'World clock and meeting planner specifically tailored for remote, globally distributed engineering teams and open source maintainers.',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
  'https://github.com/alexrivera/timezonesync',
  'https://timezonesync.demo.app',
  92,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Web App')
),

-- Mobile App (6 projects)
(
  'd4000000-0000-4000-8000-000000000001',
  'GitPocket Client',
  'gitpocket-client',
  'A cross-platform mobile client for browsing GitHub repositories, managing issues, and reviewing code snippets on the go.',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80',
  'https://github.com/alexrivera/gitpocket',
  'https://gitpocket.demo.app',
  135,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Mobile App')
),
(
  'd4000000-0000-4000-8000-000000000002',
  'DevPodcasts Mobile',
  'devpodcasts-mobile',
  'A clean, gesture-driven mobile podcast player curated exclusively for software engineering, AI, and startup technology shows.',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
  'https://github.com/alexrivera/devpodcasts',
  'https://devpodcasts.demo.app',
  112,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Mobile App')
),
(
  'd4000000-0000-4000-8000-000000000003',
  'StackRead Reader',
  'stackread-reader',
  'Offline-first tech news reader aggregating Hacker News, Dev.to, and Reddit programming communities with dark mode.',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  'https://github.com/mayapatel/stackread',
  'https://stackread.demo.app',
  145,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Mobile App')
),
(
  'd4000000-0000-4000-8000-000000000004',
  'PingAlert Mobile',
  'pingalert-mobile',
  'Mobile companion app for server administrators to receive instant push notifications when endpoints go down or CPU spikes.',
  'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
  'https://github.com/liamchen/pingalert',
  'https://pingalert.demo.app',
  94,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'Mobile App')
),
(
  'd4000000-0000-4000-8000-000000000005',
  'SnippetVault App',
  'snippetvault-app',
  'Secure, encrypted mobile snippet locker with syntax highlighting for 50+ languages and biometric authentication.',
  'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&q=80',
  'https://github.com/alexrivera/snippetvault',
  'https://snippetvault.demo.app',
  168,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Mobile App')
),
(
  'd4000000-0000-4000-8000-000000000006',
  'PomodoroDev Focus',
  'pomodorodev-focus',
  'Minimalist Pomodoro timer and deep-work tracker for developers with Lo-Fi background beats and GitHub commit streak syncing.',
  'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80',
  'https://github.com/mayapatel/pomodorodev',
  'https://pomodorodev.demo.app',
  129,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Mobile App')
),

-- Open Source (8 projects)
(
  'e5000000-0000-4000-8000-000000000001',
  'RustEngine 2D',
  'rustengine-2d',
  'Lightweight, blazingly fast 2D game engine built in pure Rust with WebAssembly export support for running high-performance games in the browser.',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
  'https://github.com/alexrivera/rustengine-2d',
  'https://rustengine.demo.app',
  312,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000002',
  'TurboCache Memory',
  'turbocache-memory',
  'High-performance, multi-threaded distributed in-memory caching server written in Go. Drops in as a Redis replacement with 40% lower memory footprint.',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
  'https://github.com/liamchen/turbocache',
  'https://turbocache.demo.app',
  276,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000003',
  'Shadcn Extra Components',
  'shadcn-extra-components',
  'An open-source collection of 40+ complex accessible UI components built on top of shadcn/ui, Tailwind CSS v4, and Radix Primitives.',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  'https://github.com/mayapatel/shadcn-extra',
  'https://shadcn-extra.demo.app',
  340,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000004',
  'PgMigrate CLI',
  'pgmigrate-cli',
  'Zero-dependency database migration and schema diffing CLI for PostgreSQL written in Rust. Fast execution and dry-run safety verification.',
  'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80',
  'https://github.com/liamchen/pgmigrate',
  'https://pgmigrate.demo.app',
  198,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000005',
  'PyAsyncQueue',
  'pyasyncqueue',
  'Robust distributed task queue for Python asyncio with automatic retries, dead-letter exchanges, and real-time dashboard monitoring.',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80',
  'https://github.com/sarahlin/pyasyncqueue',
  'https://pyasyncqueue.demo.app',
  183,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000006',
  'GoAuthGuard Library',
  'goauthguard-library',
  'Production-ready authentication and RBAC middleware library for Go HTTP routers (Echo, Gin, Fiber) with JWT and session cookie handling.',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'https://github.com/liamchen/goauthguard',
  'https://goauthguard.demo.app',
  154,
  '55555555-5555-4555-a555-555555555555',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000007',
  'TailwindAnimate Extended',
  'tailwindanimate-extended',
  'A lightweight Tailwind CSS v4 utility plugin adding 60+ smooth keyframe animations, spring transitions, and scroll-triggered fade effects.',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80',
  'https://github.com/mayapatel/tailwindanimate',
  'https://tailwindanimate.demo.app',
  265,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Open Source')
),
(
  'e5000000-0000-4000-8000-000000000008',
  'NextAuth Boilerplate',
  'nextauth-boilerplate',
  'Enterprise-grade Next.js starter template featuring NextAuth v4, PostgreSQL, Prisma, Stripe billing, and modular shadcn/ui components.',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  'https://github.com/johndoe/nextauth-starter',
  'https://nextauth-starter.demo.app',
  295,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'Open Source')
),

-- Game (6 projects)
(
  'f6000000-0000-4000-8000-000000000001',
  'CyberQuest Arena Combat',
  'cyberquest-arena-combat',
  'Multiplayer browser arena combat game built with WebSockets, HTML5 Canvas, and a Go backend for sub-10ms tick rate synchronization.',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
  'https://github.com/alexrivera/cyberquest',
  'https://cyberquest.demo.app',
  189,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Game')
),
(
  'f6000000-0000-4000-8000-000000000002',
  'PixelDungeon Web',
  'pixeldungeon-web',
  'Roguelike dungeon crawler playable entirely inside your web browser. Built with TypeScript and React with custom pixel-art assets.',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
  'https://github.com/alexrivera/pixeldungeon',
  'https://pixeldungeon.demo.app',
  165,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Game')
),
(
  'f6000000-0000-4000-8000-000000000003',
  'SpaceShooter Wasm',
  'spaceshooter-wasm',
  'Retro arcade bullet-hell shooter compiled from pure Rust to WebAssembly running at 120 FPS inside any modern web browser.',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
  'https://github.com/alexrivera/spaceshooter',
  'https://spaceshooter.demo.app',
  142,
  '33333333-3333-4333-a333-333333333333',
  (SELECT id FROM categories WHERE name = 'Game')
),
(
  'f6000000-0000-4000-8000-000000000004',
  'CodeWars Chess',
  'codewars-chess',
  'Programmatic chess tournament engine where players upload custom Python or TypeScript AI bots to battle against each other automatically.',
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80',
  'https://github.com/sarahlin/codewars-chess',
  'https://codewars-chess.demo.app',
  215,
  '22222222-2222-4222-a222-222222222222',
  (SELECT id FROM categories WHERE name = 'Game')
),
(
  'f6000000-0000-4000-8000-000000000005',
  'VoxelCraft Browser',
  'voxelcraft-browser',
  '3D voxel block-building sandbox game using Three.js and TypeScript. Features infinite procedural terrain generation using Perlin noise.',
  'https://images.unsplash.com/photo-1579373923781-57a012ab6b90?w=800&q=80',
  'https://github.com/johndoe/voxelcraft',
  'https://voxelcraft.demo.app',
  178,
  '11111111-1111-4111-a111-111111111111',
  (SELECT id FROM categories WHERE name = 'Game')
),
(
  'f6000000-0000-4000-8000-000000000006',
  'WordleDev Edition',
  'wordledev-edition',
  'Daily programming word guessing puzzle game. Test your knowledge of obscure system commands, algorithms, and syntax keywords.',
  'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&q=80',
  'https://github.com/mayapatel/wordledev',
  'https://wordledev.demo.app',
  131,
  '44444444-4444-4444-a444-444444444444',
  (SELECT id FROM categories WHERE name = 'Game')
)
ON CONFLICT (slug) DO NOTHING;

-- Seed Project Technologies (M2M join table)
INSERT INTO project_technologies (project_id, technology_id) VALUES
-- SaaS
('a1000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Next.js')),
('a1000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'React')),
('a1000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('a1000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),
('a1000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

('a1000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'Python')),
('a1000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'React')),
('a1000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

('a1000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Go')),
('a1000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Next.js')),
('a1000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

('a1000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Next.js')),
('a1000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('a1000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'React')),
('a1000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('a1000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('a1000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'React')),
('a1000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'Go')),

('a1000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'Go')),
('a1000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

('a1000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'Next.js')),
('a1000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'TypeScript')),

('a1000000-0000-4000-8000-000000000009', (SELECT id FROM technologies WHERE name = 'Go')),
('a1000000-0000-4000-8000-000000000009', (SELECT id FROM technologies WHERE name = 'Rust')),

('a1000000-0000-4000-8000-000000000010', (SELECT id FROM technologies WHERE name = 'Next.js')),
('a1000000-0000-4000-8000-000000000010', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

-- AI
('b2000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Python')),
('b2000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Next.js')),
('b2000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'React')),
('b2000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('b2000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'Python')),
('b2000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

('b2000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Python')),
('b2000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'TypeScript')),

('b2000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'React')),
('b2000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('b2000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'Python')),
('b2000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'Next.js')),

('b2000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'Python')),

('b2000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'Next.js')),
('b2000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

('b2000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'Python')),
('b2000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'React')),

('b2000000-0000-4000-8000-000000000009', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('b2000000-0000-4000-8000-000000000009', (SELECT id FROM technologies WHERE name = 'React')),

('b2000000-0000-4000-8000-000000000010', (SELECT id FROM technologies WHERE name = 'Rust')),
('b2000000-0000-4000-8000-000000000010', (SELECT id FROM technologies WHERE name = 'Go')),

-- Web App
('c3000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Next.js')),
('c3000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('c3000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),
('c3000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('c3000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'React')),
('c3000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('c3000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Next.js')),
('c3000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'TypeScript')),

('c3000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'React')),
('c3000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'TypeScript')),

('c3000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'React')),

('c3000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'Next.js')),
('c3000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('c3000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'React')),
('c3000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'TypeScript')),

('c3000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'React')),
('c3000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'Python')),

('c3000000-0000-4000-8000-000000000009', (SELECT id FROM technologies WHERE name = 'React')),
('c3000000-0000-4000-8000-000000000009', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),

('c3000000-0000-4000-8000-000000000010', (SELECT id FROM technologies WHERE name = 'Next.js')),

-- Mobile App
('d4000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Flutter')),
('d4000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'Flutter')),
('d4000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'React')),
('d4000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Flutter')),
('d4000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Go')),
('d4000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'Flutter')),
('d4000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'Rust')),
('d4000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'React')),

-- Open Source
('e5000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Rust')),
('e5000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'Go')),
('e5000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Next.js')),
('e5000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'React')),
('e5000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),
('e5000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Rust')),
('e5000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),
('e5000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'Python')),
('e5000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'Go')),
('e5000000-0000-4000-8000-000000000007', (SELECT id FROM technologies WHERE name = 'Tailwind CSS')),
('e5000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'Next.js')),
('e5000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('e5000000-0000-4000-8000-000000000008', (SELECT id FROM technologies WHERE name = 'PostgreSQL')),

-- Game
('f6000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'Go')),
('f6000000-0000-4000-8000-000000000001', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('f6000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'React')),
('f6000000-0000-4000-8000-000000000002', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('f6000000-0000-4000-8000-000000000003', (SELECT id FROM technologies WHERE name = 'Rust')),
('f6000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'Python')),
('f6000000-0000-4000-8000-000000000004', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('f6000000-0000-4000-8000-000000000005', (SELECT id FROM technologies WHERE name = 'TypeScript')),
('f6000000-0000-4000-8000-000000000006', (SELECT id FROM technologies WHERE name = 'React'))
ON CONFLICT (project_id, technology_id) DO NOTHING;
