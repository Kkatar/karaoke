# KaraokeHub 🎤

A complete, production-ready, highly aesthetic Karaoke Web Application built with **React, TypeScript, Vite, Tailwind CSS, Framer Motion, Express, PostgreSQL, and Prisma ORM**.

---

## ✨ Features

- **Modern Glassmorphism UI:** Spotify-inspired dark layout with rich typography (Outfit & Inter), emerald/green accents, and nature backdrop accents.
- **Synchronized LRC Lyrics Engine:** Scroll synchronized lyrics line-by-line, highlighting the active lyric with a beautiful green drop-shadow.
- **Interactive Lyrics Scrubbing:** Click any lyric line to instantly jump the audio track to that timestamp segment.
- **Resilient Upload system:** Multer upload support for audio (MP3) and background backdrops. Integrates with **Cloudinary** for production, with an automatic **Local Disk Fallback** (`/uploads`) for easy local development without credentials.
- **JWT Authentication & Security:** Custom sign-up, login, and forgot password flows. Encrypted password storage using `bcryptjs` and session tokens via JWT.
- **Admin Workspace:** Protected admin-only dashboard with song uploads (file upload OR direct URL paste), lyrics TIMING helpers, editing forms, and catalog deletion.

---

## 📁 Repository Directory Structure

```text
d:\song\
├── prisma/
│   ├── schema.prisma       # Prisma DB Schema (User & Song)
│   └── seed.ts             # Seed script for default admin, users, and 6 sample tracks
├── server/
│   ├── prisma.ts           # Prisma client singleton
│   ├── cloudinary.ts       # Multer middleware supporting Cloudinary & Local disk fallback
│   └── server.ts           # Express Backend with JWT auth & Song CRUD APIs
├── client/
│   ├── index.html          # HTML entry point (loads Outfit & Inter Google Fonts)
│   ├── vite.config.ts      # Vite config with proxy settings to backend
│   ├── tailwind.config.js  # Tailwind config with nature-themed colors
│   ├── postcss.config.js   # PostCSS configuration
│   ├── package.json        # Client dependencies (Framer Motion, Lucide icons, etc.)
│   └── src/
│       ├── main.tsx        # React mounting entry point
│       ├── index.css       # Tailwind + Custom glassmorphism, scrollbars, glowing active lyric styles
│       ├── types.ts        # TypeScript interface definitions
│       └── App.tsx         # Consolidated front-end router, contexts, forms, & karaoke engine
├── .env                    # Active local environment variables
├── .env.example            # Template for environment configurations
├── package.json            # Root configuration for monorepo and concurrent execution
└── tsconfig.json           # Backend/Seed typescript configurations
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
Run from the root directory to generate the Prisma client and install all backend + frontend packages:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
Ensure you update the database connection string to point to your running PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/karaokehub?schema=public"
```

### 3. Apply Schema Migrations
Deploy the tables to your PostgreSQL instance:
```bash
npx prisma migrate dev --name init
```

### 4. Seed sample hits
Populate the database with the default admin, user, and popular Hindi & English karaoke hits:
```bash
npm run db:seed
```
* **Default Admin Credentials:**
  * **Email:** `admin@karaokehub.com`
  * **Password:** `password123`
* **Default Regular User Credentials:**
  * **Email:** `john@karaokehub.com`
  * **Password:** `password123`

---

## 🏃 Running the Application

### Development Mode (Concurrent)
To start both the Express backend (`http://localhost:5000`) and Vite frontend (`http://localhost:5173`) concurrently, run:
```bash
npm run dev
```

### Production Build & Run
To compile and bundle both the backend typescript and frontend static build, then serve it directly from Express as a single unified service:
```bash
npm run build
npm start
```
The unified production app will run at `http://localhost:5000`.
