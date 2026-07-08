<div align="center">

<img src="../assets/headers/website-banner.svg" alt="DataDose Website Banner" width="100%" />

<br/>

<img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15"/>
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
<img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
<img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/NextAuth.js-Auth-000000?style=for-the-badge" alt="NextAuth"/>
<img src="https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
<img src="https://img.shields.io/badge/Playwright-Testing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright"/>

<br/><br/>

**Role-based clinical decision support frontend for physicians, pharmacists, patients, and administrators.**

[Overview](#overview) • [Key Capabilities](#key-capabilities) • [Tech Stack](#technology-stack) • [Getting Started](#getting-started) • [Routes](#available-routes) • [Deployment](#deployment) • [Contributing](#contributing)

</div>

<br/>

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Table of Contents

<img src="../assets/headers/toc.svg" width="100%" alt="Table of Contents"/>

| Section | Description |
|---|---|
| [Overview](#overview) | What this repository is and what it does |
| [Key Capabilities](#key-capabilities) | Core product features |
| [Technology Stack](#technology-stack) | Frameworks, languages, and tooling |
| [Repository Structure](#repository-structure) | Folder layout and responsibilities |
| [Available Routes](#available-routes) | Public and application routes |
| [Prerequisites](#prerequisites) | Required tooling and services |
| [Getting Started](#getting-started) | Local installation and setup |
| [Environment Variables](#environment-variables) | Required and optional configuration |
| [Demo Accounts](#demo-accounts) | Local test credentials |
| [Common Commands](#common-commands) | npm scripts reference |
| [Testing](#testing) | Playwright test execution |
| [Deployment](#deployment) | Production deployment guidance |
| [Security & Compliance](#security-and-compliance) | Clinical usage disclaimer |
| [Roadmap](#roadmap) | Planned improvements |
| [Support Files](#support-files) | Related documentation |
| [License](#license) | Licensing status |

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Overview

<img src="../assets/headers/overview.svg" width="100%" alt="Project Overview"/>

**DataDose Website** is the frontend application for the DataDose clinical decision support platform. It is built with **Next.js (App Router)** and provides role-based dashboards, prescription and interaction workflows, patient views, and supporting admin and system pages. The interface presents medical decision support data in a clear, modern, and responsive way.

This repository contains the web application used to demonstrate and operate the DataDose user experience:

- A public landing experience for introducing the platform.
- Authentication and role-based navigation.
- Dashboards for physicians, pharmacists, patients, admins, and super admins.
- Clinical workflow tools such as prescription scanning, interaction review, alternatives, symptom tracing, and graph-assisted insights.
- API route handlers that coordinate frontend features with backend services and data sources.

> The application uses mock/demo authentication flows in the frontend alongside backend integrations, so it can be run locally for development, testing, and presentation purposes.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Key Capabilities

<img src="../assets/headers/features.svg" width="100%" alt="Key Capabilities"/>

| Capability | Description |
|---|---|
| 🩺 Role-Based Dashboards | Dedicated dashboards for physician, pharmacist, patient, admin, and system users |
| 💊 Prescription Scanning | Scan and review prescriptions for potential drug interactions |
| 🕸️ Graph-Assisted Workflows | Visual alternatives, symptom tracing, and prescription mapping via React Flow |
| 🛡️ Admin & Oversight Tools | Analytics, safety monitoring, user management, and system oversight pages |
| ✨ Modern UI/UX | Responsive layouts, motion effects (Framer Motion), and reusable components |

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Technology Stack

<img src="../assets/headers/techstack.svg" width="100%" alt="Technology Stack"/>

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom global styles |
| Motion & Charts | Framer Motion, Recharts, Chart.js |
| Auth & Data Access | NextAuth, Prisma, PostgreSQL |
| Visualizations | React Flow (graph-style prescription views) |
| Tooling | ESLint, Playwright, Prisma CLI |
| Deployment | Vercel |

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Repository Structure

<img src="../assets/headers/folder.svg" width="100%" alt="Folder Structure"/>

```text
DataDose_website-main/
├── app/                     # Application routes, layouts, and API handlers
│   ├── components/          # Reusable UI components and role-specific widgets
│   ├── dashboard/           # Dashboard routes for each role
│   │   ├── physician/
│   │   ├── pharmacist/
│   │   ├── patient/
│   │   ├── admin/
│   │   ├── system/
│   │   └── settings/
│   ├── login/                # Authentication entry point
│   ├── pricing/               # Public pricing page
│   └── api/                    # Backend-facing route handlers
│       ├── scan/                # Prescription scanning
│       ├── ocr/                 # OCR processing
│       ├── graph/               # Graph-assisted clinical workflows
│       ├── chat/                # Conversational assistant endpoints
│       ├── alternatives/        # Alternative medication suggestions
│       ├── tracer/              # Symptom tracing
│       └── admin/               # Admin operations
├── prisma/                  # Database schema and seed data
│   └── schema.prisma
├── public/                  # Static assets
├── types/                   # Shared TypeScript types
├── QUICK_START.md
├── FEATURES_SUMMARY.md
└── README.md
```

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Available Routes

<img src="../assets/headers/dashboard-pages.svg" width="100%" alt="Dashboard Pages"/>

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login page |
| `/pricing` | Pricing page |
| `/dashboard` | Dashboard redirect / overview entry point |
| `/dashboard/physician` | Physician workflow |
| `/dashboard/pharmacist` | Pharmacist workflow |
| `/dashboard/patient` | Patient view |
| `/dashboard/admin` | Admin console |
| `/dashboard/system` | Super-admin / system monitoring view |
| `/dashboard/settings` | Account and preferences |

API handlers live under `app/api/` and are organized by feature area: scan, OCR, graph, chat, prescriptions, alternatives, tracer, visualization, authentication, and admin operations.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Prerequisites

<img src="../assets/headers/prerequisites.svg" width="100%" alt="Prerequisites"/>

| Requirement | Notes |
|---|---|
| Node.js | Version 20 or newer |
| npm | Package manager |
| PostgreSQL | Local instance or hosted service |
| Backend services | Optional, required depending on enabled features |

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Getting Started

<img src="../assets/headers/installation.svg" width="100%" alt="Installation"/>

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `DataDose_website-main` and set the values required by the app (see [Environment Variables](#environment-variables)).

### 3. Run Database Setup

If Prisma migrations or schema generation are required in your environment:

```bash
npx prisma generate
npx prisma migrate dev
```

If this project uses seed data in your workflow, run the Prisma seed command defined in `package.json`.

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Environment Variables

<img src="../assets/headers/configuration.svg" width="100%" alt="Configuration"/>

```env
DATABASE_URL="postgresql://user:password@localhost:5432/datadose"
NEXTAUTH_SECRET="replace-with-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
GROQ_API_KEY="your-groq-key"
OPENAI_API_KEY="your-openai-key"
NEO4J_URI="neo4j+s://your-neo4j-host"
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign NextAuth sessions |
| `NEXTAUTH_URL` | Yes | Base URL for the NextAuth callback flow |
| `BACKEND_URL` | Optional | Base URL of connected backend services |
| `GROQ_API_KEY` | Optional | Enables Groq-powered features |
| `OPENAI_API_KEY` | Optional | Enables OpenAI-powered features |
| `NEO4J_URI` | Optional | Enables graph-assisted clinical workflows |

> Only provide the keys required for the features you intend to use.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Demo Accounts

<img src="../assets/headers/access.svg" width="100%" alt="Access"/>

For local exploration only:

| Role | Email | Password |
|---|---|---|
| Pharmacist | `pharmacist@datadose.ai` | `password123` |
| Physician | `physician@datadose.ai` | `password123` |
| Admin | `admin@datadose.ai` | `password123` |
| Super Admin | `superadmin@datadose.ai` | `password123` |

> These accounts are intended for demonstration and testing only. Do not reuse in production.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Common Commands

<img src="../assets/headers/usage.svg" width="100%" alt="Usage"/>

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint checks |
| `npm run postinstall` | Runs `prisma generate` automatically after install |

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Testing

This repository includes Playwright-based browser tests and workflow scripts.

```bash
npx playwright test
```

If you only want to validate application logic or UI changes locally, use the relevant test file or feature flow script from the repository root.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Deployment

<img src="../assets/headers/access.svg" width="100%" alt="Deployment"/>

The app includes Vercel configuration and is suitable for deployment to Vercel or another platform that supports Next.js applications.

Before deploying, confirm:

- [ ] Environment variables are configured in the target environment.
- [ ] Prisma schema and database connectivity are correct.
- [ ] Any external backend services referenced by the app are reachable.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Security and Compliance

<img src="../assets/headers/prerequisites.svg" width="100%" alt="Security"/>

DataDose is a clinical decision support interface and should be treated as a **decision aid, not a replacement for licensed medical judgment**. Validate recommendations against approved clinical references, local policy, and applicable regulatory requirements before using the application in production workflows.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Roadmap

<img src="../assets/headers/roadmap.svg" width="100%" alt="Roadmap"/>

- [ ] Formal license declaration
- [ ] Expanded automated test coverage across dashboard roles
- [ ] Production-hardened authentication flow (replace demo credentials)
- [ ] CI/CD pipeline for automated build, lint, and test on pull requests

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Support Files

<img src="../assets/headers/module-details.svg" width="100%" alt="Support Files"/>

For feature context and implementation details, review:

- [`QUICK_START.md`](./QUICK_START.md)
- [`FEATURES_SUMMARY.md`](./FEATURES_SUMMARY.md)
- [`app/`](./app)
- [`prisma/schema.prisma`](./prisma/schema.prisma)
- `README.md` files in adjacent product folders when working across the wider DataDose workspace

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## Contributing

<img src="../assets/headers/contributors.svg" width="100%" alt="Contributing"/>

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request, and ensure `npm run lint` and the Playwright test suite pass locally.

<img src="../assets/headers/divider.svg" width="100%" alt="divider"/>

## License

<img src="../assets/headers/license.svg" width="100%" alt="License"/>

This repository does not currently declare a formal license in this file. Add one (e.g., MIT, Apache 2.0) if the project is intended for external distribution.

<br/>

<div align="center">

Built with ⚡ using Next.js, TypeScript, and Tailwind CSS

</div>
