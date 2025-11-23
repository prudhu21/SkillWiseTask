module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err?.stack || err);
  const status = err?.status || 500;
  const message = err?.message || 'Internal server error';
  const response = { message };
  if (process.env.NODE_ENV !== 'production') response.details = err?.stack || null;
  res.status(status).json(response);
};
