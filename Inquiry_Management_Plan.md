# Inquiry Management Portal – Updated 2‑Day MVP Plan

**Target deadline:** 48 hours (2 days) – on‑premise Ubuntu server

---

## 1️⃣ Project Skeleton (Day 0 – 2 h)
- Create two top‑level folders:
  - `backend/` – Laravel 12 source
  - `frontend/` – React 18 (Vite) source
- Add a top‑level `README.md` (developer setup guide) – see the separate **Developer Setup Guide** file.
- Initialize a Git repository and commit the scaffold.

---

## 2️⃣ Backend – Laravel 12 (Day 0‑0.5 – ~3 h)
| Step | Command / Task | Result |
|------|----------------|--------|
| **2.1 Install dependencies** | `cd backend && composer install` | `vendor/` populated |
| **2.2 Environment file** | `cp .env.example .env` | Ready to edit |
| **2.3 Application key** | `php artisan key:generate` | `APP_KEY` set |
| **2.4 JWT auth** | `composer require tymon/jwt-auth`<br>`php artisan jwt:secret` | `JWT_SECRET` added |
| **2.5 Database config** | Edit `.env` → DB credentials | – |
| **2.6 Mailtrap** | Add Mailtrap SMTP vars to `.env` | – |
| **2.7 File storage** | Keep `FILESYSTEM_DRIVER=local` (switchable via ENV) | – |
| **2.8 Migrations & seeders** | `php artisan migrate --seed` | Tables created, default roles (`admin`, `sales`) and sample users |
| **2.9 Core models & migrations** | `User` (with `manager_id` for hierarchy), `Inquiry`, `Note`, `Reminder`, `Attachment`, `LeadSource` (optional) | DB schema ready |
| **2.10 Policies** | `php artisan make:policy InquiryPolicy` – enforce hierarchy (admin all, others limited to own records) | Access control in place |
| **2.11 API routes** (`routes/api.php`) – grouped under `auth:api` (JWT) |
| **2.12 Email notifications** (MVP) – Listener on `InquiryCreated` sends a Mailtrap email | Notification ready |
| **2.13 CSV export** – `GET /api/inquiries/export` returns a CSV of filtered results | Export endpoint ready |

---

## 3️⃣ Frontend – React (Day 0.5‑1 – ~4 h)
| Step | Command / Task | Result |
|------|----------------|--------|
| **3.1 Install deps** | `cd frontend && npm ci` | `node_modules/` |
| **3.2 UI library** | `npm i @mui/material @emotion/react @emotion/styled` – lightweight **MUI** with **light theme** | Modern UI components |
| **3.3 Global theme** | `src/theme/lightTheme.ts` – light palette, subtle shadows |
| **3.4 Core component library** | `FormInput`, `Select`, `Badge`, `Table`, `Pagination`, `Modal`, `Card`, `Alert` (all MUI‑based) |
| **3.5 Auth helper** | `src/api/auth.ts` – login → store JWT in HttpOnly cookie (`axios` with `withCredentials:true`) |
| **3.6 Public inquiry form** (`/inquire`) – validation via **Yup** + **react‑hook‑form**, file upload supported, POST to `/api/inquiries` (no auth) |
| **3.7 Admin dashboard** (`/admin`) – protected via `RequireAuth` HOC (checks JWT & role) |
| **3.8 Inquiry list** – searchable, filterable, paginated table calling `/api/inquiries` |
| **3.9 Inquiry detail** – view contact info, notes timeline, reminders; status dropdown triggers PATCH |
| **3.10 Role‑based UI (updated)** – only **admin** sees the **User Management** menu. Normal sales users cannot view the user list at all (they only see inquiries they own according to hierarchy). |
| **3.11 CSV export button** – visible on the list view for users with permission (admin & sales managers) – calls `/api/inquiries/export` and triggers a download. |
| **3.12 Build script** – add to `package.json`:
```json
"scripts": {
  "prod": "npm run build && cp -r dist/* ../backend/public/"
}
``` |
| **3.13 Lint/format** – **removed** for now (can be added later). |

---

## 4️⃣ Integration & Testing (Day 1‑1.5 – ~3 h)
- **CORS**: `config/cors.php` allow `http://localhost:5173`.
- **JWT workflow**: Verify login → token → protected endpoints via Postman.
- **Policy verification**: Unit tests for `InquiryPolicy` (admin = all, sales = own hierarchy).
- **End‑to‑end flow**:
  1. Submit public inquiry → stored, email sent via Mailtrap.
  2. Admin logs in → sees **User Management**, can create/edit users, view all inquiries, export CSV.
  3. Sales manager logs in → sees only inquiries in their area, can export CSV of their own set.
- **Build & copy**: `npm run prod`; confirm files appear in `backend/public/` and are served.
- **Smoke test**: Open `http://localhost:8000` – dashboard loads, navigation works.
- **Basic tests** (optional, limited time): a few PHPUnit tests for API endpoints and a Jest test for the public form validation.

---

## 5️⃣ Documentation (Day 1.5‑2 – ~2 h)
- **README.md** (already created) contains:
  - Prerequisites (PHP 8.2+, Composer, Node 20, MySQL, Mailtrap)
  - Clone & setup steps for backend & frontend
  - `.env` variables (DB, JWT, Mailtrap, `FILESYSTEM_DRIVER`)
  - Commands to run dev servers, build production bundle, test API
  - Common troubleshooting (CORS, JWT, file upload limits)
- **API reference** (short section in README) listing the new CSV export endpoint and email notification flow.

---

## 6️⃣ Deliverables (End of Day 2)
1. Git repository with `backend/`, `frontend/`, and top‑level `README.md`.
2. Fully functional Laravel 12 API (JWT, role‑based policies, email notification, CSV export).
3. React admin UI (light theme, restricted **User Management** menu, inquiry list/detail, CSV export button).
4. Single‑command production build (`npm run prod`) that copies assets into `backend/public/`.
5. Developer setup guide (README).

---

## 7️⃣ Risks & Mitigations (within 48 h)
| Risk | Mitigation |
|------|------------|
| JWT not recognized | Use `tymon/jwt-auth` version compatible with Laravel 12; ensure `JWT_SECRET` is set. |
| Hierarchy logic errors | Keep hierarchy simple: `users.manager_id` points to direct manager; policies check `manager_id` chain. |
| CSV export large payload | Stream CSV response (`Response::streamDownload`) to avoid memory issues. |
| Email deliverability in dev | Use Mailtrap credentials supplied in `.env`. |
| Time crunch | Prioritize core features; optional UI polish can be added after the 2‑day MVP. |

---

## 8️⃣ Next Steps After MVP
- Add ESLint + Prettier configuration for code quality.
- Implement activity log and lead‑source tracking.
- Switch file storage to S3 by setting `FILESYSTEM_DRIVER=s3` and providing S3 env vars.
- Introduce Docker / CI pipelines for future automated deployments.

---

*You can now start cloning the repo and following the steps in the README to get the portal up and running locally.*
