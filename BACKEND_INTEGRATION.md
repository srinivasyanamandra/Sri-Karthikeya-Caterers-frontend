# Adding Spring Boot Backend Later

## ✅ Current Setup
- Frontend hosted on S3 + CloudFront
- No backend yet
- Cost: ~$1/month

## 🔌 When You're Ready to Add Backend

---

## Option 1: AWS Elastic Beanstalk (Recommended for Spring Boot)

**Cost: ~$10-15/month**
**Best for: Traditional Spring Boot apps**

### Steps:

1. **Package your Spring Boot app**
```bash
mvn clean package
# Creates: target/yourapp.jar
```

2. **Deploy to Elastic Beanstalk**
   - Go to AWS Console → Elastic Beanstalk
   - Create application
   - Platform: Java
   - Upload your .jar file
   - Get URL: `http://yourapp.elasticbeanstalk.com`

3. **Add custom domain (optional)**
   - In Hostinger DNS, add:
   - Type: CNAME
   - Name: api
   - Points to: yourapp.elasticbeanstalk.com
   - Result: `https://api.srikarthikeyacaterers.in`

4. **Update React app**
   - Create `.env` file in project root:
```
REACT_APP_API_URL=https://api.srikarthikeyacaterers.in
```

5. **Use in React components**
```javascript
import API_CONFIG from './config/api.config';

// Example: Contact form
fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

6. **Enable CORS in Spring Boot**
```java
@CrossOrigin(origins = "https://srikarthikeyacaterers.in")
@RestController
public class ContactController {
    // your endpoints
}
```

7. **Rebuild and deploy**
```bash
npm run build
git add .
git commit -m "Add API integration"
git push
```

---

## Option 2: AWS Lambda (Serverless - Cheapest)

**Cost: ~$0-5/month (free tier)**
**Best for: Low traffic, simple APIs**

### Steps:

1. Convert Spring Boot to Lambda functions
2. Deploy via AWS SAM or Serverless Framework
3. Get API Gateway URL
4. Update React app same as above

---

## Option 3: EC2 Instance (Full Control)

**Cost: ~$5-10/month (t2.micro/t3.micro)**
**Best for: Full control, complex apps**

### Steps:

1. Launch EC2 instance
2. Install Java
3. Deploy Spring Boot jar
4. Setup Nginx reverse proxy
5. Add SSL certificate
6. Point subdomain to EC2

---

## 🔒 Important: CORS Configuration

Your Spring Boot backend MUST allow requests from your frontend:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("https://srikarthikeyacaterers.in", 
                                  "https://www.srikarthikeyacaterers.in")
                    .allowedMethods("GET", "POST", "PUT", "DELETE")
                    .allowedHeaders("*");
            }
        };
    }
}
```

---

## 📝 Environment Variables

Create `.env` file in project root:

```bash
# Development (local backend)
REACT_APP_API_URL=http://localhost:8080

# Production (deployed backend)
# REACT_APP_API_URL=https://api.srikarthikeyacaterers.in
```

Add to `.gitignore`:
```
.env
.env.local
```

---

## 🎯 Recommended Approach

**Phase 1 (Now):** Deploy frontend only ✅
**Phase 2 (Later):** Deploy backend to Elastic Beanstalk
**Phase 3 (Optional):** Optimize with Lambda if needed

---

## 💰 Cost Comparison

| Option | Monthly Cost | Best For |
|--------|-------------|----------|
| Frontend only | ~$1 | Static sites |
| + Elastic Beanstalk | ~$11-16 | Spring Boot apps |
| + Lambda | ~$1-6 | Low traffic APIs |
| + EC2 t2.micro | ~$6-11 | Full control |

---

## ✅ What to Do Now

1. **Deploy frontend first** (follow COMPLETE_BEGINNER_GUIDE.md)
2. **Test frontend thoroughly**
3. **Later:** Come back to this guide when ready for backend
4. **Keep** `src/config/api.config.js` - you'll use it later

---

**For now, focus on getting the frontend live! Backend can wait. 🚀**
