# 🔧 Registration Error Fix Guide

## The Problem
You're seeing 401 and 400 errors when trying to register. This means:
- **401 Unauthorized**: Backend authentication issue with Supabase
- **400 Bad Request**: Request validation or missing fields

## Quick Fix Steps

### 1. Check Backend Environment Variables

Create or update `inventory-backend/.env`:

```bash
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
FRONTEND_URL=http://localhost:3000
```

**Important:** 
- Use your **service role key** (not anon key) for `SUPABASE_SERVICE_KEY`
- Find this in Supabase Dashboard → Project Settings → API
- The service role key starts with `eyJ...` and is much longer

### 2. Restart Backend Server

Stop and restart your backend:

```bash
# Press Ctrl+C to stop the server
# Then start again
cd inventory-backend
npm run dev
```

### 3. Check Supabase Setup

In your Supabase Dashboard:

1. **Authentication Settings**:
   - Go to Authentication → Settings
   - Enable "Email" provider
   - Disable "Confirm email" for testing (or check email for confirmation)

2. **Create Profiles Table** (if not exists):
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Check RLS Policies**:
   - Either disable RLS for testing
   - Or create proper policies for profiles table

### 4. Test the Connection

Open your browser console (F12) and try to register. You should see:

**Successful Request:**
```
POST http://localhost:5000/auth/signup
Status: 200 OK
Response: { message: "Signup successful" }
```

**If Still Failing:**
Check the exact error message in:
- Browser console (F12 → Console tab)
- Backend terminal output
- Network tab (F12 → Network → Click the failed request)

## Updated Code

I've already fixed the frontend code to:
- ✅ Added proper error handling with try-catch
- ✅ Show errors from auth context
- ✅ Display detailed error messages
- ✅ Fixed async/await pattern

## Common Issues & Solutions

### Issue 1: "User already registered" (400)
**Solution:** The email is already in Supabase. Try:
- Use a different email
- OR delete the user from Supabase → Authentication → Users

### Issue 2: "Invalid API key" (401)
**Solution:** 
- Check your `SUPABASE_SERVICE_KEY` is correct
- Make sure it's the **service role key**, not anon key
- Restart the backend after updating .env

### Issue 3: "Email not confirmed" (400)
**Solution:**
- Go to Supabase → Authentication → Settings
- Disable "Confirm email" under "Email Auth"
- OR check your email for confirmation link

### Issue 4: "Database error" (500)
**Solution:**
- Create the profiles table (SQL above)
- Check table permissions in Supabase

### Issue 5: CORS errors
**Solution:** Backend CORS is already configured for localhost:3000

## Testing Without Supabase (Temporary)

If you want to test without setting up Supabase right now, you can temporarily modify the backend to use mock authentication:

**File:** `inventory-backend/src/controllers/auth.controller.js`

```javascript
// Temporary mock signup (ONLY FOR TESTING)
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  
  // Mock response for testing
  res.json({ 
    message: 'Signup successful',
    user: { id: '123', email, name }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Mock login for testing
  res.json({
    user: { id: '123', email },
    session: { access_token: 'mock-token' }
  });
};
```

**⚠️ Remember to restore the real Supabase code later!**

## Verify Everything Works

### Test 1: Backend is Running
```bash
curl http://localhost:5000/products
# Should return [] or product list
```

### Test 2: Registration Endpoint
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Should return: { message: "Signup successful" }
```

### Test 3: Frontend Registration
1. Go to http://localhost:3000/register
2. Fill in all fields
3. Check browser console for errors
4. Check backend terminal for logs

## Next Steps

1. ✅ Set up Supabase credentials in .env
2. ✅ Restart backend server
3. ✅ Try registration again
4. ✅ Check the specific error message
5. ✅ Follow the solution for that error above

## Still Not Working?

If you're still getting errors, please share:
1. The exact error message from browser console
2. Backend terminal output when you try to register
3. Your Supabase project status (is it active?)

The code is now properly set up for error handling and will show you the exact issue!
