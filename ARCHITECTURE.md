# System Architecture & Connection Diagram

## High-Level Architecture

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         INVENTORY MANAGEMENT SYSTEM                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────┐   ┌──────────────────────────────┐
│      FRONTEND (Next.js)                │   │    BACKEND (Express.js)      │
│      Port: 3000                        │   │    Port: 5000                │
├────────────────────────────────────────┤   ├──────────────────────────────┤
│                                        │   │                              │
│  ┌─ Pages                             │   │  ┌─ API Routes             │
│  ├─ Login (/login)                    │   │  ├─ Auth (/auth)           │
│  ├─ Register (/register)              │   │  ├─ Products (/products)   │
│  ├─ Dashboard (/dashboard/products)   │   │  ├─ Transactions (/trans.) │
│  ├─ Analytics                         │   │  └─ Logs (/logs)           │
│  └─ ...more pages                     │   │                              │
│                                        │   │  ┌─ Controllers            │
│  ┌─ Context API                       │   │  ├─ auth.controller.js     │
│  ├─ AuthContext                       │   │  ├─ product.controller.js  │
│  │  (User state & auth)               │   │  ├─ transaction.ctrl.js    │
│  ├─ InventoryContext                  │   │  └─ logs.controller.js     │
│  │  (Products & transactions)         │   │                              │
│  └─ ...more contexts                  │   │  ┌─ Configuration          │
│                                        │   │  ├─ env.js                 │
│  ┌─ Hooks                             │   │  └─ supabase.js            │
│  ├─ useAuth()                         │   │                              │
│  ├─ useInventory()                    │   │
│  └─ ...more hooks                     │   │
│                                        │   │
│  ┌─ API Client (lib/api.js)           │   │
│  ├─ authAPI                           │   │
│  ├─ productAPI                        │   │
│  ├─ transactionAPI                    │   │
│  └─ logsAPI                           │   │
│                                        │   │
└────────────────────────────────────────┘   └──────────────────────────────┘
              │                                        ▲
              │  HTTP/REST API Calls                  │
              └────────────────────────────────────────┘
                   JSON Request/Response

                         ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase - PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │   profiles   │  │   products   │  │ product_stock   │  │ student_tx │  │
│  ├──────────────┤  ├──────────────┤  ├─────────────────┤  ├────────────┤  │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)         │  │ id (PK)    │  │
│  │ name         │  │ name         │  │ product_id (FK) │  │ prod_id    │  │
│  │ email        │  │ description  │  │ master_count    │  │ student_nm │  │
│  │ ...metadata  │  │ created_at   │  │ available_count │  │ usn        │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  └────────────┘  │
│                                                                              │
│  ┌──────────────────┐                                                      │
│  │ inventory_logs   │                                                      │
│  ├──────────────────┤                                                      │
│  │ id (PK)          │                                                      │
│  │ product_id (FK)  │                                                      │
│  │ action_type      │  (borrow, purchase, defective, etc.)                 │
│  │ quantity_changed │                                                      │
│  │ created_at       │                                                      │
│  └──────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. User Login Flow

```
User Input
    ↓
LoginPage.handleSubmit()
    ↓
useAuth().login(email, password)
    ↓
authAPI.login(email, password)
    ↓
fetch("http://localhost:5000/auth/login", { POST, body })
    ↓ HTTP Request
Backend: auth.routes.js → auth.controller.js
    ↓
Supabase: auth.signInWithPassword()
    ↓ User Data
AuthContext.setUser(user)
    ↓
useRouter().push("/dashboard/products")
    ↓
Dashboard Rendered ✅
```

### 2. Product Display Flow

```
App Mount
    ↓
InventoryProvider Component
    ↓
useEffect() Triggers
    ↓
productAPI.getAll()
    ↓
fetch("http://localhost:5000/products", { GET })
    ↓ HTTP Request
Backend: product.routes.js → product.controller.js
    ↓
Supabase: SELECT * FROM products
    ↓ Product Array
InventoryContext.setProducts(data)
    ↓
Component Re-render
    ↓
Products Displayed in UI ✅
```

### 3. Add Transaction Flow

```
User Action (Borrow/Purchase)
    ↓
Modal Dialog Submit
    ↓
InventoryContext.addBorrowRecord()
    ↓
transactionAPI.create(productId, studentName, ...)
    ↓
fetch("http://localhost:5000/transactions", { POST, body })
    ↓ HTTP Request
Backend: transaction.routes.js → transaction.controller.js
    ↓
Supabase: INSERT student_transactions + UPDATE product_stock
    ↓ Response
Local State Update: products & borrowRecords
    ↓
UI Re-render with Updated Data ✅
```

## API Endpoint Reference

```
╔═════════════════════════════════════════════════════════════════╗
║                    REST API ENDPOINTS                          ║
╚═════════════════════════════════════════════════════════════════╝

┌─ AUTHENTICATION
├─ POST /auth/signup
│  Request:  { name, email, password }
│  Response: { user: { id, email, name } }
│
└─ POST /auth/login
   Request:  { email, password }
   Response: { user: { id, email }, session: { ... } }

┌─ PRODUCTS
├─ GET /products
│  Response: [{ id, name, description, product_stock: {...} }]
│
├─ POST /products
│  Request:  { name, description, masterCount }
│  Response: { id, name, description, created_at }
│
└─ PUT /products/:id/master
   Request:  { masterCount }
   Response: { message: "Updated" }

┌─ TRANSACTIONS
├─ POST /transactions
│  Request:  { productId, student_name, usn, section, 
│              transaction_type, remarks, issue_date }
│  Response: { message: "Transaction saved" }
│
└─ PUT /transactions/:id/return
   Response: { message: "Product returned" }

┌─ LOGS
└─ GET /logs/download?month=2024-01
   Response: PDF file download
```

## CORS Configuration

```javascript
// Allowed Origins:
- http://localhost:3000        (Local development)
- http://127.0.0.1:3000        (Alternative localhost)
- process.env.FRONTEND_URL     (Production/Custom)

// Allowed Methods:
- GET, POST, PUT, DELETE, OPTIONS

// Allowed Headers:
- Content-Type
- Authorization (for future JWT)

// Credentials: true (for cookies/sessions)
```

## Request/Response Pattern

```
┌─ REQUEST
├─ Method: GET, POST, PUT, DELETE
├─ URL: http://localhost:5000/endpoint
├─ Headers: { "Content-Type": "application/json" }
└─ Body: JSON (for POST/PUT)

         ↓ Network

┌─ RESPONSE
├─ Status: 200 (success), 400 (error), 401 (auth), 500 (server)
├─ Headers: { "Content-Type": "application/json" }
└─ Body: JSON data or { error: "message" }
```

## Environment Variables

```
FRONTEND (.env.local):
├─ NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

BACKEND (.env):
├─ PORT=5000
├─ SUPABASE_URL=https://your-project.supabase.co
├─ SUPABASE_KEY=your-anon-key
└─ FRONTEND_URL=http://localhost:3000
```

## Connection Status Checklist

- [x] API Client created (`lib/api.js`)
- [x] Auth Context connected to backend
- [x] Inventory Context connected to backend
- [x] Login/Register pages use API
- [x] CORS configured for localhost:3000
- [x] Environment variables set
- [x] Error handling implemented
- [x] Loading states added
- [x] Async/await patterns used
- [x] Real API integration complete

## Ready for Production?

Before deploying:
- [ ] Update API_BASE_URL to production backend
- [ ] Configure production CORS origins
- [ ] Add JWT token authentication
- [ ] Implement request/response interceptors
- [ ] Add error logging/monitoring
- [ ] Test all API endpoints
- [ ] Performance optimize (caching, pagination)
- [ ] Security audit (input validation, HTTPS)
- [ ] Database backup strategy
- [ ] Deployment CI/CD pipeline
