# 🚀 Enterprise Inquiry & Lead Management Portal

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

A modern, full-stack, enterprise-grade **Inquiry and Lead Management Solution** designed for high-concurrency sales teams. Built with a high-performance **Laravel 12 REST API** backend and a responsive, dynamic **React 18 + Vite + Material UI (MUI)** SPA frontend.

---

## ✨ Key Features

- **⚡ Automated Smart Lead Assignment**: Features a dynamic *Least-Loaded Round-Robin* auto-assignment algorithm that automatically routes incoming inquiries to the sales representative with the lowest active workload.
- **🔐 Secure Role-Based Access Control (RBAC)**: Multi-level hierarchy supporting **Admin**, **Sales Manager**, and **Sales Executive** roles.
  - *Admins*: Full platform control, user management, global analytics, and raw CSV exports.
  - *Sales Managers*: Access inquiries assigned to themselves and their recursive direct reports via `manager_id` tree structures.
  - *Sales Executives*: Isolated view restricted strictly to their assigned inquiries.
- **🛡️ Custom Admin Approval Middleware**: High-security account workflow ensuring new staff accounts require admin approval (`is_approved`) before accessing sensitive lead data.
- **🔐 JWT Authentication via HttpOnly Cookies**: Enterprise security standard preventing XSS script theft by storing JWT tokens inside secure HttpOnly cookies.
- **📊 Real-Time Analytics & Live Dashboard**: Dynamic metric widgets computing status breakdowns, lead conversion rates, and workload distributions.
- **📤 High-Performance Streamed CSV Export**: Memory-efficient CSV exports built with Laravel `Response::streamDownload()` and Eloquent `cursor()` chunking for millions of records without memory spikes.
- **🛡️ Signed URL Security for File Attachments**: Temporary HMAC-signed URL access control (`EnsureSignedAccess`) protecting customer attachments (PDF, DOCX, images) against direct path guessing.
- **⚡ Async Mail & Queue Processing**: Decoupled submission lifecycle using Laravel Queues and Event Listeners (`InquiryCreated`), keeping public form responses under <100ms.
- **🔍 Advanced Search & Filter Engine**: Instant multi-attribute search across lead names, emails, phones, services, lead sources, date ranges, and status states.
- **📜 Audit Trails & Reminders**: Complete activity log recording all assignment changes, status updates, internal notes, and follow-up reminders.

---

## 🛠️ Tech Stack & Architecture

### Backend
- **Framework**: Laravel 12
- **Language**: PHP 8.2+
- **Database**: MySQL 8.0 / MariaDB
- **Auth**: `php-open-source-saver/jwt-auth` (HttpOnly Cookie Auth)
- **Testing**: PHPUnit 11 (19 Feature & Unit Tests, 100+ Assertions)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **UI Framework**: Material UI (MUI v5), Lucide React Icons
- **State & Router**: React Router v6, Axios with automatic cookie credential passing

---

## 🚀 Quick Start Guide

### Prerequisites
- PHP >= 8.2 with extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `fileinfo`, `curl`
- Composer 2.x
- Node.js >= 20.x & npm
- MySQL 8.0+

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Environment setup
php -r "file_exists('.env') || copy('.env.example', '.env');"

# Generate application key and JWT secret
php artisan key:generate
php artisan jwt:secret
```

Create a MySQL database named `inquiry_management`, then update `backend/.env`:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inquiry_management
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_jwt_secret_here
FILESYSTEM_DISK=local
MAIL_MAILER=log
INQUIRY_NOTIFY_EMAIL=admin@example.com
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

Run database migrations and seed default administrative data:

```bash
php artisan migrate --seed
```

Start the API development server and queue worker:

```bash
# Terminal 1: Serve API
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2: Run Queue Worker for Async Notifications
php artisan queue:work
```

---

### 2. Frontend Setup

In a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm ci

# Start Vite dev server
npm run dev
```

- **Staff Portal**: [http://127.0.0.1:5173/login](http://127.0.0.1:5173/login)
- **Public Inquiry Form**: [http://127.0.0.1:5173/inquire](http://127.0.0.1:5173/inquire)
- **Backend API**: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

---

## 🔑 Pre-Seeded Test Credentials

All pre-seeded demo accounts use the password: `password`

| Role | Email | Permissions & Scope |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | Full system access, all inquiries, user management, full CSV export |
| **Sales Manager** | `manager@example.com` | Access to inquiries assigned to self & direct sales team reports |
| **Sales Executive 1** | `sales@example.com` | Restricted to self-assigned leads |
| **Sales Executive 2** | `sales2@example.com` | Restricted to self-assigned leads |

---

## 📡 API Reference Overview

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inquiries` | Submit public lead inquiry (supports file uploads up to 10MB) |
| `GET` | `/api/lead-sources` | Fetch active lead generation channels |
| `POST` | `/api/login` | Authenticate staff & issue HttpOnly JWT cookie |

### Authenticated Endpoints (`auth:api`)
| Method | Endpoint | Description | Role Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/me` | Fetch authenticated user profile | All |
| `POST` | `/api/logout` | Revoke session & clear auth cookie | All |
| `GET` | `/api/inquiries` | Paginated inquiries with search & filter parameters | RBAC Scoped |
| `GET` | `/api/inquiries/stats` | Dashboard aggregated analytics & counts | RBAC Scoped |
| `GET` | `/api/inquiries/{id}` | Detailed inquiry payload & activity timeline | RBAC Scoped |
| `PATCH` | `/api/inquiries/{id}` | Update inquiry status or reassign executive | Assigned / Manager / Admin |
| `POST` | `/api/inquiries/{id}/notes` | Add internal collaboration note | Assigned / Manager / Admin |
| `GET` | `/api/inquiries/export` | Streamed low-memory CSV export | Admin & Manager |
| `GET` | `/api/users` | List staff accounts & hierarchy | Admin Only |
| `POST` | `/api/users` | Create staff account with assigned role | Admin Only |
| `PATCH` | `/api/users/{id}` | Update staff permissions / approve account | Admin Only |

---

## 🧪 Automated Testing

The repository contains an automated PHPUnit suite covering API contracts, RBAC isolation, round-robin auto-assignment logic, and queue events.

```bash
# Create dedicated testing database
mysql -e "CREATE DATABASE IF NOT EXISTS inquiry_management_testing;"

# Run full backend test suite
cd backend
php artisan test
```

**Test Summary**: 19 tests, 101 assertions passing (100% success rate).

---

## 📦 Production Deployment Build

To compile the React frontend single-page app directly into Laravel's public asset folder:

```bash
cd frontend
npm run prod
```

This generates optimized static production assets inside `backend/public/`. The entire web portal can then be served directly via `php artisan serve` or NGINX / Apache document root.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

