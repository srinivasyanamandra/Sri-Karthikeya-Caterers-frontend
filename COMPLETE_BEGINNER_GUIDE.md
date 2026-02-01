# Complete Beginner's Deployment Guide
## From Zero to Live Website - Step by Step

---

## 📌 IMPORTANT: Do Steps in This Order!

1. ✅ Setup AWS (S3, CloudFront, SSL) - **DO THIS FIRST**
2. ✅ Configure DNS in Hostinger
3. ✅ Test manually once
4. ✅ Setup GitHub Actions
5. ✅ Push to GitHub

**Don't skip steps! Each step depends on the previous one.**

---

## 🎯 PHASE 1: AWS Setup (Do This First!)

### Step 1: Create AWS Account (15 minutes)

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Fill in:
   - Email address
   - Password
   - AWS account name: "Srikarthikeya Caterers"
4. Choose "Personal" account
5. Enter your details (name, phone, address)
6. Add credit/debit card (won't charge, just for verification)
7. Verify phone number
8. Choose "Basic Support - Free"
9. Wait for account activation email (2-5 minutes)

✅ **Checkpoint**: You can login to https://console.aws.amazon.com

---

### Step 2: Build Your Website (5 minutes)

1. Open terminal in your project folder
2. Run:
```bash
npm install
npm run build
```
3. Check that `build` folder is created

✅ **Checkpoint**: You have a `build` folder with files inside

---

### Step 3: Create S3 Bucket (10 minutes)

1. Login to AWS Console: https://console.aws.amazon.com
2. In search bar, type "S3" and click it
3. Click "Create bucket" (orange button)
4. Fill in:
   - **Bucket name**: `srikarthikeyacaterers.in` (exactly this)
   - **Region**: Select "Asia Pacific (Mumbai) ap-south-1"
5. Scroll down to "Block Public Access"
   - **UNCHECK** "Block all public access"
   - **CHECK** the warning box below it
6. Leave everything else as default
7. Click "Create bucket" (bottom)

✅ **Checkpoint**: You see your bucket in the list

---

### Step 4: Configure S3 for Website Hosting (5 minutes)

1. Click on your bucket name `srikarthikeyacaterers.in`
2. Click "Properties" tab (top)
3. Scroll to bottom → Find "Static website hosting"
4. Click "Edit"
5. Select "Enable"
6. Fill in:
   - **Index document**: `index.html`
   - **Error document**: `index.html`
7. Click "Save changes"
8. Scroll back to "Static website hosting" section
9. **COPY the website endpoint URL** (looks like: http://srikarthikeyacaterers.in.s3-website.ap-south-1.amazonaws.com)
10. Save this URL in notepad - you'll test it later

✅ **Checkpoint**: Static website hosting shows "Enabled"

---

### Step 5: Make S3 Bucket Public (5 minutes)

1. Stay in your bucket
2. Click "Permissions" tab
3. Scroll to "Bucket policy"
4. Click "Edit"
5. Copy and paste this EXACTLY:

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

6. Click "Save changes"

✅ **Checkpoint**: Bucket policy is saved, no errors

---

### Step 6: Upload Your Website Files (10 minutes)

1. Stay in your bucket
2. Click "Objects" tab
3. Click "Upload" button
4. Click "Add files" button
5. Go to your project's `build` folder
6. Select ALL files (Ctrl+A)
7. Click "Open"
8. Click "Add folder" button
9. Select the `static` folder from inside `build` folder
10. Click "Upload" (bottom)
11. Wait for "Upload succeeded" message
12. Click "Close"

✅ **Checkpoint**: You see files like index.html, favicon.ico, etc. in your bucket

---

### Step 7: Test S3 Website (2 minutes)

1. Open the S3 endpoint URL you saved earlier (from Step 4)
2. Your website should load (without HTTPS, that's okay for now)

✅ **Checkpoint**: Website loads in browser (even without SSL)

**If website doesn't load:**
- Check all files are uploaded
- Check bucket policy is correct
- Check static website hosting is enabled

---

### Step 8: Request SSL Certificate (10 minutes)

1. In AWS Console search bar, type "Certificate Manager"
2. **IMPORTANT**: At top right, change region to "US East (N. Virginia) us-east-1"
   - Click region dropdown → Select "US East (N. Virginia)"
3. Click "Request certificate"
4. Select "Request a public certificate"
5. Click "Next"
6. In "Domain names":
   - Type: `srikarthikeyacaterers.in`
   - Click "Add another name to this certificate"
   - Type: `www.srikarthikeyacaterers.in`
7. **Validation method**: Select "DNS validation"
8. Click "Request"
9. Click on your certificate (it will show "Pending validation")
10. You'll see 2 CNAME records
11. **KEEP THIS PAGE OPEN** - you'll need these records next

✅ **Checkpoint**: Certificate shows "Pending validation" with CNAME records visible

---

### Step 9: Validate Certificate in Hostinger (15 minutes)

1. Login to Hostinger: https://hpanel.hostinger.com
2. Go to "Domains" → Click on `srikarthikeyacaterers.in`
3. Click "DNS / Name Servers"
4. For EACH CNAME record from AWS (you have 2):
   
   **First CNAME:**
   - Click "Add Record"
   - **Type**: CNAME
   - **Name**: Copy from AWS (remove `.srikarthikeyacaterers.in` part, keep only the random string)
   - **Points to**: Copy from AWS (the long validation string)
   - **TTL**: 3600
   - Click "Add Record"
   
   **Second CNAME:**
   - Repeat above for the second CNAME record

5. Wait 5-10 minutes
6. Go back to AWS Certificate Manager
7. Refresh the page
8. Status should change to "Issued" (if not, wait 5 more minutes)

✅ **Checkpoint**: Certificate status shows "Issued" (green)

**If stuck on "Pending validation":**
- Double-check CNAME records in Hostinger
- Make sure you removed the domain part from Name field
- Wait 15-20 minutes total

---

### Step 10: Create CloudFront Distribution (15 minutes)

1. In AWS Console, search for "CloudFront"
2. Click "Create distribution"
3. **Origin domain**: 
   - Click the dropdown
   - Select your S3 bucket `srikarthikeyacaterers.in`
4. **Origin access**: 
   - Select "Origin access control settings (recommended)"
   - Click "Create control setting"
   - Click "Create" in the popup
5. Scroll down to "Viewer protocol policy"
   - Select "Redirect HTTP to HTTPS"
6. Scroll to "Settings" section
7. **Alternate domain names (CNAMEs)**:
   - Click "Add item"
   - Type: `srikarthikeyacaterers.in`
   - Click "Add item" again
   - Type: `www.srikarthikeyacaterers.in`
8. **Custom SSL certificate**:
   - Click the dropdown
   - Select your certificate
9. **Default root object**: Type `index.html`
10. Click "Create distribution" (bottom)
11. You'll see a BLUE banner at top saying "Update S3 bucket policy"
12. Click "Copy policy" button
13. **COPY the Distribution domain name** (looks like: d1234abcd.cloudfront.net)
14. Save this in notepad

✅ **Checkpoint**: Distribution created, status shows "Deploying"

---

### Step 11: Update S3 Bucket Policy for CloudFront (5 minutes)

1. Go back to S3 (search "S3" in AWS Console)
2. Click your bucket `srikarthikeyacaterers.in`
3. Click "Permissions" tab
4. Scroll to "Bucket policy"
5. Click "Edit"
6. **DELETE the old policy**
7. **PASTE the new policy** you copied from CloudFront
8. Click "Save changes"

✅ **Checkpoint**: New bucket policy saved

---

### Step 12: Add Error Pages to CloudFront (5 minutes)

1. Go back to CloudFront
2. Click on your distribution ID
3. Click "Error pages" tab
4. Click "Create custom error response"
5. Fill in:
   - **HTTP error code**: 403
   - **Customize error response**: Yes
   - **Response page path**: `/index.html`
   - **HTTP response code**: 200
6. Click "Create custom error response"
7. Click "Create custom error response" again
8. Fill in:
   - **HTTP error code**: 404
   - **Customize error response**: Yes
   - **Response page path**: `/index.html`
   - **HTTP response code**: 200
9. Click "Create custom error response"

✅ **Checkpoint**: 2 custom error responses created

---

### Step 13: Point Domain to CloudFront (10 minutes)

1. Go back to Hostinger DNS settings
2. **Delete any existing A records for @ or root domain** (if any)
3. Click "Add Record"
4. **For root domain**:
   - **Type**: A
   - **Name**: @ (or leave blank)
   - **Points to**: Your CloudFront domain (d1234abcd.cloudfront.net)
   - **TTL**: 3600
   - Click "Add Record"
5. Click "Add Record" again
6. **For www subdomain**:
   - **Type**: CNAME
   - **Name**: www
   - **Points to**: Your CloudFront domain (d1234abcd.cloudfront.net)
   - **TTL**: 3600
   - Click "Add Record"

✅ **Checkpoint**: DNS records added in Hostinger

---

### Step 14: Wait for Everything to Activate (30-60 minutes)

**What's happening:**
- CloudFront is deploying (15-30 minutes)
- DNS is propagating (5-60 minutes)

**Check CloudFront status:**
1. Go to CloudFront in AWS Console
2. Your distribution should show "Enabled" (not "Deploying")

**Check DNS propagation:**
1. Go to https://dnschecker.org
2. Enter: `srikarthikeyacaterers.in`
3. Should show your CloudFront domain

☕ **Take a break! Come back in 30-60 minutes**

✅ **Checkpoint**: CloudFront shows "Enabled", DNS checker shows CloudFront domain

---

### Step 15: Test Your Live Website! (5 minutes)

1. Open browser (use Incognito/Private mode)
2. Go to: https://srikarthikeyacaterers.in
3. Go to: https://www.srikarthikeyacaterers.in
4. Both should work with 🔒 padlock (SSL)

✅ **Checkpoint**: Website loads with HTTPS! 🎉

**If not working:**
- Wait another 30 minutes
- Clear browser cache (Ctrl+Shift+Delete)
- Try different browser
- Check CloudFront status is "Enabled"

---

## 🎯 PHASE 2: Setup GitHub Auto-Deployment

**Only do this AFTER Phase 1 is complete and website is live!**

### Step 16: Create IAM User for GitHub (10 minutes)

1. In AWS Console, search for "IAM"
2. Click "Users" in left sidebar
3. Click "Create user"
4. **User name**: `github-deploy`
5. Click "Next"
6. Select "Attach policies directly"
7. In search box, type "S3"
8. Check ✅ `AmazonS3FullAccess`
9. In search box, type "CloudFront"
10. Check ✅ `CloudFrontFullAccess`
11. Click "Next"
12. Click "Create user"

✅ **Checkpoint**: User `github-deploy` created

---

### Step 17: Create Access Keys (5 minutes)

1. Click on user `github-deploy`
2. Click "Security credentials" tab
3. Scroll to "Access keys"
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next"
7. Click "Create access key"
8. **IMPORTANT**: Copy both keys NOW:
   - Access key ID (starts with AKIA...)
   - Secret access key (long random string)
9. **Save these in a safe place** (you won't see secret again!)
10. Click "Done"

✅ **Checkpoint**: You have both keys saved

---

### Step 18: Get CloudFront Distribution ID (2 minutes)

1. Go to CloudFront in AWS Console
2. Copy your Distribution ID (starts with E, like E1234ABCDEFGH)
3. Save this

✅ **Checkpoint**: You have Distribution ID saved

---

### Step 19: Add Secrets to GitHub (10 minutes)

1. Go to your GitHub repository
2. Click "Settings" tab (top right)
3. Click "Secrets and variables" → "Actions" (left sidebar)
4. Click "New repository secret" (green button)

**Add these 5 secrets one by one:**

**Secret 1:**
- Name: `AWS_ACCESS_KEY_ID`
- Value: Your access key ID (from Step 17)
- Click "Add secret"

**Secret 2:**
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: Your secret access key (from Step 17)
- Click "Add secret"

**Secret 3:**
- Name: `AWS_S3_BUCKET`
- Value: `srikarthikeyacaterers.in`
- Click "Add secret"

**Secret 4:**
- Name: `AWS_REGION`
- Value: `ap-south-1`
- Click "Add secret"

**Secret 5:**
- Name: `CLOUDFRONT_DISTRIBUTION_ID`
- Value: Your distribution ID (from Step 18)
- Click "Add secret"

✅ **Checkpoint**: All 5 secrets added in GitHub

---

### Step 20: Push to GitHub (5 minutes)

1. Open terminal in your project folder
2. Run these commands:

```bash
git add .
git commit -m "Setup AWS auto-deployment"
git push origin main
```

3. Go to your GitHub repository
4. Click "Actions" tab
5. You should see a workflow running
6. Wait for green ✓ (takes 2-3 minutes)

✅ **Checkpoint**: GitHub Actions shows green ✓

---

### Step 21: Verify Auto-Deployment Works (5 minutes)

1. Make a small change to your website (e.g., change a text)
2. Run:
```bash
git add .
git commit -m "Test auto-deployment"
git push origin main
```
3. Go to GitHub → Actions tab
4. Watch the deployment
5. After 2-5 minutes, check your website
6. Your change should be live!

✅ **Checkpoint**: Changes appear on live website! 🎉

---

## 🎊 YOU'RE DONE!

### What You Have Now:
✅ Live website with SSL (HTTPS)
✅ Custom domain working
✅ Auto-deployment from GitHub
✅ CDN for fast loading worldwide
✅ Costs only ~$1/month

### Daily Workflow:
```bash
# Make changes to code
git add .
git commit -m "Your changes"
git push origin main
# Wait 2-5 minutes - website updates automatically!
```

---

## 📞 Need Help?

**Stuck on a step?**
1. Read the step again carefully
2. Check the checkpoint - did you complete it?
3. Wait a bit longer (DNS/CloudFront take time)
4. Check AWS CloudWatch logs for errors

**Common Issues:**

**Certificate stuck on "Pending validation"?**
- Wait 15-20 minutes total
- Check CNAME records in Hostinger are correct
- Make sure you're in us-east-1 region

**Website not loading?**
- Wait 30-60 minutes for DNS propagation
- Check CloudFront status is "Enabled"
- Clear browser cache
- Try incognito mode

**GitHub Actions failing?**
- Check all 5 secrets are added correctly
- Verify IAM user has correct permissions
- Check Actions logs for specific error

---

## 💰 Monthly Cost: ~$1

- S3: ~$0.50
- CloudFront: Free tier (1TB free)
- Certificate: FREE
- Route 53: $0 (using Hostinger DNS)

**Total: Less than a cup of coffee! ☕**

---

**Congratulations! You're now a web developer with a live production website! 🚀**
