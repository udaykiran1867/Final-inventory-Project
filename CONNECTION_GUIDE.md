# Inventory Management System - Frontend & Backend Connection Guide

## Project Overview
This document outlines how the frontend (Next.js) and backend (Node.js/Express) are connected through a REST API.

## Architecture

### Backend (Node.js + Express)
- **Port**: 5000
- **Location**: `inventory-backend/`
- **Base URL**: `http://localhost:5000`
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)

### Frontend (Next.js)
- **Port**: 3000
- **Location**: `inventory-management-system/`
- **Framework**: Next.js 16
- **State Management**: React Context API (AuthContext, InventoryContext)

## API Endpoints Connected

### Authentication Endpoints
```
POST /auth/signup
  Body: { name, email, password }
  Response: { user }

POST /auth/login
  Body: { email, password }
  Response: { user, session }
```

### Product Endpoints
```
GET /products
  Response: Array of products with stock info

POST /products
  Body: { name, description, masterCount }
  Response: { id, name, description, ... }

PUT /products/:id/master
  Body: { masterCount }
  Response: { message }
```

### Transaction Endpoints
```
POST /transactions
  Body: { productId, student_name, usn, section, transaction_type, remarks }
  Response: { message }

PUT /transactions/:id/return
  Response: { message }
```

### Logs Endpoints
```
GET /logs/download?month=YYYY-MM
  Returns: PDF file download
```

## Connected Components

### Frontend - Auth Context
**File**: `inventory-management-system/lib/auth-context.js`
- Uses `authAPI.login()` and `authAPI.signup()` for real API calls
- Manages user authentication state
- Error handling and loading states

### Frontend - Inventory Context
**File**: `inventory-management-system/lib/inventory-context.js`
- Fetches products on mount using `productAPI.getAll()`
- Manages product and transaction operations
- Real-time state updates after API calls
- Download monthly reports via `logsAPI.downloadPDF()`

### Frontend - API Client
**File**: `inventory-management-system/lib/api.js`
- Centralized API call handler
- Organized by module: `authAPI`, `productAPI`, `transactionAPI`, `logsAPI`
- Reads from environment variable: `NEXT_PUBLIC_API_BASE_URL`

### Frontend - Pages
- **Login Page**: `components/pages/login-page.js` - Uses email for authentication
- **Register Page**: `components/pages/register-page.js` - Creates new user accounts
- **Dashboard**: Fetches and displays products from backend

## Environment Setup

### Backend (.env)
Create a `.env` file in `inventory-backend/`:
```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
Already configured in `inventory-management-system/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- Environment-based URL from `FRONTEND_URL`

## Running the Project

### Start Backend
```bash
cd inventory-backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### Start Frontend
```bash
cd inventory-management-system
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## Data Flow Example

### User Login Flow
1. User enters email & password on login page
2. Form submits to `LoginPage.handleSubmit()`
3. Calls `login()` from `useAuth()` hook
4. `login()` calls `authAPI.login(email, password)`
5. `authAPI` makes POST request to `http://localhost:5000/auth/login`
6. Backend verifies credentials via Supabase
7. Response returns user data
8. Frontend stores user in `AuthContext` state
9. Router redirects to `/dashboard/products`

### Product Fetch Flow
1. `InventoryProvider` mounts in app layout
2. `useEffect` triggers on mount
3. Calls `productAPI.getAll()`
4. Makes GET request to `http://localhost:5000/products`
5. Backend queries Supabase for all products
6. Returns products array
7. Frontend stores in `products` state
8. Components render product list

## Real API Integration Features

✅ Async/await based API calls
✅ Error handling with try-catch
✅ Loading states during API calls
✅ Automatic CORS configuration
✅ Environment-based API URL configuration
✅ Bearer token ready (can be added to headers)
✅ Proper HTTP methods (GET, POST, PUT, DELETE)
✅ JSON request/response handling
✅ Centralized API client for easy maintenance

## Testing the Connection

### Test Backend Health
```bash
curl http://localhost:5000/products
# Should return product list or empty array
```

### Test Authentication
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inventory.com","password":"admin123"}'
```

### Test from Frontend
Open browser DevTools (F12) > Network tab
1. Try login - observe POST to `/auth/login`
2. Go to products page - observe GET to `/products`
3. Add product - observe POST to `/products`

## Future Enhancements

- [ ] Add JWT token-based authentication
- [ ] Implement request interceptors for auth headers
- [ ] Add request/response caching
- [ ] Real-time updates using WebSocket
- [ ] File upload support for product images
- [ ] Advanced error handling and retry logic
