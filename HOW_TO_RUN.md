# Blood-Donor Matching System - How to Run

Welcome! Follow the instructions below to get the project running on your computer.

---

## Prerequisites

You can run this project in two ways:
- **Option 1 (Recommended & Easiest): Using Docker** — no need to install or configure PostgreSQL and PostGIS manually.
- **Option 2: Running Locally** — requires Node.js (v18+ or v20+) and PostgreSQL (v14+ with PostGIS extension).

---

## Option 1: Run with Docker (Recommended)

1. **Install Docker Desktop**:
   Make sure Docker Desktop is installed and running on your system.

2. **Configure Environment Variables**:
   - In the project root, make a copy of `.env.example` and name it `.env`:
     ```powershell
     Copy-Item .env.example .env
     ```
   - In the `backend` folder, make a copy of `.env.example` and name it `.env`:
     ```powershell
     Copy-Item backend/.env.example backend/.env
     ```
   - In `backend/.env`, provide:
     - `DB_PASSWORD=your_secure_password`
     - `JWT_SECRET=any_random_secret_string_or_hash`

3. **Start the Containers**:
   ```bash
   docker compose up --build
   ```

4. **Access the Application**:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

## Option 2: Run Locally (Node.js + PostgreSQL)

### 1. Install Dependencies
In the root directory of the project, run:
```bash
npm install
```
*(or `npm ci --ignore-scripts`)*

### 2. Configure Environment Files
- Copy `.env.example` to `.env` in the root folder:
  ```powershell
  Copy-Item .env.example .env
  ```
- Copy `backend/.env.example` to `backend/.env`:
  ```powershell
  Copy-Item backend/.env.example backend/.env
  ```
- Open `backend/.env` in any text editor and fill in your local PostgreSQL details:
  ```env
  PORT=5000
  NODE_ENV=development
  CLIENT_URL=http://localhost:5173
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=your_postgres_username
  DB_PASSWORD=your_postgres_password
  DB_NAME=blood_donor_db
  JWT_SECRET=your_random_secret_key_here
  ```

### 3. Create Database & Initialize Schema
1. Open PostgreSQL (e.g. `psql` or pgAdmin) and create a database:
   ```sql
   CREATE DATABASE blood_donor_db;
   ```
2. Initialize the PostGIS schema and migrations:
   ```bash
   npm run init-db --workspace backend
   ```

### 4. (Optional) Create an Admin Account
To create an admin user:
- On Windows (PowerShell):
  ```powershell
  $env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="StrongPassword123!"; $env:ADMIN_PHONE="+1234567890"; node backend/database/createAdmin.js
  ```
- On Linux/macOS:
  ```bash
  ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="StrongPassword123!" ADMIN_PHONE="+1234567890" node backend/database/createAdmin.js
  ```

### 5. Start the Services
You need two terminal windows:

- **Terminal 1 (Backend Server)**:
  ```bash
  npm run dev --workspace backend
  ```
  *(Server starts on http://localhost:5000)*

- **Terminal 2 (Frontend Client)**:
  ```bash
  npm run dev
  ```
  *(Vite dev server starts on http://localhost:5173)*

### 6. Open in Browser
Visit **[http://localhost:5173](http://localhost:5173)** to use the application!
