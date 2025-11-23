const productModel = require('../models/productModel');
const { parseCSV } = require('../utils/csv'); 
const fs = require('fs');
const path = require('path');


const DEFAULT_IMAGE_PATH = '/mnt/data/fd0ae58f-91fe-4dd0-a77a-e36141a3c3f1.png';

function safeNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, safeNumber(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, safeNumber(req.query.limit, 10)));
    const sort = String(req.query.sort || 'name').toLowerCase();
    const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const search = req.query.search ? String(req.query.search).trim() : null;
    const category = req.query.category ? String(req.query.category).trim() : null;

    const result = await productModel.listProducts({ page, limit, sort, order, search, category });

    res.json(result);
  } catch (err) {
    console.error('[Server] getAll error:', err.stack || err);
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await productModel.getProductById(id);
    if (!row) return res.status(404).json({ message: 'Product not found' });

    if (!row.image) row.image = DEFAULT_IMAGE_PATH;
    res.json(row);
  } catch (err) {
    console.error('[Server] getById error:', err?.stack || err);
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.name || String(data.name).trim() === '') {
      return res.status(400).json({ message: 'Product name is required' });
    }
    data.stock = safeNumber(data.stock, 0);
    const created = await productModel.createProduct(data);
    res.status(201).json(created);
  } catch (err) {
    console.error('[Server] createProduct error:', err?.stack || err);
    if (String(err.message).toLowerCase().includes('unique') || String(err).toLowerCase().includes('constraint')) {
      return res.status(400).json({ message: 'Product already exists' });
    }
    next(err);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const all = await productModel.listProducts({ page: 1, limit: 1000000, sort: 'name', order: 'ASC', search, category });
    const rows = all.rows || all; 
    const header = ['id', 'name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const esc = (v) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      };
      lines.push([r.id, r.name, r.unit, r.category, r.brand, r.stock, r.status, r.image].map(esc).join(','));
    }
    const csvData = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    console.error('[Server] exportCSV error:', err.stack || err);
    next(err);
  }
};

exports.importCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file required' });

    const rows = await parseCSV(req.file.path); 
    const items = rows.map((r) => ({
      name: r.name?.trim(),
      unit: r.unit,
      category: r.category,
      brand: r.brand,
      stock: safeNumber(r.stock, 0),
      status: r.status,
      image: r.image || DEFAULT_IMAGE_PATH
    }));

    const result = await productModel.importMany(items);

    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

    res.json(result);
  } catch (err) {
    console.error('[Server] importCSV error:', err.stack || err);
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    if (data.stock != null) {
      const s = Number(data.stock);
      if (Number.isNaN(s)) return res.status(400).json({ message: 'stock must be a number' });
      data.stock = s;
    }

    const updated = await productModel.updateProduct(id, data);
    res.json(updated);
  } catch (err) {
    console.error('[Server] updateProduct error:', err.stack || err);
    if (String(err.message).toLowerCase().includes('exists') || String(err.message).toLowerCase().includes('not found')) {
      return res.status(400).json({ message: err.message });
    }
    const payload = { message: 'Server error during product update' };
    if (process.env.NODE_ENV !== 'production') payload.details = err.message;
    res.status(500).json(payload);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await productModel.getHistory(id);
    res.json(rows);
  } catch (err) {
    console.error('[Server] getHistory error:', err.stack || err);
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ok = await productModel.deleteProduct(id);
    if (!ok) return res.status(404).json({ message: 'Product not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[Server] deleteProduct error:', err?.stack || err);
    return res.status(500).json({ message: 'Server error deleting product', details: err?.message });
  }
};
