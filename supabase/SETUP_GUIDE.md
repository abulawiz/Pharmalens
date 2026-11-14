# PharmaLens Supabase Backend Setup Guide

This guide walks you through connecting your production Supabase database to PharmaLens with full authentication, role-based access control (RBAC), storage, and verified medicine registries.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) (or [https://database.new](https://database.new)) and sign in.
2. Click **New Project**.
3. Choose your organization, project name (e.g. `pharmalens`), a secure database password, and your preferred region.
4. Click **Create new project** and wait ~1-2 minutes for provisioning.

---

## 2. Apply Database Schema & Seed Data

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file [`supabase/schema.sql`](file:///c:/Users/PC/Documents/Dev/Pharmalens/supabase/schema.sql) in this repository, copy its entire contents, and paste into the SQL Editor.
4. Click **Run** (or press `Ctrl+Enter`).
5. You should see `Success. No rows returned` (or `Success`). This creates:
   - All tables (`profiles`, `products`, `reference_versions`, `reference_images`, `scans`, `scan_images`, `reports`, `report_events`, `audit_events`, `verification_adapters`).
   - Private storage buckets (`package-images`, `reference-images`) with Row Level Security.
   - Authentication triggers: Automatically creates a profile on signup and assigns their requested role (`admin`, `reviewer`, `user`).
   - Preloaded verified Nigerian medicines (`Paracetamol`, `Amoxicillin`, `Lonart DS`, `Coartem`).

---

## 3. Configure Authentication Settings

1. In Supabase, go to **Authentication** -> **Providers** -> **Email**.
2. Make sure **Enable Email provider** is turned on.
3. (Optional for development) Under **Confirm email**, you can turn off **"Confirm email"** if you want new signups to log in immediately without waiting for an email confirmation link.
4. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (or your production domain).
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback` and `http://localhost:3000/**`.

---

## 4. Connect Environment Variables

1. In Supabase, go to **Project Settings** -> **API**.
2. Find:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> `anon` / `public` key
3. In your local PharmaLens root directory, create or edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

4. Restart the development server:
```bash
npm run dev
```

---

## 5. Roles & Access Control

When users create an account on `/signup`:
- **🛡️ Administrator**: Full access to `/admin` (register medicines, publish packaging versions, upload genuine pack photos, manage accounts, view audit logs).
- **🩺 Pharmacist Reviewer**: Access to `/review` (inspect flagged packaging discrepancies, review patient reports, update report status).
- **👤 Standard Patient**: Scan packages, view personal scan history, and request pharmacist reviews.
