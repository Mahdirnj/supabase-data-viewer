# Security Best Practices Guide

This guide outlines additional security measures to protect your API keys and enhance the overall security of your application.

## 1. Backend Proxy Implementation (Already Implemented)

By moving API calls to a backend server, you've already taken the first important step to secure your Supabase API keys. The keys are now stored only on the server side and are not exposed to the client.

## 2. Additional Security Measures

### A. Implement Authentication

Add user authentication to your backend API to ensure only authorized users can access your data:

```javascript
// Example using JWT for authentication
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// Apply to protected routes
app.get('/api/professors', authenticate, async (req, res) => {
  // Your existing code here
});
```

### B. Add Rate Limiting

Protect your API from abuse by implementing rate limiting:

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply to all API routes
app.use('/api/', apiLimiter);
```

### C. Use HTTPS

Always use HTTPS in production to encrypt data in transit:

```javascript
const https = require('https');
const fs = require('fs');

// In production
if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync('path/to/private.key'),
    cert: fs.readFileSync('path/to/certificate.crt')
  };
  
  https.createServer(options, app).listen(443, () => {
    console.log('HTTPS server running on port 443');
  });
} else {
  // Development HTTP server
  app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });
}
```

### D. Add Security Headers

Implement security headers to protect against common web vulnerabilities:

```javascript
const helmet = require('helmet');

// Add security headers
app.use(helmet());
```

### E. Validate and Sanitize Input

Always validate and sanitize user input to prevent injection attacks:

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/professors', [
  body('name').trim().isLength({ min: 2 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('department').trim().not().isEmpty().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process valid data
});
```

### F. Implement Proper Error Handling

Use proper error handling to avoid leaking sensitive information:

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't expose error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'An unexpected error occurred' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
```

### G. Use Environment Variables for Configuration

Store all sensitive configuration in environment variables:

```javascript
// .env file (never commit to version control)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret

// In your code
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
```

## 3. Frontend Security

### A. Implement Content Security Policy

Add a Content Security Policy to protect against XSS attacks:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com">
```

### B. Use HttpOnly Cookies

Store authentication tokens in HttpOnly cookies to prevent JavaScript access:

```javascript
// On your backend when setting cookies
res.cookie('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600000 // 1 hour
});
```

### C. Implement CSRF Protection

Protect against Cross-Site Request Forgery attacks:

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to routes that change state
app.post('/api/professors', csrfProtection, async (req, res) => {
  // Your code here
});

// Provide CSRF token to frontend
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## 4. Regular Security Maintenance

1. Keep all dependencies updated to patch security vulnerabilities
2. Regularly audit your code for security issues
3. Monitor your application for unusual activity
4. Implement logging for security-relevant events
5. Create a security incident response plan

## 5. Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://github.com/nodejs/security-wg)
- [Supabase Security Documentation](https://supabase.io/docs/guides/auth)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)