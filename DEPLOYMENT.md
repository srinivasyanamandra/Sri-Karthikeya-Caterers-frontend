# Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console.log statements in production code
- [ ] Environment variables configured

### Performance
- [ ] Images optimized
- [ ] Bundle size analyzed (`npm run analyze`)
- [ ] Lighthouse score > 90
- [ ] No render-blocking resources

### SEO
- [ ] Meta tags updated
- [ ] Sitemap generated
- [ ] robots.txt configured
- [ ] Structured data validated
- [ ] Open Graph tags tested

### Security
- [ ] Dependencies updated (`npm audit`)
- [ ] No exposed secrets
- [ ] HTTPS configured
- [ ] Security headers set
- [ ] CORS configured

### Accessibility
- [ ] WCAG 2.1 AA compliance checked
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast validated

## Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create `.env.production` file:
```env
REACT_APP_NAME=Srikarthikeya Caterers
REACT_APP_VERSION=1.0.0
REACT_APP_PHONE_PRIMARY=+918790730110
REACT_APP_EMAIL=info@srikarthikeyacaterers.in
```

### 3. Build for Production
```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Deployment Options

### Option 1: Netlify (Recommended)

#### Via Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

#### Via Netlify UI
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables
5. Deploy

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Option 2: Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 3: AWS S3 + CloudFront

#### 1. Build
```bash
npm run build
```

#### 2. Upload to S3
```bash
aws s3 sync build/ s3://your-bucket-name --delete
```

#### 3. Invalidate CloudFront
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 4: GitHub Pages

#### 1. Install gh-pages
```bash
npm install --save-dev gh-pages
```

#### 2. Add to package.json
```json
{
  "homepage": "https://yourusername.github.io/srikarthikeya-caterers",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

#### 3. Deploy
```bash
npm run deploy
```

## Post-Deployment

### 1. Verify Deployment
- [ ] Website loads correctly
- [ ] All pages accessible
- [ ] Forms working
- [ ] Images loading
- [ ] No console errors

### 2. Performance Testing
```bash
# Run Lighthouse
lighthouse https://www.srikarthikeyacaterers.in --view

# Check Web Vitals
# Use Chrome DevTools or web.dev/measure
```

### 3. SEO Verification
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt
- [ ] Test structured data (schema.org validator)
- [ ] Check Open Graph tags (Facebook Debugger)
- [ ] Verify Twitter Cards

### 4. Monitoring Setup
- [ ] Google Analytics configured
- [ ] Error tracking (Sentry) setup
- [ ] Uptime monitoring
- [ ] Performance monitoring

## Environment-Specific Configuration

### Development
```env
REACT_APP_ENV=development
REACT_APP_API_URL=http://localhost:3001
```

### Staging
```env
REACT_APP_ENV=staging
REACT_APP_API_URL=https://staging-api.srikarthikeyacaterers.in
```

### Production
```env
REACT_APP_ENV=production
REACT_APP_API_URL=https://api.srikarthikeyacaterers.in
```

## Rollback Procedure

### Netlify/Vercel
1. Go to Deployments
2. Select previous working deployment
3. Click "Publish deploy"

### AWS S3
1. Restore from S3 versioning
2. Invalidate CloudFront cache

### GitHub Pages
1. Revert commit
2. Run `npm run deploy`

## Continuous Deployment

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

## Domain Configuration

### Custom Domain Setup
1. Purchase domain
2. Configure DNS records:
   ```
   A     @     192.0.2.1
   CNAME www   your-site.netlify.app
   ```
3. Enable HTTPS
4. Update canonical URLs

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

### 404 Errors
- Configure server redirects to index.html
- Check routing configuration

### Slow Loading
- Analyze bundle size
- Optimize images
- Enable compression
- Use CDN

## Support

For deployment issues:
- Email: devops@srikarthikeyacaterers.in
- Documentation: See TECHNICAL_DOCS.md

---

**Last Updated**: 2024
**Maintained By**: DevOps Team
