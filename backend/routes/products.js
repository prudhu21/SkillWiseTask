const express = require('express');
const upload = require('../middleware/upload'); // may be undefined or a multer instance
const ctrl = require('../controllers/productsController');

const router = express.Router();

router.get('/', ctrl.getAll);

router.post('/', ctrl.createProduct);

router.get('/export', ctrl.exportCSV);

if (upload && typeof upload.single === 'function') {
  router.post('/import', upload.single('csvFile'), ctrl.importCSV);
} else {
  router.post('/import', (req, res) => res.status(400).json({ message: 'CSV import not available (multer not configured)' }));
}

router.get('/:id/history', ctrl.getHistory);

router.get('/:id', ctrl.getById);

router.put('/:id', ctrl.updateProduct);

router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
