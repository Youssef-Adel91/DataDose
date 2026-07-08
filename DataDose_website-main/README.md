# DataDose Website

DataDose Website is the frontend application for the DataDose clinical decision support platform. It is built with Next.js and provides role-based dashboards, prescription and interaction workflows, patient views, and supporting admin and system pages. The interface is designed to present medical decision support data in a clear, modern, and responsive way.

## Overview

This repository contains the web application used to demonstrate and operate the DataDose user experience. It includes:

- A public landing experience for introducing the platform.
- Authentication and role-based navigation.
- Dashboards for physicians, pharmacists, patients, admins, and super admins.
- Clinical workflow tools such as prescription scanning, interaction review, alternatives, symptom tracing, and graph-assisted insights.
- API route handlers that coordinate frontend features with backend services and data sources.

The application uses mock/demo authentication flows in the frontend alongside backend integrations, so it can be run locally for development, testing, and presentation purposes.

## Key Capabilities

- Role-based dashboards for physician, pharmacist, patient, admin, and system users.
- Prescription scanning and drug interaction review.
- Graph-assisted clinical workflows for alternatives, symptom tracing, and visual prescription mapping.
- Admin and super-admin pages for analytics, safety monitoring, user management, and system oversight.
- Modern UI with responsive layouts, motion effects, and reusable dashboard components.

## Technology Stack

- Framework: Next.js 15 with the App Router.
- Language: TypeScript.
- Styling: Tailwind CSS v4 and custom global styles.
- Motion and charts: Framer Motion, Recharts, and Chart.js.
- Authentication and data access: NextAuth, Prisma, and PostgreSQL.
- Visualizations: React Flow for graph-style prescription views.
- Tooling: ESLint, Playwright, Prisma CLI, and Vercel deployment support.

## Project Structure

Important folders inside this app:

- `app/` - Application routes, layouts, and API handlers.
- `app/components/` - Reusable UI components and role-specific widgets.
- `app/dashboard/` - Dashboard routes for each role.
- `app/login/` - Authentication entry point.
- `app/pricing/` - Public pricing page.
- `app/api/` - Backend-facing route handlers for scans, chat, OCR, graph, alternatives, and admin workflows.
- `prisma/` - Database schema and seed data.
- `public/` - Static assets.
- `types/` - Shared TypeScript types.

## Available Routes

Common public and application routes include:

- `/` - Landing page.
- `/login` - Login page.
- `/pricing` - Pricing page.
- `/dashboard` - Dashboard redirect or overview entry point.
- `/dashboard/physician` - Physician workflow.
- `/dashboard/pharmacist` - Pharmacist workflow.
- `/dashboard/patient` - Patient view.
- `/dashboard/admin` - Admin console.
- `/dashboard/system` - Super-admin or system monitoring view.
- `/dashboard/settings` - Account and preferences.

API handlers live under `app/api/` and are organized by feature area such as scan, OCR, graph, chat, prescriptions, alternatives, tracer, visualization, authentication, and admin operations.

## Getting Started

### Prerequisites

- Node.js 20 or newer.
- npm.
- PostgreSQL available locally or through a hosted service.
- Optional: backend services required by the site configuration, depending on the features you want to run.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `DataDose_website-main` and set the values required by the app.

Typical variables used by this project include:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/datadose"
NEXTAUTH_SECRET="replace-with-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
GROQ_API_KEY="your-groq-key"
OPENAI_API_KEY="your-openai-key"
NEO4J_URI="neo4j+s://your-neo4j-host"
```

Only provide the keys needed for the features you intend to use.

### 3. Run Database Setup

If Prisma migrations or schema generation are required in your environment, run:

```bash
npx prisma generate
npx prisma migrate dev
```

If this project uses seed data in your workflow, run the Prisma seed command defined in `package.json`.

### 4. Start the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Demo Accounts

The quick-start workflow in this repository includes demo credentials for local exploration:

- Pharmacist: `pharmacist@datadose.ai` / `password123`
- Physician: `physician@datadose.ai` / `password123`
- Admin: `admin@datadose.ai` / `password123`
- Super Admin: `superadmin@datadose.ai` / `password123`

These accounts are intended for demonstration and testing only.

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

`npm run postinstall` also runs `prisma generate` automatically after install.

## Testing

This repository includes Playwright-based browser tests and workflow scripts. Depending on your setup, you may run:

```bash
npx playwright test
```

If you only want to validate the application logic or UI changes locally, use the relevant test file or feature flow script from the repository root.

## Deployment

The app includes Vercel configuration and is suitable for deployment to Vercel or another platform that supports Next.js applications.

Before deploying, confirm that:

- Environment variables are configured in the target environment.
- Prisma schema and database connectivity are correct.
- Any external backend services referenced by the app are reachable.

## Security and Compliance

DataDose is a clinical decision support interface and should be treated as a decision aid, not a replacement for licensed medical judgment. Validate recommendations against approved clinical references, local policy, and appropriate regulatory requirements before using the application in production workflows.

## Support Files

For feature context and implementation details, review:

- `QUICK_START.md`
- `FEATURES_SUMMARY.md`
- `app/`
- `prisma/schema.prisma`
- `README.md` files in adjacent product folders when working across the wider DataDose workspace.

## License

This repository does not currently declare a formal license in this file. Add one if the project is intended for external distribution.
