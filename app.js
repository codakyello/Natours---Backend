// const http = require('http');

// // PORT
// const PORT = 3000;

// // server create
// const server = http.createServer((req, res) => {
//   if (req.url === '/') {
//     res.write('This is home page.');
//     res.end();
//   } else if (req.url === '/about' && req.method === 'GET') {
//     res.write('This is about page.');
//     res.end();
//   } else {
//     res.write('Not Found!');
//     res.end();
//   }
// });

// server listen port
// server.listen(PORT);

// console.log(`Server is running on PORT: ${PORT}`);

// Express
const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const globalErrorHandler = require('./controllers/errorController');
const { default: rateLimit } = require('express-rate-limit');
const { default: helmet } = require('helmet');

// Middlewares
app.use(helmet());

// Body parser reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration,',
      'ratingQuantity',
      'difficulty',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

// Routes
app.use('/api', limiter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

// Last middleware if no request url is found
app.use('/', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));

  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant't find ${req.originalUrl} on this server`,
  // });
});

app.use(globalErrorHandler);

module.exports = app;
