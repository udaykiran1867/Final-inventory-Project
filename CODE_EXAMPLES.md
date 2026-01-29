# Code Examples - How Everything Works Together

## 1. How API Client Works

### File: `lib/api.js`

```javascript
// Base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Generic API call handler
export const apiCall = async (endpoint, options = {}) => {
  const { method = "GET", body = null, headers = {} } = options;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API Error");
  }

  return await response.json();
};

// Authentication module
export const authAPI = {
  signup: (name, email, password) =>
    apiCall("/auth/signup", {
      method: "POST",
      body: { name, email, password },
    }),

  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
};

// Products module
export const productAPI = {
  getAll: () => apiCall("/products", { method: "GET" }),

  add: (name, description, masterCount) =>
    apiCall("/products", {
      method: "POST",
      body: { name, description, masterCount },
    }),

  updateMaster: (id, masterCount) =>
    apiCall(`/products/${id}/master", {
      method: "PUT",
      body: { masterCount },
    }),
};
```

**Usage in components:**
```javascript
// In a component
import { productAPI } from '@/lib/api';

const products = await productAPI.getAll();
const newProduct = await productAPI.add("Arduino", "desc", 50);
```

---

## 2. How Auth Context Uses API

### File: `lib/auth-context.js`

```javascript
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { authAPI } from "./api";  // Import API client

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // REAL API CALL - not mock data!
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Call backend API
      const response = await authAPI.login(email, password);
      
      // Store user data from backend
      setUser({
        id: response.user?.id,
        email: response.user?.email,
        username: email.split("@")[0],
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Call backend API
      await authAPI.signup(username, email, password);
      
      // Auto-login after signup
      setUser({
        id: crypto.randomUUID(),
        username,
        email,
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,        // Now async!
        register,     // Now async!
        logout,
        error,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

---

## 3. How Login Page Uses Auth Context

### File: `components/pages/login-page.js` (Relevant Parts)

```javascript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()  // Get login function from context
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    // CALL REAL API through context
    const success = await login(email, password)

    if (success) {
      router.push("/dashboard/products")
    } else {
      setError("Invalid email or password")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  )
}
```

**Flow:**
1. User enters email & password
2. `handleSubmit` calls `login(email, password)` from context
3. Context calls `authAPI.login()` from API client
4. API client makes HTTP request to backend
5. Backend validates with Supabase
6. Response returns with user data
7. Context stores user and redirects

---

## 4. How Inventory Context Fetches Data

### File: `lib/inventory-context.js` (Relevant Parts)

```javascript
"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { productAPI, transactionAPI } from "./api";

const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FETCH PRODUCTS ON MOUNT
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Call backend API
        const data = await productAPI.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ADD PRODUCT VIA API
  const addProduct = useCallback(async (name, masterCount, availability) => {
    try {
      // Call backend API
      const newProduct = await productAPI.add(name, "description", masterCount);
      setProducts((prev) => [...prev, newProduct]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // ADD TRANSACTION VIA API
  const addBorrowRecord = useCallback(async (record) => {
    try {
      // Call backend API
      const response = await transactionAPI.create(
        record.productId,
        record.studentName,
        record.usn,
        record.section,
        record.type,
        record.remarks || ""
      );

      // Update local state with response
      const newRecord = {
        ...record,
        id: response.id || crypto.randomUUID(),
        createdAt: new Date(),
      };

      setBorrowRecords((prev) => [...prev, newRecord]);

      // Update product counts
      setProducts((prev) =>
        prev.map((product) => {
          if (product.id !== record.productId) return product;

          if (record.type === "purchase") {
            return {
              ...product,
              masterCount: product.masterCount - record.quantity,
              availability: product.availability - record.quantity,
            };
          } else {
            return {
              ...product,
              availability: product.availability - record.quantity,
            };
          }
        })
      );
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        products,
        borrowRecords,
        addProduct,
        addBorrowRecord,
        loading,
        error,
        // ... more functions
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be within InventoryProvider");
  }
  return context;
}
```

**Data Flow:**
1. Component mounts
2. `useEffect` runs
3. Calls `productAPI.getAll()`
4. API client makes GET request to backend
5. Backend queries Supabase database
6. Returns product array
7. Context stores in state
8. Components re-render with products

---

## 5. How Components Use Context

### In a Product Card Component

```javascript
import { useInventory } from '@/lib/inventory-context';

export function ProductCard({ product }) {
  const { addBorrowRecord } = useInventory();

  const handleBorrow = async () => {
    const success = await addBorrowRecord({
      productId: product.id,
      studentName: "John Doe",
      usn: "1MS21CS001",
      section: "A",
      type: "borrow",
      quantity: 1,
      remarks: "Course project"
    });

    if (success) {
      alert("Product borrowed successfully!");
    } else {
      alert("Failed to borrow product");
    }
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Available: {product.availability}</p>
      <button onClick={handleBorrow}>Borrow</button>
    </div>
  );
}
```

---

## 6. Complete Request/Response Cycle

### User Borrows a Product

```
FRONTEND
┌─────────────────────────────────────────┐
│ 1. User clicks "Borrow" button          │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 2. ProductCard.handleBorrow()          │
│    addBorrowRecord({...})              │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3. InventoryContext.addBorrowRecord() │
│    Calls transactionAPI.create()      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 4. API Client (lib/api.js)             │
│    Makes POST /transactions            │
└────────────┬────────────────────────────┘
             │
             │ HTTP POST Request
             │ Body: {
             │   productId: "1",
             │   student_name: "John",
             │   usn: "1MS21CS001",
             │   section: "A",
             │   transaction_type: "borrow",
             │   remarks: "Project"
             │ }
             │
BACKEND
┌────────────▼────────────────────────────┐
│ 5. POST /transactions                  │
│    transaction.routes.js               │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 6. transaction.controller.js            │
│    createTransaction()                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 7. Supabase Operations:                │
│    - INSERT student_transactions       │
│    - UPDATE product_stock              │
│    - INSERT inventory_logs             │
└────────────┬────────────────────────────┘
             │
             │ HTTP Response
             │ { message: "Transaction saved" }
             │
FRONTEND
┌────────────▼────────────────────────────┐
│ 8. Response received in API client     │
│    Return response object              │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 9. InventoryContext                    │
│    - Add to borrowRecords array        │
│    - Update product availability       │
│    - setBorrowRecords() (state update) │
│    - setProducts() (state update)      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 10. Components Re-render                │
│     - ProductCard shows new availability│
│     - BorrowRecords list updates       │
│     - Dashboard refreshes              │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 11. User sees updated UI               │
│     Product marked as borrowed ✅      │
└─────────────────────────────────────────┘
```

---

## 7. Error Handling Example

### API Call with Error Handling

```javascript
// In API client
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Check for HTTP errors
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "API Error");
    }

    return await response.json();
  } catch (error) {
    // Re-throw for component to handle
    throw error;
  }
};

// In component/context
const handleLogin = async (email, password) => {
  try {
    const success = await login(email, password);
    if (success) {
      // Success path
      router.push("/dashboard");
    }
  } catch (error) {
    // Error path
    setError(error.message);
    // Display error to user
  }
};
```

---

## 8. Environment Configuration

### Frontend (.env.local)
```bash
# Read by Next.js build process
# Available in browser as: process.env.NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Backend (.env)
```bash
# Read by Node.js process
PORT=5000
SUPABASE_URL=https://project.supabase.co
SUPABASE_KEY=your-key-here
FRONTEND_URL=http://localhost:3000
```

---

## Summary

The integration works because:

1. **API Client** (`lib/api.js`) - Handles all HTTP communication
2. **Contexts** (auth, inventory) - Use the API client to fetch data
3. **Components** - Use the contexts via hooks
4. **State Updates** - Flow back to UI through React re-renders
5. **Error Handling** - Propagates errors with user feedback

All real data flows from the database through this pipeline! 🚀
