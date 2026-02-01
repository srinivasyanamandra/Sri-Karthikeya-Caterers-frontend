# Quick Checklist - Print This!

## ✅ PHASE 1: AWS Setup (Do First!)

- [ ] 1. Create AWS Account (15 min)
- [ ] 2. Build website: `npm run build` (5 min)
- [ ] 3. Create S3 bucket: `srikarthikeyacaterers.in` (10 min)
- [ ] 4. Enable static website hosting (5 min)
- [ ] 5. Add bucket policy (5 min)
- [ ] 6. Upload files from `build` folder (10 min)
- [ ] 7. Test S3 endpoint URL (2 min)
- [ ] 8. Request SSL certificate in us-east-1 (10 min)
- [ ] 9. Add CNAME records to Hostinger (15 min)
- [ ] 10. Wait for certificate "Issued" status (10 min)
- [ ] 11. Create CloudFront distribution (15 min)
- [ ] 12. Update S3 bucket policy (5 min)
- [ ] 13. Add error pages (403, 404) (5 min)
- [ ] 14. Add DNS records in Hostinger (10 min)
- [ ] 15. Wait 30-60 minutes ☕
- [ ] 16. Test: https://srikarthikeyacaterers.in 🎉

**Stop here! Make sure website is live before continuing!**

---

## ✅ PHASE 2: GitHub Auto-Deployment

- [ ] 17. Create IAM user: `github-deploy` (10 min)
- [ ] 18. Create access keys (5 min)
- [ ] 19. Save: Access Key ID & Secret Key
- [ ] 20. Get CloudFront Distribution ID
- [ ] 21. Add 5 secrets to GitHub:
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
  - [ ] AWS_S3_BUCKET
  - [ ] AWS_REGION
  - [ ] CLOUDFRONT_DISTRIBUTION_ID
- [ ] 22. Push to GitHub: `git push origin main`
- [ ] 23. Check GitHub Actions - green ✓
- [ ] 24. Test auto-deployment with a change

---

## 🎊 DONE!

**Total Time: 2-3 hours**
**Monthly Cost: ~$1**

---

## 📝 Important Info to Save:

**AWS Region:** ap-south-1 (Mumbai)

**S3 Bucket:** srikarthikeyacaterers.in

**CloudFront Domain:** _________________ (save this)

**Distribution ID:** _________________ (save this)

**Access Key ID:** _________________ (save this)

**Secret Access Key:** _________________ (save this - you won't see it again!)

---

## 🚀 Daily Workflow After Setup:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Wait 2-5 minutes → Website updates! 🎉
