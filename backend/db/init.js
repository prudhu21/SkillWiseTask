// backend/db/init.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '../inventory.db');

// ensure folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(DB_FILE);

// Small promise wrappers so we can use async/await in other files
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // allows access to lastID, changes
    });
  });
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init({ seed = true } = {}) {
  // run table creation in serialize to keep order deterministic
  db.serialize(async () => {
    try {
      await runAsync(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        unit TEXT,
        category TEXT,
        brand TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        status TEXT,
        image TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`);

      await runAsync(`CREATE TABLE IF NOT EXISTS inventory_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        old_quantity INTEGER,
        new_quantity INTEGER,
        change_date TEXT,
        user_info TEXT,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )`);

      // optional indexes
      await runAsync(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(LOWER(name));`);
      await runAsync(`CREATE INDEX IF NOT EXISTS idx_history_product ON inventory_history(product_id);`);

      // optional seed
      if (seed) {
        const row = await getAsync('SELECT COUNT(*) as cnt FROM products', []);
        const count = row ? row.cnt : 0;
        if (count === 0) {
          console.log('[DB] Seeding sample data...');
          const sample = [
            ['Blue Pen','piece','Stationery','Linc',120,'active','https://picsum.photos/seed/bluepen/150'],
            ['Red Pen','piece','Stationery','Reynolds',80,'active','https://picsum.photos/seed/redpen/150'],
            ['Notebook','book','Stationery','Classmate',50,'active','https://picsum.photos/seed/notebook/150'],
            ['USB Cable','unit','Electronics','Mi',40,'active','https://picsum.photos/seed/usbcable/150'],
            ['Laptop Stand','unit','Electronics','Portronics',10,'active','https://picsum.photos/seed/laptopstand/150']
          ];
          for (const p of sample) {
            await runAsync(
              `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              p
            );
          }
          console.log('[DB] Seed complete');
        } else {
          console.log('[DB] DB already has data; skipping seed');
        }
      }

      console.log('[DB] init completed, DB file:', DB_FILE);
    } catch (err) {
      console.error('[DB] init error:', err);
    }
  });
}

module.exports = { db, init, runAsync, getAsync, allAsync };
