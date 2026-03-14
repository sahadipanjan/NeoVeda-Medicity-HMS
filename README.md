<div align="center">

<!-- HEADER BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f4c81,100:00b4d8&height=200&section=header&text=NeoVeda%20Medicity%20HMS&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Enterprise-Grade%20Hospital%20Management%20System&descAlignY=58&descSize=18&animation=fadeIn" />

<br/>

<!-- LIVE BADGE ROW -->
[![Live Demo](https://img.shields.io/badge/🏥%20Live%20Demo-neoveda--medicity--hms.vercel.app-00b4d8?style=for-the-badge&logoColor=white)](https://neoveda-medicity-hms.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-94.8%25-f59e0b?style=for-the-badge&logo=javascript&logoColor=white)](https://github.com/sahadipanjan/NeoVeda-Medicity-HMS)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RLS%20Secured-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

> **"Where clinical precision meets engineering excellence."**
> 
> NeoVeda Medicity HMS is a production-hardened, role-based Hospital Management System purpose-built for superspeciality medical environments — combining Row-Level Security, real-time OPD orchestration, and automated TPA cashless workflows into a single unified platform.

<br/>

---

</div>

## 🧭 Table of Contents

- [🌟 Overview](#-overview)
- [🏗️ System Architecture](#-system-architecture)
- [⚡ Core Features](#-core-features)
- [🛡️ Security Model](#-security-model)
- [🗂️ Project Structure](#-project-structure)
- [🧱 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Configuration](#-environment-configuration)
- [🗄️ Database Setup & Migrations](#-database-setup--migrations)
- [🔐 Role-Based Access Control](#-role-based-access-control)
- [📡 API Reference](#-api-reference)
- [🧪 CI/CD Pipeline](#-cicd-pipeline)
- [🗺️ Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

**NeoVeda Medicity HMS** is a full-stack, enterprise-grade Hospital Management System engineered from the ground up for the operational complexity of superspeciality hospitals. It replaces fragile, siloed legacy systems with a cohesive, secure, and real-time architecture that covers the entire patient journey — from OPD registration to TPA cashless discharge.

### Why NeoVeda?

| Pain Point in Legacy HMS | NeoVeda Solution |
|---|---|
| Role leakage & unauthorized data access | PostgreSQL Row-Level Security (RLS) enforced at DB layer |
| OPD chaos & long patient queues | Real-time queue engine with live token broadcasting |
| Paper-based EMR with no traceability | Structured EMR with full audit trail |
| Manual TPA insurance processing | Automated cashless workflow with TPA gateway integration |
| No central role management | Granular RBAC covering 10+ hospital roles |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   React SPA  ──  Role-Aware UI  ──  Real-Time WebSocket Client  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────▼────────────────────────────────────┐
│                        SERVER LAYER                             │
│   Node.js / Express  ──  JWT Auth  ──  WebSocket Server         │
│   REST API  ──  Business Logic  ──  Queue Engine                │
└────────────────────────────┬────────────────────────────────────┘
                             │ Connection Pooling
┌────────────────────────────▼────────────────────────────────────┐
│                      DATABASE LAYER                             │
│   PostgreSQL  ──  Row-Level Security (RLS)  ──  Migrations      │
│   Audit Logs  ──  EMR Tables  ──  Billing Schema                │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
│   TPA Gateway  ──  Insurance APIs  ──  Email / SMS Notifs       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Patient Registration → Cashless Discharge

```
Patient Arrival
      │
      ▼
 OPD Registration ──► Token Generated ──► Real-Time Queue Broadcast
      │
      ▼
 Doctor Consultation ──► EMR Entry (Diagnosis, Rx, Vitals)
      │
      ▼
 Admission Decision
      ├── OPD ──► Prescription & Billing ──► OPD Discharge
      └── IPD ──► Ward Assignment ──► Nursing Notes ──► Investigation Orders
                      │
                      ▼
               TPA Pre-Authorization Request
                      │
                      ▼
               Cashless Approval Workflow
                      │
                      ▼
               Final Bill Generation ──► TPA Claim Submission ──► IPD Discharge
```

---

## ⚡ Core Features

### 🏥 OPD & Queue Management
- **Real-time token engine** — patients receive live queue updates via WebSocket; no polling, no lag.
- Multi-doctor, multi-department queue orchestration.
- Priority escalation for emergency/critical patients.
- OPD session scheduling with doctor availability windows.

### 📋 Electronic Medical Records (EMR)
- Structured SOAP-format consultation notes.
- Prescription builder with drug database lookup.
- Vital signs trending with historical charts.
- Investigation order management (lab, radiology).
- Complete, immutable audit trail on every record change.

### 💳 TPA & Cashless Billing
- Automated pre-authorization request generation for empanelled TPAs.
- Cashless approval/rejection workflow with document uploads.
- Final bill computation with TPA deduction logic.
- Co-pay calculation and patient liability summary.
- Claim submission package bundling.

### 👥 Role-Based User Management
- Granular access for **10+ hospital roles**: Super Admin, Doctor, Nurse, Receptionist, Billing Executive, Lab Technician, Pharmacist, Ward Boy, TPA Coordinator, Audit Officer.
- Every role sees only the data it's authorized to access — enforced at the database layer via PostgreSQL RLS, not just the UI.

### 🧾 IPD Management
- Ward, room, and bed allocation engine.
- Nursing care notes and shift-wise observations.
- Diet orders and nursing station task board.
- Discharge summary generation.

### 📊 Reports & Analytics
- Daily OPD/IPD census.
- Revenue analytics by department, doctor, and payer.
- TPA claim status dashboard.
- Patient demographics and disease burden reports.

---

## 🛡️ Security Model

NeoVeda implements a **defense-in-depth** approach to data security:

```
┌────────────────────────────────────────┐
│         Application Layer             │
│   JWT Tokens  ·  Role Middleware       │
│   Input Validation  ·  Rate Limiting   │
├────────────────────────────────────────┤
│           API Layer                   │
│   Route Guards  ·  Permission Checks  │
│   Audit Logging on Mutations          │
├────────────────────────────────────────┤
│         Database Layer (RLS)          │
│   Per-Role Security Policies on       │
│   Every Sensitive Table               │
│   No role can bypass via raw SQL      │
└────────────────────────────────────────┘
```

**PostgreSQL Row-Level Security (RLS)** ensures that even a compromised application connection cannot leak cross-patient or cross-department data. Each database session is bound to the authenticated user's role context, making NeoVeda HIPAA-alignment ready by architecture.

---

## 🗂️ Project Structure

```
NeoVeda-Medicity-HMS/
│
├── .github/
│   └── workflows/            # CI/CD GitHub Actions pipelines
│
├── client/                   # React frontend (SPA)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level page components
│   │   ├── contexts/         # React context (Auth, Queue, Theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client & WebSocket service
│   │   └── utils/            # Helpers & formatters
│   └── public/
│
├── server/                   # Node.js / Express backend
│   ├── routes/               # API route definitions
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth, role guards, validators
│   ├── services/             # Queue engine, TPA service, EMR
│   ├── websocket/            # Real-time WebSocket server
│   └── config/               # DB pool, env config
│
├── database/
│   └── migrations/           # Versioned PostgreSQL migrations
│       ├── 001_init_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_emr_tables.sql
│       └── ...
│
├── docs/                     # Architecture diagrams & API docs
├── .eslintrc.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🧱 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React** | Component-based UI framework |
| **WebSocket API** | Real-time OPD queue updates |
| **CSS Modules / Custom CSS** | Scoped, maintainable styling |
| **Axios** | HTTP client for REST API |
| **React Router** | Client-side navigation |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Server runtime |
| **Express.js** | REST API framework |
| **ws / Socket.io** | WebSocket server for real-time queue |
| **JWT** | Stateless authentication |
| **bcrypt** | Password hashing |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
| **Row-Level Security (RLS)** | Data isolation by role/user |
| **Versioned Migrations** | Schema version control |
| **pg / node-postgres** | Database driver |

### DevOps & Infrastructure
| Technology | Purpose |
|---|---|
| **GitHub Actions** | CI/CD automation |
| **Vercel** | Frontend deployment |
| **ESLint** | Code quality enforcement |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** `>= 18.x`
- **npm** `>= 9.x`
- **PostgreSQL** `>= 14.x`
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/sahadipanjan/NeoVeda-Medicity-HMS.git
cd NeoVeda-Medicity-HMS
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

Copy the example env files and fill in your values (see [Environment Configuration](#-environment-configuration)):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 4. Initialize the Database

```bash
# Run all migrations in order
cd database/migrations
psql -U your_db_user -d your_db_name -f 001_init_schema.sql
psql -U your_db_user -d your_db_name -f 002_rls_policies.sql
# ... continue for each migration file
```

### 5. Start the Application

```bash
# Start the backend server (from /server)
npm run dev

# Start the frontend client (from /client)
npm start
```

The application will be available at `http://localhost:3000`.

---

## ⚙️ Environment Configuration

### Server (`server/.env`)

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neoveda_hms
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=8h

# WebSocket
WS_PORT=5001

# TPA Integration (optional)
TPA_API_BASE_URL=https://api.your-tpa-gateway.com
TPA_API_KEY=your_tpa_api_key
```

### Client (`client/.env`)

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5001
```

---

## 🗄️ Database Setup & Migrations

NeoVeda uses **versioned SQL migrations** for full schema reproducibility. Migrations are located in `database/migrations/` and should be applied in ascending numerical order.

```
migrations/
├── 001_init_schema.sql       # Core tables: patients, users, appointments
├── 002_rls_policies.sql      # PostgreSQL RLS policy definitions
├── 003_emr_tables.sql        # EMR: consultations, prescriptions, vitals
├── 004_billing_schema.sql    # Billing, TPA claims, co-pay
├── 005_ipd_schema.sql        # Ward, bed, nursing notes
└── 006_audit_log.sql         # Immutable audit trail
```

> **Important**: Always apply migrations sequentially. Never modify an already-applied migration — create a new one instead.

---

## 🔐 Role-Based Access Control

NeoVeda implements a two-tier RBAC system:

**Tier 1 — Application Layer**: Express middleware validates JWT claims and restricts route access per role before any query runs.

**Tier 2 — Database Layer**: PostgreSQL RLS policies are configured so that database sessions operating under a given role context can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows they are authorized for — regardless of the SQL query submitted.

| Role | Capabilities |
|---|---|
| `super_admin` | Full system access, user management, audit reports |
| `doctor` | Own patient consultations, EMR write, prescription |
| `nurse` | IPD nursing notes, vitals entry, task board |
| `receptionist` | OPD registration, appointment scheduling, queue |
| `billing_executive` | Bill generation, payment recording, invoices |
| `lab_technician` | Lab order results entry |
| `pharmacist` | Prescription dispensing, inventory |
| `tpa_coordinator` | Pre-auth requests, claim management |
| `ward_manager` | Bed allocation, ward census |
| `audit_officer` | Read-only access to audit logs |

---

## 📡 API Reference

All API endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate user, receive JWT |
| `POST` | `/auth/logout` | Invalidate session |
| `GET` | `/auth/me` | Fetch authenticated user profile |

### OPD & Queue
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/opd/register` | Register new OPD patient |
| `GET` | `/opd/queue/:departmentId` | Get live queue for a department |
| `PATCH` | `/opd/queue/:tokenId/next` | Advance queue to next patient |
| `GET` | `/opd/appointments` | List scheduled appointments |

### EMR
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/emr/consultation` | Create new consultation record |
| `GET` | `/emr/patient/:patientId` | Fetch full EMR history |
| `POST` | `/emr/prescription` | Add prescription to consultation |
| `POST` | `/emr/vitals` | Record patient vitals |

### Billing & TPA
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/billing/generate` | Generate patient bill |
| `POST` | `/tpa/preauth` | Submit TPA pre-authorization |
| `GET` | `/tpa/claims` | List all TPA claims |
| `PATCH` | `/tpa/claims/:claimId` | Update claim status |

> Full Swagger/OpenAPI documentation is available in the `/docs` directory.

---

## 🧪 CI/CD Pipeline

NeoVeda ships with a GitHub Actions CI/CD pipeline (`.github/workflows/`) that runs automatically on every push and pull request:

```
Push / PR to main
       │
       ▼
  ┌─────────────┐
  │   Lint      │  ESLint checks on client & server
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Build     │  Production build of React client
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Test      │  Unit & integration tests
  └──────┬──────┘
         │ (on merge to main)
         ▼
  ┌─────────────┐
  │   Deploy    │  Auto-deploy to Vercel
  └─────────────┘
```

---

## 🗺️ Roadmap

- [x] Role-based authentication with JWT
- [x] PostgreSQL RLS enforcement
- [x] Real-time OPD queue with WebSocket
- [x] EMR — consultation, prescription, vitals
- [x] TPA cashless billing workflow
- [x] IPD ward & bed management
- [ ] 📱 Progressive Web App (PWA) support
- [ ] 🔔 Push notifications for queue & approvals
- [ ] 📊 Advanced analytics dashboard with drill-down
- [ ] 🤖 AI-assisted diagnosis suggestions (LLM integration)
- [ ] 🧾 HL7 FHIR compliance layer
- [ ] 📷 DICOM viewer integration for radiology
- [ ] 🌐 Multi-facility / hospital chain support
- [ ] 📦 Dockerized deployment with `docker-compose`

---

## 🤝 Contributing

Contributions are what make open-source extraordinary. Any contribution you make is **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open a Pull Request** — describe what you changed and why

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages and ensure your code passes ESLint before submitting a PR.

### Reporting Bugs

Open an [issue](https://github.com/sahadipanjan/NeoVeda-Medicity-HMS/issues) with the `bug` label. Include steps to reproduce, expected behavior, and screenshots if applicable.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

---

<div align="center">

**Built with ❤️ by [Dipanjan Saha](https://github.com/sahadipanjan) and [Srijita Das](https://github.com/Srijita2005)**

*Engineered for healthcare. Designed for developers.*

[![GitHub](https://img.shields.io/badge/GitHub-sahadipanjan-181717?style=for-the-badge&logo=github)](https://github.com/sahadipanjan)
[![Live Demo](https://img.shields.io/badge/🔗%20Live-neoveda--medicity--hms.vercel.app-00b4d8?style=for-the-badge)](https://neoveda-medicity-hms.vercel.app)

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:00b4d8,100:0f4c81&height=100&section=footer" />

</div>
