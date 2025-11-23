// backend/routes/products.js
const express = require('express');
const upload = require('../middleware/upload'); // may be undefined or a multer instance
const ctrl = require('../controllers/productsController');

const router = express.Router();

// List with pagination/sort/filter
router.get('/', ctrl.getAll);

// Create product
router.post('/', ctrl.createProduct);

// Export CSV (optionally protect with auth middleware in future)
router.get('/export', ctrl.exportCSV);

// Import CSV (safe-guard if upload is missing)
if (upload && typeof upload.single === 'function') {
  router.post('/import', upload.single('csvFile'), ctrl.importCSV);
} else {
  // fallback handler that returns 400, preventing crashes in environments without multer
  router.post('/import', (req, res) => res.status(400).json({ message: 'CSV import not available (multer not configured)' }));
}

// Product history
router.get('/:id/history', ctrl.getHistory);

// Get product by id
router.get('/:id', ctrl.getById);

// Update product
router.put('/:id', ctrl.updateProduct);

// Delete product
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
