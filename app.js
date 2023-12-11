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

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const userRouter = require('./routes/userRoutes');

const tourRouter = require('./routes/tourRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//1.) Middlewares
app.use(express.json());

app.use('/api/v1/users', userRouter);

app.use('/api/v1/tours', tourRouter);

app.use('/', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant't find ${req.originalUrl} on this server`,
  // });

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
