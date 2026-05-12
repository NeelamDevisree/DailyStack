# DailyStack (Angular + Node.js)

Gamified personal finance & habit tracker. Daily allowance + habit rewards/penalties = a real-time view of how you're actually spending and living.

Written using **Angular 19 + Node.js + SQLite**.

---

## What it does

- **Daily allowance** — set how much you plan to spend each day
- **Expenses** — log throughout the day; deducted from allowance
- **Habits** — mark done/missed; +50% reward or −200% penalty per habit
- **Dashboard** — live view of today's balance, daily savings, rewards, total savings, total expenses
- **Withdrawals** — take out savings (rewards depleted first)
- **Monthly reset** — review/update settings at the start of each month; previous month archived
- **CSV Export** — full current month expenses exported for ledger import
- **Multi-account** — each user signs up independently; completely isolated data
- **PWA** — installable on Android/iOS; runs like a native app

---

## Tech Stack

- **Frontend**: Angular 19 (standalone components, signals, new control flow)
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3) — zero-config, file-based
- **Auth**: JWT (bcrypt + jsonwebtoken)
- **PWA**: @angular/service-worker + web manifest
- **Styling**: CSS custom properties

---

## Project Structure

```
dailystack-angular/
├── server/                        ← Node.js backend
│   ├── src/
│   │   ├── index.js               ← Express entry point
│   │   ├── db.js                  ← SQLite init + schema
│   │   ├── auth.js                ← JWT helpers + middleware
│   │   └── routes/
│   │       ├── auth.js            ← signup / signin
│   │       ├── settings.js        ← daily allowance CRUD
│   │       ├── habits.js          ← habit CRUD + bulk ops
│   │       ├── habit-logs.js      ← habit log CRUD
│   │       ├── expenses.js        ← expense logging
│   │       ├── categories.js      ← custom categories
│   │       ├── withdrawals.js     ← savings withdrawals
│   │       ├── carry-over.js      ← carry-over balance
│   │       ├── month-setup.js     ← month initialization
│   │       └── archive.js         ← monthly snapshots
│   ├── package.json
│   └── .env.example
├── client/                        ← Angular frontend
│   ├── src/
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── styles.css             ← global styles + theme
│   │   └── app/
│   │       ├── app.component.ts
│   │       ├── app.config.ts
│   │       ├── app.routes.ts
│   │       ├── guards/            ← auth & guest guards
│   │       ├── interceptors/      ← JWT auth interceptor
│   │       ├── services/          ← AuthService, ApiService
│   │       ├── utils/             ← constants, formatters
│   │       └── pages/
│   │           ├── auth/          ← sign in / sign up
│   │           ├── onboarding/    ← allowance + habits setup
│   │           ├── shell/         ← nav shell + month setup modal
│   │           ├── dashboard/     ← stats, habits, expenses, modals
│   │           ├── expenses/      ← expense list + CSV export
│   │           ├── habits/        ← manage + history
│   │           └── archive/       ← previous months
│   ├── public/
│   │   └── manifest.webmanifest
│   ├── angular.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── ngsw-config.json
│   ├── proxy.conf.json
│   └── package.json
├── package.json                   ← root scripts
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/dailystack-angular.git
cd dailystack-angular
npm run install:all
```

This installs dependencies for both server and client.

---

### Step 2 — Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```
JWT_SECRET=your-strong-random-secret-here
PORT=3000
```

> **Important**: Change `JWT_SECRET` to a strong random string in production.

---

### Step 3 — Run locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm start
```

Open [http://localhost:4200](http://localhost:4200)

Sign up → set allowance → add habits → done.

> The Angular dev server proxies `/api/*` requests to `http://localhost:3000` via `proxy.conf.json`.

---

### Step 4 — Add PWA icons

You need two icon files in `client/public/` for the PWA install prompt to work:

- `client/public/icon-192.png` — 192×192px
- `client/public/icon-512.png` — 512×512px

Use [Favicon.io](https://favicon.io/favicon-generator/) or [RealFaviconGenerator](https://realfavicongenerator.net/) to generate them.

---

## Database

This version uses **SQLite** instead of Supabase. The database file (`dailystack.db`) is auto-created in the `server/` directory on first run. No external database setup needed.

The schema includes the same 9 tables as the original:
`users`, `settings`, `habits`, `habit_logs`, `expenses`, `custom_categories`, `withdrawals`, `carry_over`, `month_setup`, `monthly_archive`

All data is scoped per user via JWT authentication.

---

## Deployment Options

### Option A — Deploy on Render (free tier)

**Best for**: Simple deployment with free tier available.

#### 1. Build the Angular client

```bash
cd client
npm run build
```

This outputs to `client/dist/dailystack/browser/`.

#### 2. Serve static files from Express

Add static serving to your server. In `server/src/index.js`, add before the `app.listen()`:

```js
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve Angular build
app.use(express.static(path.join(__dirname, '../../client/dist/dailystack/browser')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../client/dist/dailystack/browser/index.html'));
  }
});
```

#### 3. Deploy to Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your repo
4. **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install`
5. **Start Command**: `cd server && npm start`
6. Add environment variable: `JWT_SECRET` = your secret
7. Deploy

---

### Option B — Deploy on Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Set root directory to the repo root
4. **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install`
5. **Start Command**: `cd server && npm start`
6. Add environment variable: `JWT_SECRET`
7. Railway auto-deploys on push

---

### Option C — Deploy on a VPS (DigitalOcean, AWS, etc.)

```bash
# On the server
git clone https://github.com/YOUR_USERNAME/dailystack-angular.git
cd dailystack-angular
npm run install:all
cd client && npm run build && cd ..

# Set environment variables
export JWT_SECRET=your-secret
export PORT=3000

# Start with a process manager
npm install -g pm2
cd server && pm2 start src/index.js --name dailystack

# Reverse proxy with nginx
# Point your domain to port 3000
```

---

### Option D — Deploy frontend + backend separately

**Frontend** → Vercel / Netlify / Cloudflare Pages
**Backend** → Render / Railway / Fly.io

Update the Angular `environment.ts` to point API calls to your backend URL instead of relative `/api/` paths.

---

## Install as a Mobile App (PWA)

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the **⋮** menu (top right)
3. Tap **"Add to Home screen"**
4. Confirm → it appears in your app tray
5. Opens full screen, no browser bars

### iOS (Safari)
1. Open the app URL in **Safari** (must be Safari, not Chrome on iOS)
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Confirm → it appears on your home screen

---

## Adding Multiple Accounts

DailyStack is multi-account by design. Each person:

1. Opens the same URL
2. Taps **Sign Up**
3. Enters their own email + password
4. Completes their own onboarding (allowance + habits)
5. All data is fully isolated — no one sees anyone else's

---

## Monthly Reset Flow

On the 1st of each month (or whenever the user first opens the app in a new month), a **Month Setup modal** appears automatically:

- Shows existing allowance and habits
- User can retain, edit, or delete
- User can add new habits (up to the 5-habit cap)
- On save: new `month_setup` record is created (won't show again), carry-over total is preserved

Previous month data is frozen and visible in the **Archive** tab.

---

## Habit Logic Reference

| Habit status | Effect |
|---|---|
| Done | +50% of daily allowance |
| Missed | −200% of daily allowance |
| Pending (past midnight) | Defaults to missed |
| Not scheduled today | Not shown |

Max 5 habits. Habits can repeat on specific days of the week.

---

## Allowance Change Lock

Daily allowance can only be changed **once every 14 days**. The Settings screen will show the next available change date if locked.

---

## CSV Export

In the **Expenses** tab, tap **Export CSV** to download all expenses from the 1st of the current month to today.

Columns: `Date, Time, Description, Category, Amount, Payment Mode`