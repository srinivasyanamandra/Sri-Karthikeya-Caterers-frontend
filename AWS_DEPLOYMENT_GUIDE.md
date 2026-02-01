# AWS Deployment Guide - Srikarthikeya Caterers
## Low-Cost Frontend Hosting (~$1-2/month)

---

## 📋 Prerequisites
- AWS Account (Free tier eligible)
- Domain: srikarthikeyacaterers.in (from Hostinger)
- Node.js installed locally

---

## 🚀 STEP 1: Build Your React App

Open terminal in your project folder and run:

```bash
npm run build
```

This creates a `build` folder with optimized production files.

---

## ☁️ STEP 2: Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow signup process (requires credit card but won't charge for free tier)
4. Enable MFA for security (recommended)

---

## 📦 STEP 3: Create S3 Bucket for Hosting

### 3.1 Create Bucket
1. Login to AWS Console
2. Search for "S3" in services
3. Click "Create bucket"
4. **Bucket name**: `srikarthikeyacaterers.in` (must match your domain)
5. **Region**: Choose closest to India (e.g., `ap-south-1` - Mumbai)
6. **Uncheck** "Block all public access" (we need public access for website)
7. Check the acknowledgment box
8. Click "Create bucket"

### 3.2 Enable Static Website Hosting
1. Click on your bucket name
2. Go to "Properties" tab
3. Scroll to "Static website hosting"
4. Click "Edit"
5. Select "Enable"
6. **Index document**: `index.html`
7. **Error document**: `index.html` (for React Router)
8. Click "Save changes"
9. **Note the endpoint URL** (e.g., http://srikarthikeyacaterers.in.s3-website.ap-south-1.amazonaws.com)

### 3.3 Set Bucket Policy
1. Go to "Permissions" tab
2. Scroll to "Bucket policy"
3. Click "Edit"
4. Paste this policy (replace YOUR-BUCKET-NAME):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::srikarthikeyacaterers.in/*"
    }
  ]
}
```

5. Click "Save changes"

### 3.4 Upload Build Files
1. Go to "Objects" tab
2. Click "Upload"
3. Click "Add files" and "Add folder"
4. Select ALL files and folders from your `build` folder
5. Click "Upload"
6. Wait for upload to complete

---

## 🔒 STEP 4: Request SSL Certificate (FREE)

### 4.1 Request Certificate
1. Search for "Certificate Manager" in AWS Console
2. **IMPORTANT**: Switch region to **US East (N. Virginia) us-east-1** (required for CloudFront)
3. Click "Request certificate"
4. Select "Request a public certificate"
5. Click "Next"
6. **Domain names**: Add both:
   - `srikarthikeyacaterers.in`
   - `www.srikarthikeyacaterers.in`
7. **Validation method**: Select "DNS validation"
8. Click "Request"

### 4.2 Note DNS Records
1. Click on your certificate
2. You'll see CNAME records for validation
3. **Keep this page open** - you'll need these records in Step 6

---

## 🌐 STEP 5: Create CloudFront Distribution

### 5.1 Create Distribution
1. Search for "CloudFront" in AWS Console
2. Click "Create distribution"
3. **Origin domain**: Select your S3 bucket from dropdown
4. **Origin access**: Select "Origin access control settings (recommended)"
5. Click "Create control setting" → Click "Create"
6. **Viewer protocol policy**: Select "Redirect HTTP to HTTPS"
7. **Alternate domain names (CNAMEs)**: Add:
   - `srikarthikeyacaterers.in`
   - `www.srikarthikeyacaterers.in`
8. **Custom SSL certificate**: Select your certificate from dropdown
9. **Default root object**: `index.html`
10. Click "Create distribution"

### 5.2 Update S3 Bucket Policy
1. After creation, you'll see a blue banner saying "Update S3 bucket policy"
2. Click "Copy policy"
3. Go back to S3 → Your bucket → Permissions → Bucket policy
4. Replace the old policy with the new one
5. Click "Save"

### 5.3 Create Custom Error Response (for React Router)
1. In CloudFront, click on your distribution
2. Go to "Error pages" tab
3. Click "Create custom error response"
4. **HTTP error code**: 403
5. **Customize error response**: Yes
6. **Response page path**: `/index.html`
7. **HTTP response code**: 200
8. Click "Create"
9. Repeat for error code 404

### 5.4 Note CloudFront Domain
- Copy the "Distribution domain name" (e.g., d1234abcd.cloudfront.net)
- **Keep this** - you'll need it for DNS setup

---

## 🔗 STEP 6: Configure DNS in Hostinger

### 6.1 Add SSL Validation Records (from Step 4.2)
1. Login to Hostinger
2. Go to Domains → srikarthikeyacaterers.in → DNS/Nameservers
3. Click "Add Record"
4. For each CNAME record from Certificate Manager:
   - **Type**: CNAME
   - **Name**: (copy from AWS, remove domain part)
   - **Value**: (copy from AWS)
   - **TTL**: 3600
5. Click "Add Record"
6. Wait 5-10 minutes, then check AWS Certificate Manager - status should change to "Issued"

### 6.2 Point Domain to CloudFront
1. In Hostinger DNS settings
2. **For root domain** (srikarthikeyacaterers.in):
   - **Type**: A Record
   - **Name**: @ (or leave blank)
   - **Value**: Your CloudFront domain (d1234abcd.cloudfront.net)
   - **TTL**: 3600
   
3. **For www subdomain**:
   - **Type**: CNAME
   - **Name**: www
   - **Value**: Your CloudFront domain (d1234abcd.cloudfront.net)
   - **TTL**: 3600

4. Click "Save" or "Add Record"

---

## ⏱️ STEP 7: Wait for Propagation

- DNS changes take 5 minutes to 48 hours (usually 1-2 hours)
- CloudFront deployment takes 15-30 minutes
- Check status in CloudFront console (should show "Enabled")

---

## ✅ STEP 8: Test Your Website

After propagation:
1. Visit https://srikarthikeyacaterers.in
2. Visit https://www.srikarthikeyacaterers.in
3. Both should work with SSL (🔒 padlock icon)

---

## 🔄 Future Updates - How to Deploy Changes

### Option A: Automatic (GitHub Actions) ⭐ RECOMMENDED

See `GITHUB_DEPLOYMENT.md` for setup. Once configured:

```bash
git add .
git commit -m "Your changes"
git push
# Done! Auto-deploys in 2-5 minutes
```

### Option B: Manual Upload

```bash
# 1. Build the project
npm run build

# 2. Upload to S3
# Go to S3 Console → Your bucket → Upload → Select all files from build folder

# 3. Invalidate CloudFront cache
# Go to CloudFront → Your distribution → Invalidations → Create invalidation
# Object paths: /*
# Click "Create invalidation"
```

Wait 2-5 minutes for changes to appear.

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| S3 Storage (1GB) | ~$0.50/month |
| CloudFront (Free tier) | First 1TB free/month |
| Certificate Manager | FREE |
| Route 53 (if used) | $0.50/month |
| **Total** | **~$0.50-1/month** |

---

## 🛠️ Alternative: Using AWS CLI (Advanced)

If you want to automate deployments, install AWS CLI:

```bash
# Install AWS CLI
# Windows: Download from https://aws.amazon.com/cli/

# Configure
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ap-south-1), Output format (json)

# Deploy command
aws s3 sync build/ s3://srikarthikeyacaterers.in --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 🆘 Troubleshooting

### Certificate not validating?
- Check DNS records are correct in Hostinger
- Wait 10-15 minutes
- Ensure no typos in CNAME records

### Website not loading?
- Check CloudFront status is "Enabled"
- Verify DNS propagation: https://dnschecker.org
- Clear browser cache (Ctrl+Shift+Delete)

### 403 Error?
- Check S3 bucket policy is correct
- Verify CloudFront has access to S3
- Check error pages are configured

### Changes not appearing?
- Create CloudFront invalidation
- Wait 2-5 minutes
- Clear browser cache

---

## 📞 Support

If you face issues:
1. Check AWS CloudWatch logs
2. AWS Support (Free tier includes basic support)
3. AWS Documentation: https://docs.aws.amazon.com

---

## 🎉 You're Done!

Your website is now:
- ✅ Hosted on AWS
- ✅ Has FREE SSL certificate
- ✅ Uses CDN for fast loading
- ✅ Costs less than $1/month
- ✅ Scalable and reliable

**Bookmark this guide for future deployments!**
