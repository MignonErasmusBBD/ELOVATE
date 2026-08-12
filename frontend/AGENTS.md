<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Elovate frontend conventions

Follow these when editing this app:

- Prefer semantic HTML (`section`, `header`, `footer`, `main`, `aside`, `figure`, `fieldset`, `p`, `span`) over generic `div`s. Use `div` only when no semantic element fits.
- Use descriptive variable and function names (`emailAddress`, `fieldErrors`, `hasAttemptedSubmit`).
- Prefer `undefined` over `null` for absent values (optional props, cleared errors, conditional render fallbacks). Do not mix `null` and `undefined`.
- Do not coerce values with casts like `Boolean(errors.name)`, `!!value`, `as SomeType`, `Number(...)`, or `String(...)`. Use explicit checks instead (`errors.name !== undefined`).
- Put reusable logic in `src/helpers/` (for example `validation.ts`, `formErrors.ts`) instead of duplicating helpers inside components.
- Keep feature UI in `src/features/<area>/` and shared primitives in `src/components/`.
