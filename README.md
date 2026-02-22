# NimbusDesk

NimbusDesk is a modern cloud IDE built with Next.js App Router, Monaco Editor, MongoDB, and AI-assisted coding APIs.

It provides:
- Project-based workspace management
- VS Code style file explorer and editor experience
- Multi-language run/preview support
- AI chat and debugging assistance
- Email/password auth plus OAuth (Google, GitHub) via NextAuth

## Core Features

- Authentication
  - Custom JWT login/signup
  - OAuth login with Google and GitHub
  - Protected API routes with shared auth resolver
- Projects
  - Create, rename, delete projects
  - Open project directly from dashboard card
- File System (per project)
  - Create files/folders (including nested creation)
  - Rename and delete files/folders
  - Folder-aware recursive rename/delete handling
  - Language icon detection
- Editor
  - Monaco editor with tabbed files
  - Auto-save with manual save option
  - Theme selection (multiple dark themes)
  - Adjustable font size, minimap, word wrap
  - Resizable explorer, output panel, and AI panel
- Run & Preview
  - Run: JavaScript, TypeScript, Python, C, C++, Java
  - Preview: HTML, CSS, React (JSX/TSX)
  - Dockable output panel (bottom/right)
- AI Assistance
  - AI Chat panel (code generation/help/debug guidance)
  - AI Debug endpoint for root-cause + corrected code suggestion
  - Local fallback responses when API providers are unavailable

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: React 19, Tailwind CSS, Framer Motion, Lucide Icons
- Editor: Monaco (`@monaco-editor/react`)
- State: Zustand
- DB: MongoDB + Mongoose
- Auth: Custom JWT + NextAuth
- AI Providers: Gemini (`@google/generative-ai`) and optional OpenAI fallback

## Project Structure

```text
src/
  app/
    api/
      auth/            # login/signup/logout + NextAuth
      projects/        # project CRUD
      files/           # file/folder CRUD
      run/             # code execution / preview
      ai/chat/         # chat assistant
      ai/debug/        # debugging assistant
    dashboard/         # project listing and management
    editor/[projectId] # main editor workspace
  components/          # UI components (editor, sidebar, navbar, auth)
  lib/                 # db, auth helpers, axios, user resolver
  models/              # Mongoose models
  store/               # Zustand store
  utils/               # file tree + icon mapping
```

## Application Workflow

1. User signs in (email/password or OAuth).
2. Auth cookie/session is created.
3. Dashboard fetches user projects from `/api/projects`.
4. Opening a project navigates to `/editor/[projectId]`.
5. File explorer loads `/api/files?projectId=...`.
6. User edits code in Monaco (auto-save to `/api/files/[id]`).
7. User runs code via `/api/run`.
8. Optional AI actions:
   - Ask coding questions in AI panel (`/api/ai/chat`)
   - Request debugging help (`/api/ai/debug`)

## Authentication Flow

Protected routes use `getUserFromRequest` (`src/lib/getUser.ts`), which resolves auth in this order:

1. `accessToken` custom JWT cookie
2. NextAuth JWT token

This allows custom auth and OAuth to work with the same backend authorization checks.

## API Surface (High Level)

- `POST /api/auth/signup` - register user
- `POST /api/auth/login` - custom login, sets JWT cookies
- `POST /api/auth/logout` - clear custom auth cookies
- `GET|POST /api/auth/[...nextauth]` - NextAuth handlers (Google/GitHub)
- `GET /api/protected` - test protected access
- `GET|POST /api/projects` - list/create projects
- `PATCH|DELETE /api/projects/:id` - rename/delete project
- `GET|POST /api/files` - list/create files/folders
- `GET|PUT|PATCH|DELETE /api/files/:id` - read/update/rename/delete file/folder
- `POST /api/run` - execute code or return preview HTML
- `POST /api/ai/chat` - AI coding/chat responses
- `POST /api/ai/debug` - AI debugging result

## Environment Variables

Use `.env.example` as the template.

Required:

```env
MONGODB_URI=
ACCESS_SECRET=
REFRESH_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GEMINI_API_KEY=
```

Optional:

```env
NEXT_PUBLIC_API_URL=
OPENAI_API_KEY=
CODE_RUNNER_MODE=local
CODE_RUNNER_URL=
CODE_RUNNER_API_KEY=
```

Notes:
- For local: `NEXTAUTH_URL=http://localhost:3000`
- For Vercel: `NEXTAUTH_URL=https://<your-domain>`
- Keep `NEXT_PUBLIC_API_URL` empty unless you intentionally use a separate API origin.
- `CODE_RUNNER_MODE=remote` forces C/C++/Java/Python execution through a remote runner.
- On Vercel, remote mode is auto-enabled.
- `CODE_RUNNER_URL` overrides the default runner endpoint (`https://emkc.org/api/v2/piston/execute`).
- `CODE_RUNNER_API_KEY` is optional and sent as both `Authorization: Bearer` and `X-API-Key`.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill all required env values.

4. Run dev server:

```bash
npm run dev
```

5. Open:
- `http://localhost:3000`

## Build and Type Check

```bash
npm run build
npx tsc --noEmit
```

## Deployment (Vercel) Checklist

- Add all required env variables in Vercel project settings.
- Set `NEXTAUTH_URL` to production domain.
- Configure OAuth callbacks:
  - Google: `https://<domain>/api/auth/callback/google`
  - GitHub: `https://<domain>/api/auth/callback/github`
- Redeploy after any env change.

## Troubleshooting

- `401 Unauthorized` on `/api/protected` or `/api/projects`
  - Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
  - Ensure auth cookies exist after login
  - Confirm Vercel env variables are set for the right environment
- OAuth redirect error (`redirect_uri is not associated`)
  - Add exact callback URI in provider console
  - Match protocol/domain/path exactly
- Backend works local but fails on Vercel
  - Check `MONGODB_URI` access rules and Vercel env values
  - Ensure `NEXT_PUBLIC_API_URL` is not pointing to localhost in production
- Runtime execution issues for C/C++/Java/Python
  - Hosted environments may not include all compilers/runtimes by default
  - This project automatically uses a remote runner for these languages on Vercel
  - You can force remote mode anywhere with `CODE_RUNNER_MODE=remote`
  - If you get `401`, set `CODE_RUNNER_URL` and `CODE_RUNNER_API_KEY` for your runner provider

## Security Notes

- Never commit real secrets to git.
- Rotate keys immediately if exposed.
- Use strong random values for `ACCESS_SECRET`, `REFRESH_SECRET`, and `NEXTAUTH_SECRET`.
- Keep OAuth client secrets only in server-side env vars.
