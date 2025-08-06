# BoilerResources

A full‑stack MERN platform for Purdue students to **discover, organize, and share class resources**. BoilerResources combines course management, collaborative study tools, and calendar integrations to streamline your academic workflow.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Scripts & Tooling](#scripts--tooling)
8. [Deployment Guide](#deployment-guide)
9. [API Reference](#api-reference)
10. [Contributing](#contributing)
11. [License](#license)

---

## Features

| Domain                  | Highlights                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**      | • Email + password with JWT<br>• Google OAuth 2.0 via Passport<br>• Secure, HttpOnly cookie sessions                                           |
| **Class Management**    | • Search & add Purdue classes<br>• Store credits, professor, description<br>• Click‑through to a dedicated *Class Details* page                |
| **Resource Hub**        | • Upload links / PDFs / videos<br>• Up‑/down‑vote & threaded comments<br>• Report inappropriate content                                        |
| **Study Groups & Chat** | • Public or private groups per class<br>• Real‑time messaging via Socket.io<br>• Join‑request notifications, pagination                        |
| **Calendar**            | • React‑Big‑Calendar UI<br>• Add *Class* and *Exam* events with distinct forms<br>• One‑click export to Google Calendar (on‑demand OAuth flow) |
| **Task Planner**        | • Create tasks with priority & due date<br>• Drag‑and‑drop between *Active* and *Completed* sections                                           |
| **Email Notifications** | • Nodemailer driver<br>• Opt‑in alerts for new messages, resource approvals, upcoming exams                                                    |
| **Dark Mode**           | • Tailwind CSS + custom font support                                                                                                           |

---

## Tech Stack

* **Frontend:** React 18 · Vite · Tailwind CSS · React‑Big‑Calendar · Axios · Socket.io‑client
* **Backend:** Node.js · Express 5 · MongoDB + Mongoose · Passport · JWT · Socket.io
* **DevOps:** ESLint + Prettier · Husky · Jest · Supertest · Concurrently · Render / Netlify CI

---

## Architecture

```text
┌───────────┐        WebSocket        ┌─────────────┐
│  Client   │  ───────────────────▶  │   Chat       │
│ (React)   │                       │ Socket.io   │
│           │  REST/HTTP            │  Namespace  │
└───────────┘  ◀───────────────────  └─────────────┘
     ▲   ▲                                 ▲
     │   │                                 │
     │   │                             MongoDB Atlas
     │   │                                (Data)
     │   └─────── Google OAuth ────────────┘
     │
Render / Netlify (CI/CD)
```

*Single‑repo* layout with separate **frontend** and **backend** directories. The client is served in production as static assets by Express.

---

## Project Structure

```
boilerresources/
├── backend/
│   ├── server.js            # Entry – sets up Express, sessions, Socket.io
│   ├── models/              # Mongoose schemas (User, Course, Message, Task…)  
│   ├── routes/              # Versioned REST endpoints
│   │   ├── auth.js          # /api/auth/*
│   │   ├── calendar.js      # /api/calendar/*
│   │   ├── messages.js      # /api/messages/*
│   │   └── …
│   ├── config/
│   │   └── passport.js      # Google strategy & JWT helpers
│   └── chatSocket.js        # Socket.io handlers
├── frontend/
│   ├── src/
│   │   ├── components/      # Re‑usable UI pieces
│   │   ├── pages/           # Route‑level views (Home, ClassDetails…)
│   │   ├── hooks/           # Custom hooks (useAuth, useSocket, …)
│   │   ├── api/             # Axios wrappers
│   │   └── App.jsx
│   └── tailwind.config.js
└── README.md
```

---

## Getting Started

### Prerequisites

* Node >= 18
* MongoDB 6 (local or Atlas)
* A Google Cloud project with OAuth 2.0 Client ID

### 1. Clone & Install

```bash
git clone https://github.com/<YOUR‑ORG>/boilerresources.git
cd boilerresources
npm run setup      # installs client & server deps via workspaces
```

### 2. Configure Environment

Create **backend/.env** and **frontend/.env** (see [Environment Variables](#environment-variables)).

### 3. Run Locally

```bash
npm run dev        # concurrently: Vite on :3000 & Express on :5001
```

Visit [http://localhost:3000](http://localhost:3000) → sign up → add classes → explore!

---

## Environment Variables

### `backend/.env` (example)

```
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/boilerresources
SESSION_SECRET=supersecretcats
JWT_SECRET=evenmoresecretcats
GOOGLE_CLIENT_ID=<your‑client‑id>
GOOGLE_CLIENT_SECRET=<your‑client‑secret>
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=<gmail‑user>
EMAIL_PASS=<app‑password>
```

### `frontend/.env`

```
VITE_API_URL=http://localhost:5001
```

---

## Scripts & Tooling

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Run backend & frontend in dev mode with hot reload |
| `npm run lint`  | ESLint + Prettier check                            |
| `npm test`      | Jest + Supertest unit & API tests                  |
| `npm run seed`  | Seed sample courses/resources (backend script)     |
| `npm run build` | Production build of client & start server          |

Husky pre‑commit hooks ensure code is formatted & linted before every commit.

---

## Deployment Guide

### Render (Backend)

1. **Create a Web Service** → Specify `backend/server.js` as start command.
2. Add environment vars from `backend/.env`.
3. Enable automatic deploys from `main`.

### Netlify (Frontend)

1. **New Site → Import from Git**.
2. Build command: `npm run build --workspace frontend`.
3. Publish directory: `frontend/dist`.
4. Add `VITE_API_URL` pointing to your Render URL.

> **Tip:** Use a custom domain and enforce HTTPS for secure cookies.

---

## API Reference

REST endpoints are prefixed with `/api`. All protected routes expect the `Authorization: Bearer <token>` header (or session cookie for Google users).

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| `POST` | `/auth/register`          | Create user account       |
| `POST` | `/auth/login`             | Email/password login      |
| `GET`  | `/auth/google`            | Start Google OAuth flow   |
| `GET`  | `/classes`                | Fetch all courses         |
| `POST` | `/classes`                | Add new course (admin)    |
| `GET`  | `/calendar/:userId`       | All events for user       |
| `POST` | `/calendar`               | Create event (class/exam) |
| `POST` | `/calendar/google/export` | Export to Google Calendar |
| `GET`  | `/messages/:groupId`      | Paginated chat history    |
| `POST` | `/messages`               | Send message              |
| …      | …                         | …                         |

Full Swagger docs live at `/api/docs` in dev mode.

---

## Contributing

1. **Fork** the repo & create a feature branch (`git checkout -b feat/<name>`)
2. Follow the ESLint/Prettier rules – CI will fail otherwise.
3. Write unit tests for new functionality.
4. Submit a PR ⇢ fill out the PR template.

### Commit Convention (Conventional Commits)

`<type>(scope): <subject>` – e.g. `feat(auth): add password reset`

| Type       | Purpose               |
| ---------- | --------------------- |
| `feat`     | New feature           |
| `fix`      | Bug fix               |
| `docs`     | README or docs only   |
| `refactor` | Code refactor/cleanup |
| `test`     | Adding tests          |



> BoilerResources is a  project built by Arya Shukla, Suhesh Venkatesh, Pranavi Chaganti, and Zain Sohail.
