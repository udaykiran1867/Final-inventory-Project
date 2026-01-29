# Quick Start - Running Frontend & Backend Together

## Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account (for backend)

## Step 1: Start Backend

```bash
cd inventory-backend
npm install
npm run dev
```

Expected output:
```
✅ Backend running on port 5000
```

## Step 2: Start Frontend (in a new terminal)

```bash
cd inventory-management-system
npm install
npm run dev
```

Expected output:
```
▲ Next.js 16.0.10
- Local: http://localhost:3000
```

## Step 3: Test the Connection

1. Open `http://localhost:3000` in your browser
2. Go to login page
3. Enter credentials (configured in Supabase)
4. If login succeeds, you're connected! ✅

## Files Modified for Connection

### Backend
- `src/app.js` - Added CORS configuration for localhost:3000

### Frontend
- `lib/api.js` - Created API client with all endpoints
- `lib/auth-context.js` - Connected to real backend authentication
- `lib/inventory-context.js` - Connected to real backend data
- `components/pages/login-page.js` - Updated to use email for login
- `components/pages/register-page.js` - Connected to backend registration
- `.env.local` - Added API URL configuration

## Troubleshooting

### Backend not responding
```
Error: Failed to fetch from http://localhost:5000
```
- Ensure backend is running on port 5000
- Check terminal output for errors
- Verify Supabase credentials in `.env`

### CORS error
```
Access to XMLHttpRequest blocked by CORS policy
```
- Backend CORS is pre-configured
- Ensure frontend is on `http://localhost:3000` (not 127.0.0.1)

### Login fails
- Check Supabase user exists
- Verify email/password are correct
- Check backend logs for errors

### Products not loading
- Ensure backend is running
- Check Supabase database has products table
- Open browser DevTools > Network tab to see request details

## API Testing with Curl

### Test Products Endpoint
```bash
curl http://localhost:5000/products
```

### Test Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Test Add Product
```bash
curl -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"Test","masterCount":10}'
```

## Environment Variables

### Backend (.env)
```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Backend port 5000 already in use | `lsof -i :5000` then kill the process |
| Frontend port 3000 already in use | `lsof -i :3000` then kill the process |
| Module not found errors | Run `npm install` in respective folder |
| Blank page on localhost:3000 | Check browser console (F12) for errors |
| API 404 errors | Verify backend is running and routes are correct |

## Next Steps

1. ✅ Frontend and backend are connected
2. Configure Supabase tables (products, students, transactions)
3. Add JWT token authentication
4. Implement real-time updates with WebSocket
5. Deploy to production

## Support

Check the detailed `CONNECTION_GUIDE.md` for:
- Complete API endpoint documentation
- Data flow examples
- Architecture overview
- Future enhancement suggestions
