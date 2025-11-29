# Railway Deployment Guide - Separate Projects

## **Deploy Backend and Frontend as Separate Railway Projects**

---

## **Part 1: Deploy Backend**

### **Step 1: Create Backend Project**

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. **IMPORTANT:** Click **"Configure"** before deploying

### **Step 2: Set Root Directory**

In the Railway project settings:
- **Root Directory:** `backend`
- Save changes

### **Step 3: Add Environment Variables**

In Railway project → **Variables** tab, add:

```bash
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=5000
DEBUG=False
SECRET_KEY=some_random_secret_string_here
```

### **Step 4: Deploy Backend**

Railway will auto-detect:
- `requirements.txt` → Install Python packages
- `Procfile` → Run `python run_backend.py`
- `railway.json` → Use correct configuration

**Click "Deploy"**

### **Step 5: Get Backend URL**

After successful deployment, Railway gives you a URL like:
```
https://livetranslate-backend.up.railway.app
```

**Copy this URL** - you need it for frontend!

---

## **Part 2: Deploy Frontend**

### **Step 1: Create Frontend Project**

1. In Railway, click **"New Project"** again
2. Select **"Deploy from GitHub repo"**
3. Choose the **same repository**
4. Click **"Configure"** before deploying

### **Step 2: Set Root Directory**

In the Railway project settings:
- **Root Directory:** `frontend`
- Save changes

### **Step 3: Add Environment Variables**

In Railway project → **Variables** tab, add:

```bash
VITE_BACKEND_URL=https://your-backend-url.up.railway.app
```

(Use the backend URL from Part 1, Step 5)

### **Step 4: Deploy Frontend**

Railway will auto-detect:
- `package.json` → Install npm packages
- Run `npm run build`
- Serve using `vite preview`

**Click "Deploy"**

### **Step 5: Get Frontend URL**

After deployment, you'll get a URL like:
```
https://livetranslate-frontend.up.railway.app
```

---

## **Part 3: Update Backend CORS**

### **IMPORTANT: Connect Frontend to Backend**

1. Go back to your **Backend** Railway project
2. Go to **Variables** tab
3. Add or update:

```bash
CORS_ALLOWED_ORIGINS=https://your-frontend-url.up.railway.app
```

(Use the exact frontend URL from Part 2, Step 5)

4. Railway will automatically redeploy backend

---

## **Final Check**

### **Test Your Deployment:**

1. Open your frontend URL: `https://your-frontend.up.railway.app`
2. Create a room
3. Select a language (e.g., Hindi)
4. Speak in English
5. Check if translation appears

### **If Something Doesn't Work:**

**Check Backend Logs:**
- Railway Backend Project → **Deployments** → Click latest deployment → **View Logs**
- Look for errors

**Check Frontend Logs:**
- Railway Frontend Project → **Deployments** → Click latest deployment → **View Logs**

**Common Issues:**

1. **Socket.IO not connecting:**
   - Verify `VITE_BACKEND_URL` matches backend Railway URL
   - Check `CORS_ALLOWED_ORIGINS` matches frontend Railway URL
   - Make sure both use `https://` not `http://`

2. **Translation not working:**
   - Check `GOOGLE_API_KEY` is set in backend
   - Check backend logs for Gemini errors

3. **Database errors:**
   - SQLite works but resets on each deploy
   - Recordings are temporary unless you add persistent storage

---

## **Railway Project Structure**

You should have **2 separate projects** in Railway:

```
Railway Dashboard:
├── livetranslate-backend
│   ├── Root Directory: backend
│   ├── Variables:
│   │   ├── GOOGLE_API_KEY
│   │   ├── PORT=5000
│   │   ├── DEBUG=False
│   │   ├── SECRET_KEY
│   │   └── CORS_ALLOWED_ORIGINS
│   └── URL: https://xxx-backend.up.railway.app
│
└── livetranslate-frontend
    ├── Root Directory: frontend
    ├── Variables:
    │   └── VITE_BACKEND_URL
    └── URL: https://xxx-frontend.up.railway.app
```

---

## **Cost**

- **Railway Free Tier:** 500 hours/month per project
- **2 Projects:** Backend + Frontend = ~250 hours each
- **Total:** FREE for hackathon/demo! 🎉

---

## **Local Development**

Local dev still works normally:

```bash
# Terminal 1 - Backend
python run_backend.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

No changes needed - uses `localhost` by default.

---

## **Troubleshooting Tips**

### **View Build Logs:**
Railway → Project → Deployments → Click deployment → Logs

### **Environment Variables:**
Make sure URLs don't have trailing slashes:
- ✅ `https://backend.up.railway.app`
- ❌ `https://backend.up.railway.app/`

### **Redeploy:**
Railway → Project → Deployments → Click "Redeploy"

### **Check Domain Generation:**
Railway auto-generates domains. If you want custom domains, use Railway's domain settings.

---

## **Quick Checklist**

- [ ] Backend deployed with root directory = `backend`
- [ ] Backend has `GOOGLE_API_KEY` env var
- [ ] Backend URL copied
- [ ] Frontend deployed with root directory = `frontend`
- [ ] Frontend has `VITE_BACKEND_URL` = backend URL
- [ ] Backend `CORS_ALLOWED_ORIGINS` = frontend URL
- [ ] Both projects show "Success" in deployments
- [ ] Tested app works in browser

**Done! Your app is live!** 🚀
