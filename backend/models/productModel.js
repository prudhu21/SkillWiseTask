// backend/models/productModel.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = path.join(__dirname, '..', 'inventory.db');
const db = new sqlite3.Database(DB_FILE);

// fallback image (your uploaded file)
const DEFAULT_IMAGE = '/mnt/data/a3417286-95ca-4731-aa4f-3532ce8bf4e5.png';

// Promisify helper
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Initialize DB and tables
async function init() {
  const createProducts = `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    unit TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT,
    image TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`;
  const createHistory = `CREATE TABLE IF NOT EXISTS inventory_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    old_quantity INTEGER,
    new_quantity INTEGER,
    change_date TEXT,
    user_info TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`;
  await run(createProducts);
  await run(createHistory);
}
init().catch((e) => console.error('DB init error', e));

// Helper to build WHERE from search/category
function buildWhereAndParams({ search, category }) {
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('LOWER(name) LIKE ?');
    params.push(`%${String(search).toLowerCase()}%`);
  }
  if (category) {
    clauses.push('LOWER(category) = ?');
    params.push(String(category).toLowerCase());
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  return { where, params };
}

// List products with optional pagination/sort/search
async function listProducts({ page = 1, limit = 100, sort = 'name', order = 'ASC', search, category } = {}) {
  // sanitize sort/order
  const allowedSort = ['name', 'stock', 'category', 'brand', 'created_at'];
  const s = allowedSort.includes(sort) ? sort : 'name';
  const o = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const offset = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const { where, params } = buildWhereAndParams({ search, category });

  const totalRow = await get(`SELECT COUNT(1) as total FROM products ${where}`, params);
  const total = totalRow ? totalRow.total : 0;

  const rows = await all(
    `SELECT * FROM products ${where} ORDER BY ${s} ${o} LIMIT ? OFFSET ?`,
    params.concat([limit, offset])
  );
  // ensure image fallback
  for (const r of rows) {
    if (!r.image) r.image = DEFAULT_IMAGE;
  }
  return { rows, total };
}

// Get single product
async function getProductById(id) {
  const row = await get('SELECT * FROM products WHERE id = ?', [id]);
  if (!row) return null;
  if (!row.image) row.image = DEFAULT_IMAGE;
  return row;
}

// Create product
async function createProduct(data) {
  const image = data.image || DEFAULT_IMAGE;
  const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const { lastID } = await run(sql, [
    data.name,
    data.unit || null,
    data.category || null,
    data.brand || null,
    Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
    data.status || 'active',
    image,
  ]);
  return getProductById(lastID);
}

// Update product and add inventory_history when stock changes
async function updateProduct(id, data, userInfo = null) {
  // fetch existing
  const existing = await getProductById(id);
  if (!existing) throw new Error('Product not found');

  const newStock = data.stock != null ? Number(data.stock) : existing.stock;
  const updates = {
    name: data.name != null ? data.name : existing.name,
    unit: data.unit != null ? data.unit : existing.unit,
    category: data.category != null ? data.category : existing.category,
    brand: data.brand != null ? data.brand : existing.brand,
    stock: Number.isFinite(newStock) ? newStock : existing.stock,
    status: data.status != null ? data.status : existing.status,
    image: data.image != null ? data.image : existing.image,
  };

  // Validate unique name (if changed)
  if (updates.name !== existing.name) {
    const row = await get('SELECT id FROM products WHERE LOWER(name) = ? AND id != ?', [updates.name.toLowerCase(), id]);
    if (row) throw new Error('Product with this name already exists');
  }

  // If stock changed, insert history
  if (Number(existing.stock) !== Number(updates.stock)) {
    const insertHist = `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date, user_info) VALUES (?, ?, ?, ?, ?)`;
    await run(insertHist, [id, existing.stock, updates.stock, new Date().toISOString(), userInfo || null]);
  }

  // Update product
  const sql = `UPDATE products SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ? WHERE id = ?`;
  await run(sql, [
    updates.name,
    updates.unit,
    updates.category,
    updates.brand,
    updates.stock,
    updates.status,
    updates.image,
    id,
  ]);

  return getProductById(id);
}

// Get history for a product (sorted desc)
async function getHistory(productId) {
  const rows = await all(
    `SELECT id, product_id, old_quantity, new_quantity, change_date, user_info FROM inventory_history WHERE product_id = ? ORDER BY datetime(change_date) DESC`,
    [productId]
  );
  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    old_quantity: r.old_quantity,
    new_quantity: r.new_quantity,
    change_date: r.change_date,
    user_info: r.user_info,
  }));
}

// Bulk import with duplicate-check by name (case-insensitive)
async function importMany(items = []) {
  const added = [];
  const skipped = [];
  const duplicates = [];

  for (const it of items) {
    if (!it.name || String(it.name).trim() === '') {
      skipped.push({ reason: 'missing name', item: it });
      continue;
    }
    const name = String(it.name).trim();
    const existing = await get('SELECT id FROM products WHERE LOWER(name) = ?', [name.toLowerCase()]);
    if (existing) {
      duplicates.push({ name, existingId: existing.id });
      skipped.push({ reason: 'duplicate', item: it });
      continue;
    }
    const img = it.image || DEFAULT_IMAGE;
    const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const { lastID } = await run(sql, [
      name,
      it.unit || null,
      it.category || null,
      it.brand || null,
      Number.isFinite(Number(it.stock)) ? Number(it.stock) : 0,
      it.status || 'active',
      img,
    ]);
    added.push({ id: lastID, name });
  }

  return { addedCount: added.length, skippedCount: skipped.length, added, skipped, duplicates };
}

// Delete product
async function deleteProduct(id) {
  const { changes } = await run('DELETE FROM products WHERE id = ?', [id]);
  return changes > 0;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  getHistory,
  importMany,
  deleteProduct,
  DEFAULT_IMAGE,
};
