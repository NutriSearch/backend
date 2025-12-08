# Backend-Frontend Integration Checklist

## ✅ Completed

### Auth Flow
- ✅ Register with fullName, email, password (8+ chars, uppercase, lowercase, digit)
- ✅ Login with email/password + rememberMe option
- ✅ Auto-generated username from fullName
- ✅ Auto-generated avatar from ui-avatars API
- ✅ Logout (clear cookies & localStorage)
- ✅ Forgot password with reset tokens
- ✅ Password reset via token
- ✅ JWT token in cookies (httpOnly, secure)
- ✅ Bearer token support in Authorization header

### User Management
- ✅ Get current user (/auth/me)
- ✅ Update profile (name, preferences, etc)
- ✅ Update password (with current password verification)
- ✅ Profile data structure matches frontend (age, weight, height, goals, allergies, etc)

### Admin Routes
- ✅ /api/users - list all users (admin only)
- ✅ /api/users/:id - get user (admin)
- ✅ /api/users/:id - update user (admin)
- ✅ /api/users/:id - deactivate user (admin)

### Middleware
- ✅ auth.protect - JWT verification + user lookup
- ✅ auth.restrictTo - role-based access control
- ✅ auth.limitRequests - rate limiting (100/hour)
- ✅ Password change detection (invalidate old tokens)

### Semantic/Food Routes
- ✅ /api/semantic/search - search foods
- ✅ /api/semantic/food/:name - get food details
- ✅ /api/semantic/recommendations - personalized recommendations
- ✅ /api/semantic/stats - ontology stats

### API Responses
- ✅ Consistent { status, message, token, data } format
- ✅ Proper HTTP status codes (201, 400, 401, 403, 404, 500)
- ✅ Error handling with try/catch
- ✅ User sanitization (no password/tokens in responses)

### Security
- ✅ CORS enabled (localhost:5173)
- ✅ Cookie parser for token management
- ✅ Password hashing with bcrypt (12 salt)
- ✅ Request rate limiting
- ✅ JWT token expiration (7 days)

## 📋 Frontend Integration Points

### Login Page → Backend
```javascript
POST /api/auth/login
{
  email: string,
  password: string,
  rememberMe: boolean
}

Response: { token, user: {id, fullName, email, avatar, ...} }
```

### Register Page → Backend
```javascript
POST /api/auth/register
{
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
}

Response: { token, user: {...} }
```

### Update Profile → Backend
```javascript
PATCH /api/auth/update-me
Headers: Authorization: Bearer <token>
{
  fullName: string,
  preferences: {...},
  profile: {...}
}

Response: { user: {...} }
```

### Change Password → Backend
```javascript
PATCH /api/auth/update-password
Headers: Authorization: Bearer <token>
{
  currentPassword: string,
  newPassword: string
}

Response: { token, user: {...} }
```

## 🚀 Next Steps for Frontend Team

1. **Install API client**
   ```bash
   npm install axios
   ```

2. **Create API service** (e.g., `src/services/api.js`)
   ```javascript
   import axios from 'axios';
   
   const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
   
   export const authAPI = {
     register: (data) => axios.post(`${API_URL}/auth/register`, data),
     login: (data) => axios.post(`${API_URL}/auth/login`, data),
     logout: () => axios.post(`${API_URL}/auth/logout`),
     getMe: () => axios.get(`${API_URL}/auth/me`),
     updateProfile: (data) => axios.patch(`${API_URL}/auth/update-me`, data),
     changePassword: (data) => axios.patch(`${API_API}/auth/update-password`, data),
   };
   ```

3. **Update AuthContext** to use real API instead of localStorage mock
   - Call `/api/auth/register` instead of mock
   - Store token from response
   - Handle auth errors properly

4. **Test endpoints** with curl or Postman before frontend integration

## 🔗 Environment Variables

Add to frontend `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 Testing Checklist

- [ ] Register new user
- [ ] Login with email/password
- [ ] RememberMe persistence
- [ ] Update profile data
- [ ] Change password
- [ ] Token auto-refresh (to implement)
- [ ] Logout clears cookies
- [ ] Admin user access to /users route
- [ ] Non-admin blocked from /users
- [ ] Rate limiting (test 100+ requests)

## 🐛 Common Issues & Fixes

### CORS Error
- Ensure `CLIENT_URL=http://localhost:5173` in backend .env
- Check `credentials: true` in fetch/axios

### Token Not Persisting
- Clear browser cookies
- Check `HttpOnly` flag (cannot access from JS)
- Use Authorization header for API calls

### Password Validation Failed
- Password must be 8+ chars
- Must contain: Uppercase, lowercase, digit
- No special characters required (but allowed)

## 📞 Support
For integration issues, check:
- Backend logs: `npm run dev` output
- MongoDB connection: `mongosh`
- CORS settings: check browser DevTools Console
- Token expiry: 7 days by default

---
Last Updated: December 2024
Backend Version: 1.1.0
