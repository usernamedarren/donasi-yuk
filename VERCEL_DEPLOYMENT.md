# Vercel Deployment Guide - DONASI-YUK

## Project Structure
This is a monorepo with two separate deployments:
- **Backend**: `packages/backend` - Node.js/Express API
- **Frontend**: `packages/frontend` - Static HTML/CSS/JS site

## Backend Deployment

### Steps:
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose `donasi-yuk` repository
4. Under "Configure Project", set:
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.` (dot - no build output)
   - **Install Command**: `npm ci` or `npm install`

5. Add Environment Variables:
   - `DATABASE_URL`: Your production database connection string
     - For SQLite (dev): `file:./dev.db`
     - For MongoDB: `mongodb+srv://user:pass@cluster.mongodb.net/donasi-yuk`
     - For PostgreSQL: `postgresql://user:pass@host:5432/donasi-yuk`
     - For Supabase: `postgresql://postgres:[password]@[host]:5432/[database]`
   - `JWT_SECRET`: Generate a secure random string (e.g., use `openssl rand -hex 32`)
   - `NODE_ENV`: `production`

6. Click "Deploy"

### After Backend Deployment:
- Copy the backend URL (e.g., `https://donasi-yuk-backend.vercel.app`)
- Update `packages/frontend/global/api.js` with this URL
- Redeploy frontend

---

## Frontend Deployment

### Steps:
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose `donasi-yuk` repository
4. Under "Configure Project", set:
   - **Root Directory**: `packages/frontend`
   - **Build Command**: Leave default (no build needed)
   - **Output Directory**: `.` (dot)

5. No environment variables needed for frontend

6. Click "Deploy"

### After Frontend Deployment:
- Test the application at the frontend URL
- Update backend's CORS settings if needed

---

## Database Setup

Choose one of the following:

### Option 1: MongoDB Atlas (Recommended for Vercel)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/donasi-yuk?retryWrites=true&w=majority`
4. Add to backend environment variables as `DATABASE_URL`
5. Update `prisma/schema.prisma` datasource if needed

### Option 2: Supabase (PostgreSQL)
1. Create account at https://supabase.com
2. Create project
3. Get connection string from Project Settings
4. Add to backend environment variables as `DATABASE_URL`
5. Run migrations in Vercel dashboard

### Option 3: Railway or PlanetScale
- Similar process, follow their documentation

---

## Environment Variables Reference

```env
# Backend (.env at packages/backend)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/donasi-yuk
JWT_SECRET=your-super-secret-key-generate-with-openssl
NODE_ENV=production
PORT=3000  # Vercel will override this
```

---

## Troubleshooting

### 404 NOT_FOUND Error
- Check Root Directory is set to `packages/backend`
- Verify `src/server.js` exists
- Check Environment Variables are configured

### Build Fails
- Ensure `package.json` has correct scripts
- Check dependencies are listed in `package.json`
- Verify Prisma is generating correctly

### CORS Issues
- Update backend `src/server.js` CORS settings
- Add frontend URL to allowed origins

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check database credentials
- Whitelist Vercel IPs in database firewall

---

## Quick Reference URLs

- Frontend: Will be provided by Vercel
- Backend API: Will be provided by Vercel
- Update `packages/frontend/global/api.js` once backend is deployed
