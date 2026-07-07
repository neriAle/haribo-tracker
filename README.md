# Haribo Tracker

[![CI Build](https://img.shields.io/github/actions/workflow/status/neriAle/haribo-tracker/main.yml?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/neriAle/haribo-tracker/actions)
[![Coverage](https://img.shields.io/codecov/c/github/neriAle/haribo-tracker?style=for-the-badge&logo=codecov&logoColor=white)](https://codecov.io/gh/neriAle/haribo-tracker)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=for-the-badge)](https://gitmoji.dev)
[![Astro](https://img.shields.io/badge/Astro-0C0E14?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Turso](https://img.shields.io/badge/Turso-4FF8D2?style=for-the-badge&logo=sqlite&logoColor=black)](https://turso.tech/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

> A Progressive Web App (PWA) to track a personal collection of Haribo candy packets.

**[View Live Demo](https://haribo-tracker.neriale97.workers.dev)**

_(Note: The live demo is read-only. Write access is restricted via session cookies)._

---

## 📖 Overview

This project solves a specific user problem: preventing redundant purchases while browsing candy in-store by providing mobile access to a personal catalog.

Instead of relying on generic tracking apps, I built a custom PWA that feels like a native iOS app and requires zero ongoing hosting costs.

## 🏗 Architecture & Tech Stack

| Layer             | Choice               | Rationale                                                                                                         |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Framework**     | **Astro (SSR)**      | Handles the static shell and API routes at the edge.                                                              |
| **Interactivity** | **Vue.js 3**         | Used for specific UI elements (image croppers, filtering, rating) while keeping the rest of the page lightweight. |
| **Database**      | **Turso (LibSQL)**   | Edge-hosted SQLite. Provides low-latency queries and strict relational typing via `Drizzle ORM`.                  |
| **Storage**       | **Cloudflare R2**    | S3-compatible object storage for hosting WebP images via presigned URLs.                                          |
| **Hosting**       | **Cloudflare Pages** | Free edge hosting. Runs Astro API routes as Cloudflare Workers.                                                   |
| **Search**        | **Fuse.js**          | Client-side fuzzy search to handle typos without requiring a server round-trip.                                   |

## ✨ Key Features

- **PWA Integration:** Configured with an Apple Touch Icon, dynamic safe-area insets (`viewport-fit=cover`), and a `manifest.json`. Installs to the iOS Home Screen without Safari UI components.
- **Image Capture:** Uses `<input capture="environment">` to open the mobile camera. Integrates `cropperjs` to frame the packet, then converts the canvas to a compressed WebP blob for R2 upload.
- **Filtering & Search:** A dashboard that filters data based on categorical AND-logic, fuzzy text search, and advanced constraints (rating, date, location).
- **API & Auth:** A custom Astro middleware intercepts requests. `GET` requests are public, but `POST/PUT/DELETE` methods and UI routes require a verified session cookie. Payloads are validated via `Zod` before hitting the database.

## 🚀 Local Development

To run this project locally, you need Node.js 20+ and a Turso database instance.

### 1. Clone & Install

```sh
git clone https://github.com/neriAle/haribo-tracker.git
cd haribo-tracker
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory and populate it with your Turso and Cloudflare R2 credentials:

```ts
# Database (Turso)
TURSO_CONNECTION_URL="libsql://your-db-url.turso.io"
TURSO_AUTH_TOKEN="your_token"

# Storage (Cloudflare R2)
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="your-bucket-name"

# Auth
SESSION_SECRET="your_secure_password"
```

### 3. Database Push

Push the Drizzle schema to your SQLite database:

```sh
npm run db:push
```

### 4. Run Development Server

```sh
npm run dev
```

Navigate to `http://localhost:4321` to view the app.

## 🧪 Testing

This project uses `Vitest` for API endpoints and database mocking to ensure branch coverage on destructive actions (like orphaned image cleanup during a `DELETE` operation).

```sh
npm run test
```
