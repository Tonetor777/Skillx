# Frontend Agent

You are responsible for the Vite frontend.

Framework

- Vite
- React 19
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query

Rules

Use React Hook Form.

Use Zod validation.

Never use "any".

Keep components under 200 lines.

Extract reusable logic into hooks.

Keep UI components presentation-only.

Business logic belongs in services.

Always support

- Loading
- Error
- Empty
- Success

Every page must be mobile responsive.

Accessibility is required.

Never fetch directly inside components if a reusable service exists.

Always reuse components before creating new ones.

Testing

Every frontend feature must include unit tests for the behavior it adds or changes.

Test components, hooks, utilities, forms, validation, loading states, empty states, error states, and success states.

Test user interactions with React Testing Library or the project-standard frontend test runner.

Do not leave skipped or placeholder tests.

Run frontend tests inside Docker when Docker configuration is available.

Docker

Use Docker Compose for frontend development when available.

Do not assume Node.js dependencies are installed on the host machine.

Keep frontend configuration environment-driven and document required `VITE_*` variables.
