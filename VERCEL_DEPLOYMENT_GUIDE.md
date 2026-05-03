# 🚀 Vercel Deployment Guide - Sri Karthikeya Caterers

## ✅ Pre-Deployment Checklist

- [x] Code builds successfully with NO warnings
- [x] Code pushed to GitHub
- [x] PropTypes warnings fixed
- [ ] Founder image uploaded to `public/founder.png`
- [ ] Vercel account created

---

## 📋 Step-by-Step Deployment

### **Step 1: Create Vercel Account**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

### **Step 2: Import Your Project**

1. Click **"Add New..."** → **"Project"**
2. Find `Sri-Karthikeya-Caterers-frontend` in the list
3. Click **"Import"**

---

### **Step 3: Configure Project Settings**

Vercel will auto-detect your React app. Verify these settings:

```
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

**Root Directory:** Leave as `.` (root)

---

### **Step 4: Environment Variables (Optional)**

Click **"Environment Variables"** and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_API_URL` | `https://api.srikarthikeyacaterers.in` | Production |
| `NODE_VERSION` | `18` | All |

*Note: Only add `REACT_APP_API_URL` when your backend is ready*

---

### **Step 5: Deploy**

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://sri-karthikeya-caterers-frontend.vercel.app`

---

## 🌐 Custom Domain Setup

### **Add Your Domain (srikarthikeyacaterers.in)**

1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `srikarthikeyacaterers.in`
4. Click **"Add"**

### **Configure DNS Records**

Go to your domain registrar and add these records:

#### **Option A: Using Vercel Nameservers (Recommended)**

Vercel will provide nameservers like:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Update your domain's nameservers to these.

#### **Option B: Using A/CNAME Records**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

*Note: Vercel will show you the exact values in the dashboard*

---

## 🔧 Advanced Configuration

### **vercel.json** (Optional - for custom routing)

Create `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🚀 Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

---

## 📊 Post-Deployment Checklist

### **1. Test Your Site**
- [ ] Visit your Vercel URL
- [ ] Check all pages load correctly
- [ ] Test on mobile devices
- [ ] Verify images load (especially founder image)
- [ ] Test navigation and links

### **2. Performance Check**
- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Check page load speed
- [ ] Verify responsive design

### **3. SEO Setup**
- [ ] Add Google Analytics (optional)
- [ ] Submit sitemap to Google Search Console
- [ ] Verify meta tags

---

## 🔄 Updating Your Site

### **Method 1: Push to GitHub (Automatic)**
```bash
# Make changes
git add .
git commit -m "Update content"
git push origin main

# Vercel automatically deploys!
```

### **Method 2: Redeploy from Vercel Dashboard**
1. Go to your project
2. Click **"Deployments"**
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**

---

## 🌟 Vercel Features You Get

### **Free Tier Includes:**
- ✅ Unlimited deployments
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN (Edge Network)
- ✅ Preview deployments
- ✅ Custom domains
- ✅ Automatic Git integration
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions (if needed later)

### **Performance:**
- ⚡ Edge caching worldwide
- ⚡ Automatic image optimization
- ⚡ Brotli compression
- ⚡ HTTP/2 & HTTP/3 support

---

## 🆚 Vercel vs Render Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Frontend Hosting** | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Good |
| **Build Speed** | 1-2 min | 2-3 min |
| **Global CDN** | ✅ Included | ✅ Included |
| **Auto Deploy** | ✅ Yes | ✅ Yes |
| **Custom Domain** | ✅ Free | ✅ Free |
| **SSL** | ✅ Auto | ✅ Auto |
| **Preview URLs** | ✅ Yes | ❌ No |
| **Backend Support** | Functions only | ✅ Full apps |
| **Price (Frontend)** | **FREE** | **FREE** |

**Recommendation:** 
- **Frontend only**: Vercel (better performance)
- **Frontend + Backend**: Render or split (Vercel frontend + Render backend)

---

## 🔗 Connecting to Backend (Future)

When your Spring Boot backend is ready:

### **1. Deploy Backend on Render**
- Backend URL: `https://api.srikarthikeyacaterers.in`

### **2. Update Vercel Environment Variables**
```
REACT_APP_API_URL=https://api.srikarthikeyacaterers.in
```

### **3. Redeploy**
Vercel will automatically rebuild with new env vars.

---

## 🐛 Troubleshooting

### **Build Fails**
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify Node version (use 18.x)

### **404 on Refresh**
- Add `vercel.json` with rewrites (see Advanced Configuration)

### **Images Not Loading**
- Check file paths are correct
- Ensure images are in `public/` folder
- Use `/image.png` not `./image.png`

### **Slow Performance**
- Enable Vercel Analytics
- Check bundle size
- Optimize images

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions

---

## 🎉 You're Ready!

Your site will be live at:
- **Vercel URL**: `https://sri-karthikeya-caterers-frontend.vercel.app`
- **Custom Domain**: `https://srikarthikeyacaterers.in` (after DNS setup)

**Deployment time: ~5 minutes** ⚡

---

## 📝 Quick Commands

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from terminal
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

---

**Last Updated:** May 3, 2026
**Status:** ✅ Production Ready
