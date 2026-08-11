---
name: frontend-architecture
description: Feature-sliced layout rules for frontend/src (pages, features, shared, app) and the import boundaries between them. Use when adding, moving, or reviewing any file under frontend/src — new screens, components, hooks, API calls, or when deciding where a piece of code belongs.
---

# Frontend architecture

Layout and dependency rules for everything under `frontend/src`.

> Naming note: `shared/` in this document always means `frontend/src/shared/` (frontend-only
> code). It is **not** the `@hob/shared` workspace package at the repo root, which holds types
> shared between frontend and backend. API contract types keep coming from `@hob/shared`.

## Structure

```
frontend/src/
  pages/
    <PageName>Page/
      index.tsx          thin page component, only composes features together;
                         NO business logic, NO fetch calls

  features/
    <feature-name>/
      components/        presentational components only (display only, minimal logic,
                         receive data and callbacks via props)
      hooks/             all logic: state, side-effects, event handlers
                         (e.g. useSignIn, useSignUp)
      api/               request functions to the backend, specific to this feature
      helpers/           pure functions with no React (validation, formatting),
                         used only within this feature
      types.ts           types specific to this feature
      index.ts           the single public entry point: exports only what should be
                         accessible from other parts of the app

  shared/
    components/          UI components used by 2+ features (Button, Input, Modal)
    hooks/               reusable hooks (useDebounce, etc.)
    api/                 shared fetch client, network error handling
    types/               shared frontend types

  app/
    App.tsx             providers only, wrapped around <AppRouter />
    router.tsx          every route lives here (see "Routing")
    routes/             route guards (RequireAuth, RequireGuest, …)
    main.tsx            mounts <App />, imports index.css
    index.css           global stylesheet / Tailwind entry
```

A feature directory only contains the subfolders it actually needs — do not create empty
`helpers/` or `types.ts` placeholders.

## Rules

1. **No data fetching inside components.** A component must never contain fetch calls or a
   `useEffect` with business logic directly — that always belongs in `hooks/` within the same
   feature.
2. **Features never import from each other.** If two features need something in common, that
   common thing gets moved into `shared/`.
3. **`shared/` never imports from `features/`.** The dependency direction is always one-way:
   `app/` → `pages/` → `features/` → `shared/`.
4. **A feature is deletable.** If a feature is deleted, its entire folder is deleted — nothing
   should be left "orphaned" elsewhere in the project.
5. **Pages contain no logic** — only composition of features on screen.
6. **Only `index.ts` is exposed outside a feature.** Imports from other parts of the app always
   go through it (e.g. `import { SignInForm } from 'features/auth'`), never directly into a
   feature's `components/` or `hooks/`.

## Where does this code go?

| The code… | goes to |
|---|---|
| calls `fetch` / talks to the backend | `features/<name>/api/` (or `shared/api/` if generic) |
| holds state, effects, handlers | `features/<name>/hooks/` |
| renders markup from props | `features/<name>/components/` |
| renders markup, used by 2+ features | `shared/components/` |
| formats/validates, no React | `features/<name>/helpers/` |
| describes the API contract | `@hob/shared` (the workspace package) |
| describes internal feature shapes | `features/<name>/types.ts` |
| composes features on a screen | `pages/<PageName>Page/index.tsx` |
| declares a path | `app/router.tsx` |
| guards a path (auth, roles) | `app/routes/` |
| redirects after an action | the feature's hook (`useSignIn`, …) |
| providers, entry point | `app/App.tsx`, `app/main.tsx` |

## Routing

Paths live in exactly one file: `app/router.tsx`. It owns the router instance (`BrowserRouter` +
`Routes`, or `createBrowserRouter` + `RouterProvider`) and the full list of paths mapped to page
components, and exports `<AppRouter />`.

`app/App.tsx` stays thin — providers wrapped around `<AppRouter />`, nothing else. It should not
import from `react-router` at all; if it does, routing has leaked back into it.

```tsx
// app/App.tsx
export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
```

Route guards (`RequireAuth`, `RequireGuest`, role checks) go in `app/routes/` and wrap the page
element inside `router.tsx`. A guard reads state through a feature's public API
(`useCurrentUser` from `features/auth`) — that is `app/` → `features/`, the allowed direction.
Guards must render a pending state while the session check is in flight; redirecting on a
not-yet-known user bounces signed-in people to the login screen on every reload.

Pages stay unaware of routing decisions: no redirects, no guards inside `pages/` (rule 5).
Navigation *after* an action (redirect on successful sign-in) belongs to the feature's hook, not
to the page or the component.

## Known exceptions

Two cases where the literal reading of the structure gives way to the rules behind it.

**A state provider lives in the feature that owns the state, not in `app/`.** `app/` is listed as
the home of providers, but that describes where providers are *mounted*: `app/App.tsx` composes
them around the router. The provider component and its context stay inside the feature, exported
through its `index.ts`. Rule 4 decides this — if deleting the feature folder would leave a dead
provider in `app/`, the provider was in the wrong place. Only providers that outlive every
feature (theme, i18n, query client) genuinely belong to `app/`.

**A component moves to `shared/` when the second feature asks for it, not in anticipation.** Even
an obviously generic `Button` or `TextField` starts inside the feature that needed it first. The
"2+ features" bar in `shared/components/` is a trigger, not a guess: the moment a second feature
imports it, move it up and update both call sites in the same change. Promoting early produces a
`shared/` full of components with one caller each, shaped by a single feature's needs.

## Conventions

- PascalCase for React components and page folders (`SignInForm.tsx`, `HomePage/`);
  camelCase for everything else (`useSignIn.ts`, `signIn.ts`, `types.ts`).
- Feature folder names are kebab-case (`features/user-list/`).
- A feature's `index.ts` re-exports deliberately — exporting everything defeats rule 6.

## Prerequisite for rule 6

The `import { X } from 'features/...'` form needs path aliases configured in **both**
`frontend/tsconfig.app.json` (`compilerOptions.paths`) and `frontend/vite.config.ts`
(`resolve.alias`) — TypeScript resolves types, Vite resolves the actual bundle. If aliases are
not configured yet, add them before writing the first cross-layer import; relative paths that
climb out of a feature (`../../features/auth/components/...`) violate rule 6 by construction.
