# Inquiry Management Portal

On-premise portal for public inquiries and a role-based staff workspace. Laravel 12 serves the API and, after a production build, the React app. React 18 (Vite) is the staff UI.

## Prerequisites

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`
- Composer
- Node.js 20+
- MySQL 8
- Optional: a [Mailtrap](https://mailtrap.io) inbox for email delivery

## Setup

```bash
cd backend
composer install
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate
php artisan jwt:secret
```

That copy command works in Windows Command Prompt, PowerShell, and bash.

Create the database, then set these values in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | Signing key from `php artisan jwt:secret` |
| `FILESYSTEM_DISK` / `FILESYSTEM_DRIVER` | `local` for on-premise files. Set `s3` later with the AWS variables. |
| `MAIL_MAILER` | `log` writes mail to the Laravel log. Set `smtp` to deliver through Mailtrap. |
| `MAIL_HOST` | `sandbox.smtp.mailtrap.io` |
| `MAIL_PORT` | `2525` |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Mailtrap SMTP credentials |
| `INQUIRY_NOTIFY_EMAIL` | Address that receives a message when a public inquiry is submitted |
| `CORS_ALLOWED_ORIGINS` | `http://127.0.0.1:5173,http://localhost:5173` |

```bash
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

In a second terminal, from `backend/`:

```bash
php artisan queue:work
```

That worker sends the queued new-inquiry email after the form response has already returned.

In a third terminal:

```bash
cd frontend
npm ci
npm run dev
```

- Staff app: http://127.0.0.1:5173/login
- Public form: http://127.0.0.1:5173/inquire
- API: http://127.0.0.1:8000/api

On Windows, open the `127.0.0.1` addresses. `localhost` often resolves to IPv6 while PHP listens on IPv4, and the login cookie then never reaches the API. In `php.ini`, enable `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, and `curl`, and set `upload_max_filesize` and `post_max_size` above `10M`.

Seeded accounts all use the password `password`:

| Email | Role | Sees |
| --- | --- | --- |
| admin@example.com | Admin | Every inquiry, user management, CSV export |
| manager@example.com | Sales manager | Own inquiries and direct reports, CSV export |
| sales@example.com | Sales | Only inquiries assigned to them |
| sales2@example.com | Sales | Only inquiries assigned to them |

## Production build

From `frontend/`:

```bash
npm run prod
```

That builds the React app and copies it into `backend/public/`. Then `php artisan serve --host=127.0.0.1 --port=8000` (or the web server document root `backend/public`) serves the UI at http://127.0.0.1:8000.

## Another computer

These steps build a working portal. They do not copy the database from the machine where the project was packed.

- Create empty MySQL databases named `inquiry_management` and, before tests, `inquiry_management_testing`. Put the Windows MySQL user and password in `backend/.env`. The database login from the original machine is not in the project zip.
- `key:generate` and `jwt:secret` create new keys. That is expected.
- `migrate --seed` creates the four demo accounts and a few sample inquiries. It does not restore the large stress-test set, notes, comments, or uploaded files from the original database.
- Mail stays in `backend/storage/logs/laravel.log` until `MAIL_MAILER=smtp` and the Mailtrap username and password are set. `php artisan queue:work` still has to be running.

## API

Public:

- `POST /api/inquiries` — create an inquiry. Optional file field `attachment` (pdf, jpg, png, doc, docx, txt, 10 MB).
- `GET /api/lead-sources`
- `POST /api/login` — sets an HttpOnly `token` cookie.

Authenticated (`auth:api`, cookie or `Authorization: Bearer`):

- `GET /api/me`, `POST /api/logout`
- `GET /api/inquiries` — search (`search`), filter (`status`, `assigned_to`), paginated
- `GET /api/inquiries/stats`
- `GET /api/inquiries/{id}`
- `PATCH /api/inquiries/{id}` — `status`, `assigned_to`
- `POST /api/inquiries/{id}/notes`
- `POST /api/inquiries/{id}/reminders`
- `PATCH /api/reminders/{id}`
- `GET /api/inquiries/{id}/attachments/{attachment}`
- `GET /api/inquiries/export` — CSV of the same filters. Admin and sales managers only. The response is streamed.
- `GET /api/team` — users the caller may assign work to
- `GET|POST /api/users`, `PATCH|DELETE /api/users/{id}` — admin only

Submitting an inquiry dispatches `InquiryCreated`. The email listener is queued, so the form response returns without waiting on SMTP. Run `php artisan queue:work` beside `php artisan serve` to deliver those jobs. The message goes to `INQUIRY_NOTIFY_EMAIL`. With `MAIL_MAILER=log` it is written to `backend/storage/logs/laravel.log`. Set `MAIL_MAILER=smtp` and the Mailtrap username and password to send it to Mailtrap. A mail failure is logged and does not roll back the inquiry.

Access rules:

- Admins see every inquiry, including unassigned ones.
- Other users see inquiries assigned to themselves or to people who report to them through `users.manager_id`.
- Only admins see User Management.

## Tests

```bash
cd backend
php artisan test
```

PHPUnit uses the MySQL database `inquiry_management_testing` on the same host and user as `.env`. Create that database before running tests. It is migrated fresh on each run and is separate from the app database.

## Troubleshooting

- **CORS / cookies.** The dev UI calls `/api` through the Vite proxy, so open http://127.0.0.1:5173. Direct calls from another origin need that origin in `CORS_ALLOWED_ORIGINS` and `withCredentials`.
- **401 after login.** Confirm `JWT_SECRET` is set and the `token` cookie is being sent.
- **Upload fails.** Raise `upload_max_filesize` and `post_max_size` in `php.ini` above 10 MB.
- **Mail not received.** `MAIL_MAILER=log` never leaves the machine. Check the log, or set Mailtrap SMTP credentials and `MAIL_MAILER=smtp`. The notification is queued, so `php artisan queue:work` must be running.
