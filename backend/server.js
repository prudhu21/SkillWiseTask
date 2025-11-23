require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { init } = require('./db/init');
const productsRouter = require('./routes/products'); 

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

init({ seed: true });

app.use('/api/products', productsRouter);
console.log('[Server] mounted routes: /api/products');

app.use((err, req, res, next) => {
  console.error('[Server Error]', err?.stack || err);
  res.status(err?.status || 500).json({ message: err?.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
