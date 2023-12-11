const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const tour = await Tour.findById(id);

  if (!tour) {
    // throw new AppError('No tour found with that ID', 404);
    return next(AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
  //  catch (err) {
  //     next(new AppError(err.message, 404));
  //   }
});

exports.getAllTours = catchAsync(async (req, res, next) => {
  // try {
  const count = await Tour.find({}).countDocuments({});
  const features = new APIFeatures(Tour, req.query, count)
    .filter()
    .sort()
    .page()
    .limitFields();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    count,
    data: {
      tours,
    },
  });
  // } catch (err) {
  //   next(new AppError(err.message, 404));
  // }
});

exports.createTour = catchAsync(async (req, res, next) => {
  // try {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'Success',
    data: {
      tour: newTour,
    },
  });
  // } catch (err) {
  //   next(new AppError(err.message, 400));
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // try {
  // const tour = await Tour.updateOne(
  //   { _id: req.params.id },
  //   { $set: { rating: 5 } }
  // );

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    // throw new AppError('No tour found with that ID', 404);
    return next(AppError('No tour found with that ID', 404));
  }

  res.status(201).json({
    status: 'Success',
    data: {
      tour,
    },
  });
  // } catch (err) {
  //   // res.status(400).json({
  //   //   status: 'Failed',
  //   //   message: err.message,
  //   // });
  //   next(new AppError(err.message, 400));
  // }
});

exports.deleteTour = catchAsync(async (req, res) => {
  // Since objects are mutable we will get the index and then replace it with our new item
  // try {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    // throw new AppError('No tour found with that ID', 404);
    return next(AppError('No tour found with that ID', 404));
  }
  res.status(204).json({
    status: 'Success',
    data: null,
  });

  // } catch (err) {
  //   // res.status(400).json({
  //   //   status: 'Success',
  //   //   message: err.message,
  //   // });
  //   next(new AppError(err.message, 400));
  // }
});

exports.getTourStats = catchAsync(async (_, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numRatings: { $sum: '$ratingQuantity' },
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $min: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    { $sort: { numToursStarts: -1 } },
    { $limit: 12 },
  ]);
});
