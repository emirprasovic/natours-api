/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// app.use((req, res, next) => {
//   res.setHeader(
//     'Content-Security-Policy',
//     "script-src 'self' https://cdnjs.cloudflare.com",
//   );
//   next();
// });

// express po defaultu supporta pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security http headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // da nam ispise u konzoli brief overview svakog requesta
}

const limiter = rateLimit({
  max: 100,
  windowMs: 1000 * 60 * 60,
  message: 'Too many requests from this IP, please try again later',
});

// Limit requests from same IP. Adds new headers related to the limit
app.use('/api', limiter);

// Body parser. Without it, each time we send json data, req.body will be undefined. Limit the body to a maximum size of 10kB
app.use(express.json({ limit: '10kb' }));

// Cookie parser. Sa ovim, kada npr. console logamo req.cookies, dobijemo dobar output. A bez njega, dobijemo undefined
app.use(cookieParser());

// Kad saljemo data iz forme, ona bude url encoded. Dodamo ovaj middleware kako bismo ga valjda dekodirarli. Ovo se ne odnosi na file uploads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL Query Injection
//Primjer. ne mozemo koristiti $ selector u "email": { "$gte": "" }. Dobijemo error
app.use(mongoSanitize());

// Data sanitization against XSS (Cross Site Scripting) (npr. da ne mozemo unijeti html kod sa prikacenim js kodom)
// Primjer. "<div id='emir'></div>" pretvori u "&lt;div id='emir'>&lt;/div>"
app.use(xss());

// Http Parameter Pollution - prevent it
// Primjer. api/v1/tours?sort=-price&sort=ratingsAverage izbacuje error bez ovog jer imamo 2 sort propertyja. Ovako ce samo iskoristiti zadnji. Medjutim, problem je sto za neka polja zelimo duplikate, npr. za svaki field koji mozemo searchat (price, duration, rating..)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test custom middleware

app.use((req, res, next) => {
  // req.MyCustomRequestField = '123';
  // console.log(req.cookies);
  next();
});

// MOUNTING ROUTERS

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// 404 handler. Each route that isn't handled by our mounted routers means that it is undefined
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// globalno handlamo SVAKI ERROR koji dobijemo. Ovdje errore proslijedjujemo pomocu .next(err)
app.use(globalErrorHandler);

module.exports = app;
