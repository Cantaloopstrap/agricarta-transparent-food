# 🔐 AGRIKARTA - PRODUCTION ENVIRONMENT VARIABLES CHECKLIST

Ensure the following environment variables are properly configured on your **Domcloud** server control panel or `.env` files before running the application in production.

---

## 🌐 1. Frontend (React PWA - Environment Variables)
Location: Root directory `.env` or Domcloud build environment.

| Variable Name | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | **YES** | Supabase Project URL | `https://rscxfnhrqbebuieskjec.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **YES** | Supabase Publishable / Anon API Key | `eyJhbGciOiJIUzI1NiIsInR5...` |
| `VITE_NODE_API_URL` | **YES** | Public URL for Node.js Backend API | `https://api.agrikarta.app` or `http://localhost:5000` |
| `VITE_PYTHON_API_URL` | **YES** | Public URL for Python ML Engine API | `https://ml.agrikarta.app` or `http://localhost:8000` |

---

## 🟢 2. Node.js Backend & WhatsApp Bot (`/backend/.env`)
Location: `/backend/.env` file on server.

| Variable Name | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `PORT` | **YES** | Express server HTTP port | `5000` |
| `NODE_ENV` | **YES** | Node execution mode | `production` |
| `FRONTEND_URL` | **YES** | CORS Allowed Origin & Magic Link domain | `https://agrikarta.app` |
| `SUPABASE_URL` | **YES** | Supabase Project URL | `https://rscxfnhrqbebuieskjec.supabase.co` |
| `SUPABASE_KEY` | **YES** | Supabase Anon Key | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | Supabase Service Role Secret Key (Bypasses RLS) | `eyJhbGciOiJIUzI1...` |
| `JWT_SECRET` | **YES** | Secret key for signing Magic Link JWT tokens | `your_super_secret_jwt_key` |
| `MIDTRANS_SERVER_KEY` | **YES** | Midtrans Server Key (Sandbox or Production) | `Mid-server-xxxx` or `SB-Mid-server-xxxx` |
| `MIDTRANS_CLIENT_KEY` | **YES** | Midtrans Client Key | `Mid-client-xxxx` or `SB-Mid-client-xxxx` |
| `WEBHOOK_SECRET_KEY` | **YES** | Secret Bearer Token for Google Form Persona Webhook | `agrikarta_persona_secret_key_2026` |

---

## 🐍 3. Python ML Engine (`/ml-engine/.env`)
Location: `/ml-engine/.env` file on server.

| Variable Name | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | **YES** | Supabase Project URL | `https://rscxfnhrqbebuieskjec.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | Supabase Service Role Secret Key | `eyJhbGciOiJIUzI1...` |
| `FRONTEND_URL` | **YES** | Allowed CORS Origin domain | `https://agrikarta.app` |

---

## 🚀 4. Deployment Verification Commands
Run these commands after setting environment variables to confirm all services are active:

```bash
# 1. Test Node.js Health
curl -i https://api.agrikarta.app/api/health

# 2. Test Python ML Engine Health
curl -i https://ml.agrikarta.app/api/health

# 3. PM2 Process Status Check
pm2 status
```
