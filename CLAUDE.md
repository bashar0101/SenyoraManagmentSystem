# CLAUDE.md — Company Management System

## Project Overview

A full-stack company management system with role-based access (Manager / Employee), QR-code-based attendance tracking, working hours calculation, salary reporting, and PDF export. Built with Node.js/Express (backend), React (frontend), and MongoDB (database). Deployed on **Vercel** (frontend) and **Render** (backend).

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router v6, Axios, TailwindCSS, React-QR components |
| Backend   | Node.js 20+, Express 5                  |
| Database  | MongoDB Atlas (free tier), Mongoose 8   |
| Auth      | JWT (no expiry — persistent until logout) |
| PDF Export| PDFKit or `pdf-lib` (backend-generated) |
| QR Codes  | `qrcode` (npm) for generation, `html5-qrcode` (frontend) for scanning |
| Deployment| Vercel (frontend), Render (backend)     |

---

## Repository Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verify middleware
│   │   ├── models/
│   │   │   ├── User.js            # Employee & Manager model
│   │   │   └── AttendanceRecord.js
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /api/auth/login, /logout
│   │   │   ├── qr.js              # GET /api/qr/current, POST /api/qr/scan
│   │   │   ├── attendance.js      # GET /api/attendance (manager/employee)
│   │   │   └── export.js          # GET /api/export/pdf
│   │   ├── controllers/           # Business logic (mirrors routes)
│   │   ├── utils/
│   │   │   ├── qrManager.js       # In-memory QR token state
│   │   │   └── pdfGenerator.js
│   │   └── index.js               # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance with base URL + JWT header
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state, login/logout, role
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── components/
│   │   │   ├── QRDisplay.jsx      # Shows QR code (manager device)
│   │   │   ├── QRScanner.jsx      # Scans QR code (employee)
│   │   │   ├── AttendanceTable.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
└── CLAUDE.md
```

---

## Environment Variables

### Backend — `backend/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/company-mgmt
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=https://your-app.vercel.app
```

### Frontend — `frontend/.env`
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

> **Never commit `.env` files.** Use `.env.example` with placeholder values.

---

## Data Models

### `User`
```js
{
  name: String,
  email: String,           // unique
  passwordHash: String,
  role: { type: String, enum: ['manager', 'employee'] },
  hourlyRate: Number,      // used for daily salary calculation
  createdAt: Date
}
```

### `AttendanceRecord`
```js
{
  employee: { type: ObjectId, ref: 'User' },
  date: String,            // 'YYYY-MM-DD'
  startTime: Date,
  endTime: Date,           // null until check-out scan
  totalHours: Number,      // calculated on endTime scan
  dailySalary: Number,     // totalHours * employee.hourlyRate
  status: { type: String, enum: ['active', 'completed'] }
}
```

---

## Authentication

- **JWT with no expiry** (`expiresIn` is intentionally omitted).
- Token is stored in `localStorage` on the client.
- On every request, the frontend sends `Authorization: Bearer <token>`.
- Logout simply removes the token from `localStorage` — no server-side invalidation needed for MVP.
- Role (`manager` | `employee`) is embedded in the JWT payload and decoded on both frontend (for routing) and backend (for authorization middleware).

```js
// JWT payload shape
{ userId, role, iat }
```

---

## QR Code Attendance Flow

This is the core feature — understand it fully before touching QR-related code.

### How it works

1. **Manager's device** displays a live QR code (`QRDisplay.jsx`).
2. The QR code encodes a **one-time token** (UUID v4), stored in memory on the backend (`qrManager.js`).
3. **Employee scans** the QR from the manager's screen using their device camera (`QRScanner.jsx`).
4. The scan hits `POST /api/qr/scan` with the token and the employee's JWT.
5. The backend validates the token, then either:
   - Creates a new `AttendanceRecord` (check-in), or
   - Closes the existing open record and calculates hours (check-out).
6. **Immediately after a successful scan**, the backend generates a new QR token. The manager's display polls `GET /api/qr/current` every 2 seconds and updates automatically.
7. This ensures each scan consumes one token → the next employee gets a fresh one.

### QR Token Manager (`backend/src/utils/qrManager.js`)
```js
// Holds the single active token in memory
let currentToken = uuidv4();

export const getToken = () => currentToken;
export const rotateToken = () => { currentToken = uuidv4(); };
export const validateAndRotate = (token) => {
  if (token !== currentToken) return false;
  rotateToken();
  return true;
};
```

> ⚠️ In-memory state resets on Render free tier restarts. For production, store the token in MongoDB or Redis. For MVP, this is acceptable.

---

## API Endpoints

### Auth
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Public | Returns JWT |
| POST | `/api/auth/logout` | Authenticated | (client-side only for MVP) |

### QR
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/qr/current` | Manager only | Returns current QR token string |
| POST | `/api/qr/scan` | Employee only | Validates token, check-in or check-out |

### Attendance
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/attendance/me` | Employee | Own records (filterable by month) |
| GET | `/api/attendance/all` | Manager | All employees' records |
| GET | `/api/attendance/:employeeId` | Manager | Specific employee's records |

### Export
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/export/pdf?employeeId=&month=YYYY-MM` | Manager | Returns PDF binary |

---

## Frontend Pages & Routing

```jsx
// App.jsx routing structure
/login                    → LoginPage (public)
/manager                  → ManagerDashboard (role: manager)
  /manager/qr             → QR Display tab
  /manager/attendance     → All attendance table + filters
  /manager/export         → PDF export controls
/employee                 → EmployeeDashboard (role: employee)
  /employee/scan          → QR Scanner tab
  /employee/attendance    → Own attendance table
*                         → Redirect based on role or to /login
```

`ProtectedRoute.jsx` reads role from `AuthContext` and redirects unauthorized access.

---

## Attendance Table (UI)

Both manager and employee views use `AttendanceTable.jsx`. Columns:

| Column | Details |
|--------|---------|
| Date | `YYYY-MM-DD` |
| Employee | Name (manager view only) |
| Start Time | Formatted local time |
| End Time | Formatted local time / `—` if active |
| Total Hours | Decimal hours, 2dp |
| Daily Salary | `hours × hourlyRate`, formatted as currency |
| Status | `active` / `completed` badge |

Manager can filter by: **employee**, **month**, **status**.

---

## PDF Export

- Generated server-side using `PDFKit`.
- Endpoint accepts `employeeId` (optional — if omitted, exports all employees) and `month` (`YYYY-MM`).
- PDF contains: company header, employee info, month, attendance table, totals row (total hours + total salary).
- Response header: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="attendance-...pdf"`.

---

## Deployment

### Backend → Render (Free Tier)
- Use **Render Web Service** → Node environment.
- Build command: `npm install`
- Start command: `node src/index.js`
- Add all env vars in Render dashboard.
- Enable **Auto-Deploy** from `main` branch.
- Free tier sleeps after 15 min of inactivity (cold start ~30s). Acceptable for internal tools.

> If cold starts become a problem, consider **Railway** (free $5/month credit) or **Fly.io** as alternatives — both are faster than Render free tier.

### Frontend → Vercel
- Import GitHub repo, set root to `frontend/`.
- Framework preset: **Vite**.
- Add `VITE_API_BASE_URL` environment variable.
- Auto-deploys on push to `main`.

### MongoDB → Atlas (Free M0 Cluster)
- Create cluster at mongodb.com/cloud/atlas.
- Whitelist `0.0.0.0/0` (all IPs) for Render compatibility.
- Use the connection string in `MONGODB_URI`.

---

## CORS Configuration

```js
// backend/src/index.js
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

---

## Key Implementation Notes

- **Check-in/Check-out logic**: On scan, query for an open `AttendanceRecord` (status: `'active'`) for that employee today. If none → check-in. If exists → check-out, calculate hours, set status to `'completed'`.
- **Daily salary**: `Math.round((totalHours * employee.hourlyRate) * 100) / 100`
- **Timezone**: Store all times in UTC in MongoDB. Format to local time on the frontend using `toLocaleTimeString()`.
- **QR polling interval**: Manager's `QRDisplay.jsx` polls every 2 seconds. Stop polling when component unmounts (cleanup in `useEffect`).
- **One session per day**: Prevent double check-in — if a `completed` record already exists for today, return a clear error message.

---

## Development Setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # nodemon

# Frontend
cd frontend
cp .env.example .env   # fill in VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev            # Vite dev server
```

---

## What's NOT in Scope (Yet)

The following features are planned for future phases — do not implement them now:

- Employee registration (create accounts manually via DB seed or manager UI later)
- Password reset / email verification
- Shift scheduling
- Leave management
- Push notifications
- Multi-company / tenant support
- Role beyond `manager` / `employee`

---

## Code Style

- Use **ES Modules** (`import/export`) throughout — set `"type": "module"` in both `package.json` files.
- Backend: async/await, centralized error handler middleware.
- Frontend: functional components only, custom hooks for data fetching.
- No `any` types — keep logic explicit and readable.
- Keep controllers thin; put business logic in service functions.