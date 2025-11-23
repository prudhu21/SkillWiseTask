# Inventory Management App

Full-stack Inventory Management assignment (Skillwise) — React frontend + Node/Express backend + SQLite database.

---

## Quick overview

This project implements a product inventory system with features required by the assignment:

* Product list (image, name, unit, category, brand, stock, status, actions)
* Inline editing of product rows
* Inventory history tracking (records old → new stock changes)
* CSV import / export
* Product images served (or referenced) reliably
* Simple frontend-only login (default credentials) and header UI showing `Hi, <username>` and Logout
* Pagination & sorting (server-supported)
* Toast notifications for save/delete/cancel actions

---

## Directory structure (recommended)

```
root/
├─ backend/
│  ├─ controllers/
│  │  └─ productsController.js
│  ├─ middleware/
│  │  └─ auth.js
│  ├─ models/
│  │  └─ productModel.js
│  ├─ routes/
│  │  └─ products.js
│  ├─ uploads/            # static product images (serve with express.static)
│  ├─ inventory.db        # SQLite DB file (created at runtime)
│  └─ server.js
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ ProductRow.tsx
│  │  │  ├─ ProductTable.tsx
│  │  │  ├─ ImportExport.tsx
│  │  │  └─ HistorySidebar.tsx
│  │  ├─ context/
│  │  │  └─ AuthContext.tsx
│  │  ├─ pages/
│  │  │  ├─ ProductsPage.tsx
│  │  │  └─ Login.tsx
│  │  ├─ services/
│  │  │  └─ api.ts
│  │  └─ App.tsx
│  └─ package.json
└─ README.md
```

---

## Files you should already have (important)

* `backend/models/productModel.js` — contains DB init and functions: `listProducts`, `getProductById`, `createProduct`, `updateProduct`, `getHistory`, `importMany`, `deleteProduct`.
* `backend/controllers/productsController.js` — controllers wired to model functions and providing CSV export/import logic.
* `backend/routes/products.js` — routes mapping to controllers.
* `frontend/src/components/ProductRow.tsx` — row component with edit/save/delete and toast notifications.
* `frontend/src/pages/Login.tsx` and `frontend/src/context/AuthContext.tsx` — simple auth storing username in localStorage.
* `frontend/src/services/api.ts` — axios instance that reads base URL from `import.meta.env.VITE_API_BASE` or falls back to `http://localhost:5000/api`.

---

## Quick start (development)

### Backend (Node + Express + SQLite)

1. Open terminal and go to `backend/`:

```bash
cd backend
npm install
```

2. Create uploads folder and copy any sample images (optional):

```bash
mkdir -p uploads
# copy a fallback image (example path used during development)
# If you have the sample image provided during the task, it lives at:
# /mnt/data/a3417286-95ca-4731-aa4f-3532ce8bf4e5.png
# Copy it into uploads as redpen.png for deterministic serving:
cp /mnt/data/a3417286-95ca-4731-aa4f-3532ce8bf4e5.png uploads/redpen.png
```

3. Start server (development):

```bash
# add a start/dev script in package.json if not present
node server.js
# or with nodemon
npx nodemon server.js
```

Server will create `inventory.db` automatically and initialize `products` and `inventory_history` tables.

### Frontend (React)

1. Open terminal and go to `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

2. Open browser at `http://localhost:5173` (or port shown by Vite).

---

## Environment variables

Frontend (Vite):

* `VITE_API_BASE` — optional base URL for API, e.g. `http://localhost:5000/api`

Backend:

* `.env` (optional)

  * `PORT` (default 5000)
  * `JWT_SECRET` (if you add JWT auth)

---

## API Endpoints (summary)

**Base**: `http://localhost:5000/api`

* `GET /products` — list products (supports: `page`, `limit`, `sort`, `order`, `search`, `category`)
* `GET /products/:id` — get single product
* `PUT /products/:id` — update product (body includes `userInfo` optional — used for inventory history)
* `DELETE /products/:id` — delete product
* `GET /products/:id/history` — returns inventory history (sorted by newest first)
* `POST /products/import` — multipart form upload `csvFile` (requires multer setup)
* `GET /products/export` — download CSV of all products

If you add auth:

* `POST /auth/login` — returns token (not required for basic assignment; frontend-only login exists)

---

## CSV format for import

CSV should contain header and rows with these columns (order recommended):

```
name,unit,category,brand,stock,status,image
```

Example row:

```
Red Pen,piece,Stationery,Reynolds,80,active,http://localhost:5000/uploads/redpen.png
```

Notes:

* `name` must be unique (case-insensitive) — duplicates will be skipped and returned in the import summary.
* `image` can be a full URL or path. For deterministic grading, prefer backend-served paths like `http://<host>/uploads/<file>.png`.

---

## Inventory history behavior

* When `PUT /products/:id` changes `stock`, the server inserts a row in `inventory_history` with: `product_id, old_quantity, new_quantity, change_date, user_info`.
* `GET /products/:id/history` returns these logs ordered by `change_date DESC`.
* Frontend shows these logs in `HistorySidebar` component.

---

## Default credentials (for frontend-only auth)

* **Username:** `admin`
* **Password:** `password`

This login is frontend-only and stores username in `localStorage`. You can extend to real JWT auth easily by implementing `/auth/login`.

---

## Useful developer tips

* If images fail to resolve from external hosts during grading or offline demos, copy deterministic images into `backend/uploads` and reference them via `http://localhost:5000/uploads/<file>` in CSV and seed data.
* To seed the DB for testing, create a small script that inserts a handful of products using `productModel.createProduct`.
* Use the `productModel.importMany` helper to bulk import CSV-parsed rows.

---

## Testing

(Optional) Add tests:

* Backend: Supertest + Mocha/Jest for endpoints: `GET /products`, `POST /products/import`.
* Frontend: Jest + React Testing Library for `ProductRow` (editing/save flow) and `ProductsPage` (fetch & pagination).

---

## Deployment

* Backend: Deploy to Render/Railway. Ensure `inventory.db` is stored on a writable filesystem or move to PostgreSQL for production.
* Frontend: Deploy to Vercel/Netlify and set `VITE_API_BASE` to your backend URL.

---

## Submission checklist

* [ ] Public GitHub repo URL
* [ ] Deployed backend URL (Render/Railway) with `/api` base
* [ ] Deployed frontend URL (Vercel/Netlify)
* [ ] CSV import/export works end-to-end
* [ ] Inventory history logs on stock update are present
* [ ] README contains demo credentials and run instructions

---

If you want, I can also:

* Generate a seeded `products.csv` with deterministic images and data for import.
* Provide `seed.js` to pre-populate `inventory.db` with sample products + history logs.
* Create `utils/csv.js` for parsing uploads using `csv-parser`.

Tell me which of those you want next.
