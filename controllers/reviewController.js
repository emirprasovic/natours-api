const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

exports.setTourAndUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user.id;
  next();
};

exports.restrictActionToCurrentUser = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  // console.log(review.user.id);
  // console.log(req.user.id);
  if (review.user.id !== req.user.id)
    return next(new AppError('You cannot edit someone elses review'));
  next();
});

exports.createReview = factory.createOne(Review);

exports.deleteReivew = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.getReview = factory.getOne(Review);

exports.getAllReviews = factory.getAll(Review);
