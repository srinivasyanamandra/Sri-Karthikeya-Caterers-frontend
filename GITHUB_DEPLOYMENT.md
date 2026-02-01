# GitHub Actions Auto-Deployment Setup

## 🎯 What This Does
Automatically deploys your website to AWS whenever you push to GitHub!

---

## 📋 Setup Steps

### 1. Create AWS IAM User (One-time)

1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. **User name**: `github-deploy`
4. Click "Next"
5. Select "Attach policies directly"
6. Add these policies:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
7. Click "Next" → "Create user"

### 2. Create Access Keys

1. Click on the user `github-deploy`
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Application running outside AWS"
5. Click "Next" → "Create access key"
6. **IMPORTANT**: Copy both:
   - Access key ID
   - Secret access key
   - (You won't see the secret again!)

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add these secrets one by one:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | Your access key ID | AKIAIOSFODNN7EXAMPLE |
| `AWS_SECRET_ACCESS_KEY` | Your secret access key | wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY |
| `AWS_S3_BUCKET` | Your bucket name | srikarthikeyacaterers.in |
| `AWS_REGION` | Your AWS region | ap-south-1 |
| `CLOUDFRONT_DISTRIBUTION_ID` | Your CloudFront ID | E1234ABCDEFGH |

**To find CloudFront Distribution ID:**
- Go to CloudFront Console
- Copy the ID from the list (starts with E)

### 4. Push to GitHub

```bash
git add .
git commit -m "Add auto-deployment"
git push
```

---

## ✅ How It Works

1. You push code to GitHub **main branch only** (production)
2. GitHub Actions automatically:
   - Builds your React app
   - Uploads to S3
   - Invalidates CloudFront cache
3. Your website updates in 2-5 minutes!

**Note**: Only pushes to `main` branch trigger deployment. Other branches are ignored.

---

## 🔍 Check Deployment Status

1. Go to your GitHub repository
2. Click "Actions" tab
3. See the deployment progress
4. Green ✓ = Success
5. Red ✗ = Failed (check logs)

---

## 🚀 Daily Workflow

```bash
# Make changes to your code
# Then:
git add .
git commit -m "Your changes"
git push

# That's it! Website auto-updates!
```

---

## 🛠️ Manual Deployment (If Needed)

If you still want to deploy manually:

```bash
npm run build
# Then upload build folder to S3 manually
```

---

## 💡 Tips

- **Only `main` branch deploys to production**
- Create other branches (dev, staging) for testing - they won't auto-deploy
- Check "Actions" tab on GitHub to see deployment logs
- First deployment takes 2-3 minutes
- Subsequent deployments take 1-2 minutes

---

## 🆘 Troubleshooting

**Deployment fails?**
- Check all secrets are added correctly in GitHub
- Verify IAM user has correct permissions
- Check Actions logs for specific error

**Changes not appearing?**
- Wait 2-5 minutes for CloudFront invalidation
- Clear browser cache
- Check CloudFront invalidation status in AWS Console

---

## 🎉 Benefits

✅ No manual uploads  
✅ No AWS CLI needed  
✅ Automatic cache invalidation  
✅ Deployment history in GitHub  
✅ Rollback capability  

**Now you can focus on coding, not deploying!**
