# Alwyn Sebastian: Portfolio

Live: https://alwyn-sebastian.vercel.app · Admin: `/admin`

A dark, animated portfolio with interactive case studies and an admin panel. Every section is editable, and new fields and sections can be added without code changes.

## Architecture

```
Browser ──► Vercel CDN (static: index.html, project.html, admin.html, assets/)
   │
   └──► /api/*  (Vercel Node functions, zero dependencies)
           ├─ POST /api/auth/login      email+password → Supabase Auth → httpOnly cookies
           ├─ POST /api/auth/logout
           ├─ GET  /api/auth/session    refreshes expired tokens transparently
           ├─ GET  /api/content         public, CDN-cached 60s (?fresh=1 bypasses)
           └─ PUT  /api/content/:key    admin only → RPC save_content (versioned)
                        │
                        ▼
                  Supabase Postgres
                  content · content_history · admins   (RLS on all tables)
```

| Layer | Responsibility |
|---|---|
| `assets/site-data.js`, `assets/projects-data.js` | Default content and seed source. The site renders these instantly and when the API is unreachable. |
| `assets/content.js` | Loads `/api/content`, merges it over the defaults, and escapes content (`**bold**` only, allow-listed links). |
| `assets/home.js`, `assets/project.js`, `assets/scenes.js` | Render the homepage, the case-study pages and the scroll-driven scenes from content. |
| `assets/admin.js` | Schema-less editor: builds a form from each section's JSON shape. |
| `api/` | Thin auth and content API. It holds only the public anon key. |
| `db/schema.sql` | Tables, RLS policies, `is_admin()`, `save_content()` (optimistic concurrency and audit history). |

### Security model
- **No service-role key is deployed.** The server uses the public anon key and the signed-in user's JWT. Admin rights are enforced in Postgres (RLS and a `security definer` RPC that checks `public.admins`), so an API bug cannot grant write access.
- **Sessions:** `HttpOnly; Secure; SameSite=Strict` cookies. The refresh token is scoped to `/api`.
- **CSRF:** SameSite=Strict, a same-origin check and a required `x-requested-with` header on every write.
- **XSS:** content is always escaped before rendering. The admin UI uses `textContent`/`.value` only. CSP and `X-Frame-Options: DENY` apply on `/admin`.
- **Audit:** every save increments `version` and appends to `content_history`. A stale `version` returns `409`.
- **Secrets are never committed.** Real values live only in Vercel Environment Variables (see `.env.example`).

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `SUPABASE_URL` | Vercel → Project → Settings → Environment Variables | `https://<ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | same | Public anon key (RLS-protected). **Never** use the service-role key here. |

## Setup (one time)
1. Run `db/schema.sql`, then `db/seed.sql` (regenerate with `npm run seed:sql`) in the Supabase SQL editor.
2. Create your admin user: Supabase → Authentication → Users → **Add user** (email and password). Then run:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'you@example.com';
   ```
3. Set the two env vars in Vercel and redeploy. Sign in at `/admin`.

## Editing content
- `/admin` → pick a section → edit → **Save** (Ctrl/Cmd+S). The public site updates within about 60s (CDN cache).
- **Add a field:** type a name and choose text / long text / number / yes-no / list / group → **+ add field**.
- **Add a list item:** **+ add item** copies the shape of the last item. Use ↑ ↓ to reorder, ⧉ to duplicate and × to remove.
- **New homepage section:** add an item under **Custom sections** (`title`, `subtitle`, `layout: "cards" | "list"`, `items[]`). It renders automatically before Contact.
- **New data for a future feature:** **+ new data key** stores any JSON under a new key, readable at `/api/content`.
- **JSON view** edits a section's raw JSON directly.

## Development
```bash
npm test            # API contract tests (Supabase stubbed; no deps)
npm run seed:sql    # regenerate db/seed.sql from assets/*-data.js
npx vercel dev      # run the site and API locally (needs env vars in .env.local)
```
