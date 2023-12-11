const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../models/tourModel');

dotenv.config({ path: '../config.env' });
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    Tour.deleteMany()
      .then(() => {
        const toursJSON = JSON.parse(
          fs.readFileSync(`${__dirname}/data/tours-simple.json`, 'utf-8')
        );
        Tour.create(toursJSON)
          .then(() => {
            process.exit();
          })
          .catch((e) => console.log(e.message));
      })
      .catch((e) => console.log(e.message));
  })
  .catch((e) => console.log(e.message));
