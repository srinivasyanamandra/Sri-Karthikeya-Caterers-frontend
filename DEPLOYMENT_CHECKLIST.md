# Quick Deployment Checklist

## ✅ Pre-Deployment
- [ ] AWS Account created
- [ ] Domain: srikarthikeyacaterers.in (from Hostinger)
- [ ] Node.js installed
- [ ] Project builds successfully (`npm run build`)

## ✅ AWS Setup (One-time)

### S3 Bucket
- [ ] Create bucket: `srikarthikeyacaterers.in`
- [ ] Region: ap-south-1 (Mumbai)
- [ ] Unblock public access
- [ ] Enable static website hosting
- [ ] Set bucket policy (public read)
- [ ] Upload build files

### SSL Certificate
- [ ] Switch to us-east-1 region
- [ ] Request certificate for both domains
- [ ] Choose DNS validation
- [ ] Copy CNAME records

### CloudFront
- [ ] Create distribution
- [ ] Select S3 bucket as origin
- [ ] Add both domains as CNAMEs
- [ ] Select SSL certificate
- [ ] Set default root object: index.html
- [ ] Update S3 bucket policy
- [ ] Add error pages (403, 404 → /index.html)
- [ ] Copy CloudFront domain

### DNS (Hostinger)
- [ ] Add SSL validation CNAME records
- [ ] Wait for certificate to be "Issued"
- [ ] Add A record: @ → CloudFront domain
- [ ] Add CNAME: www → CloudFront domain

## ✅ Testing
- [ ] Wait 15-30 minutes for CloudFront deployment
- [ ] Wait 1-2 hours for DNS propagation
- [ ] Test: https://srikarthikeyacaterers.in
- [ ] Test: https://www.srikarthikeyacaterers.in
- [ ] Verify SSL padlock appears

## ✅ Future Updates
- [ ] Run `npm run build`
- [ ] Upload to S3
- [ ] Create CloudFront invalidation: /*
- [ ] Wait 2-5 minutes

---

## 📝 Important URLs to Bookmark

- AWS Console: https://console.aws.amazon.com
- S3 Bucket: https://s3.console.aws.amazon.com/s3/buckets/srikarthikeyacaterers.in
- CloudFront: https://console.aws.amazon.com/cloudfront
- Certificate Manager: https://console.aws.amazon.com/acm (us-east-1)
- Hostinger DNS: https://hpanel.hostinger.com

---

## 💡 Quick Commands

```bash
# Build project
npm run build

# Or use the deploy script
deploy.bat
```

---

## 🆘 Emergency Contacts

- AWS Support: https://console.aws.amazon.com/support
- Hostinger Support: https://www.hostinger.com/contact
- DNS Checker: https://dnschecker.org

---

**Estimated Time: 1-2 hours for first deployment**
**Cost: ~$0.50-1/month**
