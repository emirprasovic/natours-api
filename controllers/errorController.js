/* eslint-disable no-useless-escape */
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // console.log(err.errorResponse.errmsg);
  const value = err.errorResponse.errmsg.match(/name: \"([^\"]+)\"/);
  // console.log(value);
  const message = `Duplicate field value: '${value[1]}'. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API -----
  if (req.originalUrl.startsWith('/api')) {
    // operational errors -> our custom errors thrown by us
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // some unknown programming error
    }
    // Log error
    console.error('UNHANDLED ERROR :O ', err);
    // Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Error! Something went wrong :o',
    });
  }
  // RENDERED WEBSITE -----
  // Ako je error koji smo mi throwali, onda zelimo message
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  } else {
    // Ako je neki error sto mi nismo throwali, onda zelimo generic message
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, name: err.name, message: err.message }; // napravimo kopiju errora (KOPIJA JE SHALLOW, A ERROR NAME JE INHERITAN (nalazi se u prototype chainu) I NE SPADA U KOPIJU)
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
