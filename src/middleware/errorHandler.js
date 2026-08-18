export function errorHandler(err, req, res, next) {
  if (err.name === 'MulterError' || err.message?.includes('Only JPEG')) {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  if (status === 500) console.error(err);
  res.status(status).json({ message });
}