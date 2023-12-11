const AppError = require('./appError');

class APIFeatures {
  constructor(query, queryString, count) {
    // let the query be dynamic so we can use it
    // in different places in our app
    // Global value that all my functions will interact with
    this.query = query;
    this.queryString = queryString;
    this.count = count;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFileds = ['sort', 'limit', 'fields', 'page'];
    excludedFileds.forEach((field) => delete queryObj[field]);

    // 1B) Advanced Filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.replaceAll(',', ' ');
      this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const allFields = this.queryString.fields.replaceAll(',', ' ');

      this.query = this.query.select(allFields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  page() {
    let skip, pageSize;
    if (this.queryString.limit) {
      pageSize = +this.queryString.limit;
    } else {
      pageSize = 10;
    }

    if (this.queryString.page) {
      skip = (this.queryString.page - 1) * pageSize;
      if (skip >= this.count) throw new AppError('This page does not exist');
    } else {
      skip = 0;
    }

    this.query.skip(skip).limit(pageSize);

    return this;
  }
}

module.exports = APIFeatures;
