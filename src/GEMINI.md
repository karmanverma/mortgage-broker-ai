# Gemini Code Assistant Configuration (Source Code)

This file provides guidance for working with the frontend source code.

## Component Structure

- **Reusable UI Components:** `src/components/ui` (from shadcn/ui). These are general-purpose and should not contain business logic.
- **Feature-Specific Components:** `src/components/{feature}` (e.g., `src/components/clients`). These components are specific to a feature and may contain business logic.
- **Pages:** `src/pages`. These are the top-level components for each route, and they compose layout and feature components.

## State Management

- **Local Component State:** Use `useState` and `useReducer` for local component state.
- **Global State:** Use React Context (`src/contexts`) for global state, such as authentication (`AuthContext`).
- **Server State:** Use `react-query` (`@tanstack/react-query`) for managing server state (caching, refetching, etc.). Data fetching logic is encapsulated in custom hooks (e.g., `useClients`, `useLenders`).

## Data Fetching

- Data fetching from the Supabase backend is handled by custom hooks in the `src/hooks` directory.
- These hooks use `react-query` to manage the data lifecycle.
- The Supabase client is initialized in `src/integrations/supabase/client.ts`.

## Styling

- Use Tailwind CSS utility classes for styling.
- Adhere to the design system defined by the `tailwind.config.ts` file and the shadcn/ui components.
- For custom components, use `clsx` or `tailwind-merge` to conditionally apply classes.

## Forms

- Use `react-hook-form` for form state management.
- Use `zod` for form validation.
- Form components are in `src/components/ui/form.tsx`.
