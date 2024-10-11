class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // error 4xx client side fail; error 5xx server side error
    this.isOperational = true; // kako bismo razlikovali nase errore od defaultnih

    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
