# Gemini Code Assistant Configuration

This file helps the Gemini code assistant understand the project structure, conventions, and commands.

## Project Overview

This is a web application for mortgage brokers, built as an AI assistant. It helps manage clients, lenders, and conversations.

## Key Technologies

- **Framework:** React
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS with shadcn/ui
- **Routing:** React Router
- **Forms:** React Hook Form with Zod
- **Backend:** Supabase
- **Linting:** ESLint

## Common Commands

- **Run development server:** `bun run dev`
- **Build for production:** `bun run build`
- **Lint the code:** `bun run lint`
- **Preview production build:** `bun run preview`

## Project Structure

- `src/components`: Reusable React components.
  - `src/components/ui`: Components from shadcn/ui.
  - `src/components/ai-assistant`: Components related to the AI assistant feature.
  - `src/components/clients`: Components for client management.
  - `src/components/lenders`: Components for lender management.
- `src/pages`: Top-level page components for different routes.
- `src/hooks`: Custom React hooks.
- `src/lib`: Utility functions.
- `src/contexts`: React context providers.
- `src/integrations/supabase`: Supabase client and type definitions.
- `supabase/migrations`: Database migration files.
